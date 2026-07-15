import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../../../../server/lib/env";
import metricsRouter from "../../../../server/routes/metrics";

// Mock all the dependencies
vi.mock("../../../../server/lib/env", () => ({
  env: {
    METRICS_SECRET: "test-secret",
    NODE_ENV: "test",
  },
}));

vi.mock("../../../../server/lib/monitoring/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("prom-client", () => {
  const mockSet = vi.fn();
  return {
    default: {
      Gauge: class {
        set = mockSet;
      },
      collectDefaultMetrics: vi.fn(),
      register: {
        contentType: "text/plain",
        metrics: vi.fn().mockResolvedValue("mock-metrics-data"),
      },
    },
  };
});

vi.mock("../../../../server/lib/monitoring/http-metrics", () => ({
  httpMetricsTracker: {
    getAllRouteMetrics: vi
      .fn()
      .mockReturnValue(
        new Map([["GET /api/test", { avgDuration: 100, statusCodes: { 200: 5, 500: 1 } }]]),
      ),
  },
}));

vi.mock("../../../../server/lib/cache/unified-cache", () => ({
  UnifiedCache: {
    getInstance: vi.fn().mockReturnValue({
      getMetrics: vi.fn().mockReturnValue({ hits: 10, misses: 2 }),
    }),
  },
}));

vi.mock("../../../../server/lib/cache/two-tier-batch", () => ({
  twoTierBatchCache: {
    getMetrics: vi.fn().mockReturnValue({ totalRequests: 100, hitRate: 80, missRate: 20 }),
  },
}));

vi.mock("../../../../server/services/metrics.service", () => ({
  metricsService: {
    getDatabaseMetrics: vi.fn().mockResolvedValue({
      isOk: () => true,
      value: { averageResponseTime: 50, currentConcurrentQueries: 3 },
    }),
  },
}));

vi.mock("../../../../server/lib/monitoring/error-aggregator", () => ({
  errorAggregator: {
    getMetrics: vi.fn().mockReturnValue({
      totalErrors: 5,
      errorsByType: { DB_ERROR: 2 },
      errorsBySeverity: { high: 1 },
    }),
  },
}));

const app = express();
app.use("/", metricsRouter);

describe("Metrics Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should refuse access if no secret is configured", async () => {
    env.METRICS_SECRET = "";
    env.HEALTH_CHECK_SECRET = "";
    env.NODE_ENV = "production";

    const response = await request(app).get("/");
    expect(response.status).toBe(500);
    expect(response.body.error).toContain("configuration error");

    // Restore env
    env.METRICS_SECRET = "test-secret";
    env.NODE_ENV = "test";
  });

  it("should return 401 if unauthorized", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(401);
  });

  it("should return 401 if wrong secret provided", async () => {
    const response = await request(app).get("/?key=wrong");
    expect(response.status).toBe(401);
  });

  it("should return metrics with correct secret in query", async () => {
    const response = await request(app).get("/?key=test-secret");
    expect(response.status).toBe(200);
    expect(response.header["content-type"]).toContain("text/plain");
    expect(response.text).toBe("mock-metrics-data");
  });

  it("should return metrics with correct secret in header", async () => {
    const response = await request(app).get("/").set("x-metrics-key", "test-secret");
    expect(response.status).toBe(200);
    expect(response.text).toBe("mock-metrics-data");
  });
});
