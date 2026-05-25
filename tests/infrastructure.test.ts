// Set env vars BEFORE imports
process.env.NODE_ENV = "production";
process.env.GOOGLE_CLOUD_PROJECT = "test-project";
process.env.RECAPTCHA_SECRET_KEY = "test-secret";

import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emailService } from "../server/lib/integrations/email-service.js";
import { verifyCloudTaskToken } from "../server/lib/verify-cloud-task-token.js";
import { registerRoutes } from "../server/routes/index.js";

// Mock verifyCloudTaskToken so production OIDC check passes in tests
vi.mock("../server/lib/verify-cloud-task-token.js", () => ({
  verifyCloudTaskToken: vi.fn().mockResolvedValue(true),
}));

// Mock Logger to avoid environment validation
vi.mock("../server/lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Environment Config
vi.mock("../server/config/environment.js", () => ({
  getConfig: vi.fn().mockReturnValue({
    app: { environment: "production" },
    database: { url: "postgres://mock" },
    redis: { url: "redis://mock" },
  }),
  validateEnvironment: vi.fn(),
  isDevelopment: false,
  logging: { level: "info" },
}));

// Mock DB — must expose full Drizzle query-builder chain because ProductRepository
// eagerly initialises prepared statements (db.select(...).from(...).prepare()) at import time.
// vi.hoisted() ensures the chain object is available before the mock factory runs.
const { _selectChain } = vi.hoisted(() => ({
  _selectChain: {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    having: vi.fn().mockReturnThis(),
    prepare: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue([]) }),
  },
}));
vi.mock("../server/db.ts", () => ({
  db: {
    execute: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockReturnValue(_selectChain),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    }),
  },
}));

// Mock Rate Limiter
vi.mock("../server/lib/resilience/rate-limiter.js", () => ({
  adminLimiter: { middleware: () => (_req, _res, next) => next() },
  diagnosticLimiter: { middleware: () => (_req, _res, next) => next() },
}));

// Mock dependencies
vi.mock("@google-cloud/tasks", () => {
  const CloudTasksClient = vi.fn();
  CloudTasksClient.prototype.queuePath = vi.fn().mockReturnValue("projects/p/locations/l/queues/q");
  CloudTasksClient.prototype.createTask = vi.fn().mockResolvedValue([{ name: "task-id" }]);
  return { CloudTasksClient };
});

vi.mock("@google-cloud/bigquery", () => {
  const BigQuery = vi.fn();
  BigQuery.prototype.dataset = vi.fn().mockReturnThis();
  BigQuery.prototype.table = vi.fn().mockReturnThis();
  BigQuery.prototype.insert = vi.fn().mockResolvedValue([{}]);
  return { BigQuery };
});

vi.mock("../server/lib/integrations/email-service.js", () => ({
  emailService: {
    sendAdminNotification: vi
      .fn()
      .mockResolvedValue({ isOk: () => true, isErr: () => false, value: true }),
    sendCustomerConfirmation: vi
      .fn()
      .mockResolvedValue({ isOk: () => true, isErr: () => false, value: true }),
  },
}));

// Mock Storage to avoid DB connection
vi.mock("../server/lib/storage-singleton.js", () => {
  const mockStorage = {
    createInquiry: vi.fn().mockResolvedValue({
      id: 123,
      name: "Test User",
      email: "test@example.com",
      message: "Test message",
      submittedAt: new Date(),
    }),
    getUser: vi.fn().mockResolvedValue({ id: 1, isAdmin: true }),
    checkDatabaseHealth: vi.fn().mockResolvedValue({ healthy: true, latency: 10 }),
    getContactPageConfiguration: vi.fn().mockResolvedValue({ email: "contact@example.com" }),
  };
  return {
    StorageSingleton: {
      hasInstance: vi.fn().mockReturnValue(true),
      getInstance: vi.fn().mockReturnValue(mockStorage),
      setInstance: vi.fn(),
    },
    getStorage: vi.fn().mockReturnValue(mockStorage),
  };
});

describe("Infrastructure Remediation Verification", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "production";
    process.env.GOOGLE_CLOUD_PROJECT = "test-project";
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  it("should reject contact submission without reCAPTCHA token in production", async () => {
    const response = await request(app).post("/api/contact").send({
      name: "Test User",
      email: "test@example.com",
      message: "Hello world",
    });

    expect(response.status).toBe(422);
    expect(response.body.error).toContain("Bot detected");
  });

  it("should process worker email task correctly", async () => {
    // OIDC token is verified — mock returns true (authorized)
    vi.mocked(verifyCloudTaskToken).mockResolvedValueOnce(true);

    const payload = {
      id: 123,
      name: "Test User",
      email: "test@example.com",
      message: "Hello world",
      submittedAt: new Date(),
    };

    const response = await request(app)
      .post("/api/worker/send-email")
      .set("Authorization", "Bearer mock-valid-oidc-token")
      .send(payload);

    expect(response.status).toBe(200);
    expect(emailService.sendAdminNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 123,
        email: "test@example.com",
      }),
    );
    expect(emailService.sendCustomerConfirmation).toHaveBeenCalled();
  });

  it("should reject worker access without valid OIDC token in production", async () => {
    // No Authorization header → verifyCloudTaskToken returns false
    vi.mocked(verifyCloudTaskToken).mockResolvedValueOnce(false);

    const response = await request(app).post("/api/worker/send-email").send({});

    expect(response.status).toBe(403);
  });
});
