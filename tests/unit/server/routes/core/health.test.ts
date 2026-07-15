import { err, ok } from "neverthrow";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../server/services/system.service.js", () => ({
  systemService: {
    checkDatabaseConnectivity: vi.fn(),
  },
}));

vi.mock("../../../../../server/services/job-metrics.service.js", () => ({
  jobMetricsService: {
    getQueueHealth: vi.fn().mockResolvedValue({}),
    updateMetrics: vi.fn().mockResolvedValue(true),
  },
}));

import express from "express";
import healthRouter from "../../../../../server/routes/core/health.js";
import { systemService } from "../../../../../server/services/system.service.js";

const app = express();
app.use(express.json());
app.use("/api/health", healthRouter);

vi.mock("../../../../../server/lib/env.js", () => ({
  env: {
    HEALTH_CHECK_MEMORY_LIMIT: 512 * 1024 * 1024,
  },
}));

const originalMemoryUsage = process.memoryUsage;

describe("Core Health Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.memoryUsage = () => ({ heapUsed: 1000 }) as any;
  });

  afterEach(() => {
    process.memoryUsage = originalMemoryUsage;
  });

  describe("GET /api/health", () => {
    it("should return ok", async () => {
      const response = await request(app).get("/api/health");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
    });
  });

  describe("GET /api/health/live", () => {
    it("should return ok", async () => {
      const response = await request(app).get("/api/health/live");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
    });
  });

  describe("GET /api/health/ready", () => {
    it("should return ok if db is reachable", async () => {
      vi.mocked(systemService.checkDatabaseConnectivity).mockResolvedValue(ok(true));
      const response = await request(app).get("/api/health/ready");
      expect(response.status).toBe(200);
      expect(response.body.database).toBe("up");
    });

    it("should return 503 if db is not reachable", async () => {
      vi.mocked(systemService.checkDatabaseConnectivity).mockResolvedValue(
        err(new Error("DB Down") as any),
      );
      const response = await request(app).get("/api/health/ready");
      expect(response.status).toBe(503);
      expect(response.body.database).toBe("down");
    });
  });

  describe("GET /api/health/deep", () => {
    it("should return detailed health status", async () => {
      vi.mocked(systemService.checkDatabaseConnectivity).mockResolvedValue(ok(true));
      const response = await request(app).get("/api/health/deep");
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ok");
      expect(response.body.services.database.status).toBe("up");
    });

    it("should return 503 if db is down in deep check", async () => {
      vi.mocked(systemService.checkDatabaseConnectivity).mockResolvedValue(
        err(new Error("DB Down") as any),
      );
      const response = await request(app).get("/api/health/deep");
      expect(response.status).toBe(503);
      expect(response.body.status).toBe("unhealthy");
      expect(response.body.services.database.status).toBe("down");
    });
  });
});
