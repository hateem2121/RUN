// Set env vars BEFORE imports
process.env.NODE_ENV = "production";
process.env.GOOGLE_CLOUD_PROJECT = "test-project";
process.env.RECAPTCHA_SECRET_KEY = "test-secret";

import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emailService } from "../server/lib/email-service.js";
import { registerRoutes } from "../server/routes/index.js";

// Mock Logger to avoid environment validation
vi.mock("../server/lib/smart-logger.js", () => ({
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
}));

// Mock DB
vi.mock("../server/db.ts", () => ({
  db: {},
}));

// Mock Rate Limiter
vi.mock("../server/lib/rate-limiter.js", () => ({
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

vi.mock("../server/lib/email-service.js", () => ({
  emailService: {
    sendAdminNotification: vi.fn().mockResolvedValue(true),
    sendCustomerConfirmation: vi.fn().mockResolvedValue(true),
  },
}));

// Mock Google Auth setup to avoid DB connection
vi.mock("../server/googleAuth.js", () => ({
  setupAuth: vi.fn().mockResolvedValue(true),
  isAuthenticated: (_req, _res, next) => next(),
}));

// Mock Storage to avoid DB connection
vi.mock("../server/lib/storage-singleton.js", () => ({
  getStorage: vi.fn().mockReturnValue({
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
  }),
}));

// Mock Cache
vi.mock("../server/lib/unified-replit-cache.js", () => ({
  unifiedCache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(true),
    warmCache: vi.fn().mockResolvedValue(true),
  },
  UnifiedReplitCache: {
    TTL_PRESETS: {
      STATIC: 3600,
      DYNAMIC: 60,
    },
    getInstance: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(true),
      delete: vi.fn().mockResolvedValue(true),
    }),
  },
}));

// Mock DB Keep Alive
vi.mock("../server/lib/database-keep-alive.js", () => ({
  dbKeepAlive: {
    start: vi.fn(),
  },
}));

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

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("Bot detected");
  });

  it("should process worker email task correctly", async () => {
    const payload = {
      id: 123,
      name: "Test User",
      email: "test@example.com",
      message: "Hello world",
      submittedAt: new Date(),
    };

    const response = await request(app)
      .post("/api/workers/send-email")
      .set("X-CloudTasks-QueueName", "email-queue") // Simulate Cloud Tasks header
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

  it("should reject worker access without Cloud Tasks header in production", async () => {
    const response = await request(app).post("/api/workers/send-email").send({});

    expect(response.status).toBe(403);
  });
});
