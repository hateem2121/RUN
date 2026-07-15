import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryPerformanceMonitor } from "../../../../../server/lib/db/query-performance";
import { alertManager } from "../../../../../server/lib/monitoring/alert-manager";
import { errorAggregator } from "../../../../../server/lib/monitoring/error-aggregator";
import { httpMetricsTracker } from "../../../../../server/lib/monitoring/http-metrics";
import { appStorageService } from "../../../../../server/lib/storage/app-service";

vi.mock("../../../../../server/lib/db/query-performance", () => ({
  queryPerformanceMonitor: {
    getPerformanceStats: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/monitoring/error-aggregator", () => ({
  errorAggregator: {
    getMetrics: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/monitoring/http-metrics", () => ({
  httpMetricsTracker: {
    getStats: vi.fn(),
    getStatusCodeCategories: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/storage/app-service", () => ({
  appStorageService: {
    getCircuitStatus: vi.fn(),
  },
}));

vi.mock("../../../../../server/lib/monitoring/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("node:v8", () => ({
  writeHeapSnapshot: vi.fn(),
  default: {
    writeHeapSnapshot: vi.fn(),
  },
}));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
  };
});

const originalMemoryUsage = process.memoryUsage;

describe("AlertManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    alertManager.clearAlerts();
    // Default mocks for checkMetrics
    vi.mocked(queryPerformanceMonitor.getPerformanceStats).mockReturnValue({
      totalQueries: 0,
      slowQueries: 0,
      averageResponseTime: 0,
      recentSlowQueries: [],
    } as any);

    vi.mocked(errorAggregator.getMetrics).mockReturnValue({
      totalErrors: 0,
      errorRate: { last5Min: 0, last15Min: 0, last1Hour: 0 },
      errorsByType: {},
      errorsBySeverity: {},
    } as any);

    vi.mocked(httpMetricsTracker.getStats).mockReturnValue({
      totalRequests: 0,
    } as any);
    vi.mocked(httpMetricsTracker.getStatusCodeCategories).mockReturnValue({});

    vi.mocked(appStorageService.getCircuitStatus).mockReturnValue({
      state: "CLOSED",
    } as any);

    alertManager.updateThresholds({
      slowQuery: { durationMs: 1000, enabled: true },
      errorRate: { percentageThreshold: 5, timeWindowMinutes: 5 },
      httpErrorRate: { percentageThreshold: 5 },
      circuitBreaker: { alertOnOpen: true, alertOnHalfOpen: true },
      memory: { percentageThreshold: 80 },
      dbConnection: { alertOnError: true, alertOnTimeout: true },
      gcPause: { enabled: false, thresholdMs: 100 },
    });
  });

  afterEach(() => {
    process.memoryUsage = originalMemoryUsage;
  });

  describe("Slow Queries", () => {
    it("should generate alert when slow query rate exceeds 50%", () => {
      vi.mocked(queryPerformanceMonitor.getPerformanceStats).mockReturnValue({
        totalQueries: 100,
        slowQueries: 60,
        averageResponseTime: 500,
        recentSlowQueries: [],
      } as any);

      const alerts = alertManager.checkMetrics();
      const slowQueryAlerts = alerts.filter((a) => a.type === "slow_query");

      expect(slowQueryAlerts.length).toBe(1);
      expect(slowQueryAlerts[0].severity).toBe("warning");
    });

    it("should generate alert when average response time exceeds threshold", () => {
      vi.mocked(queryPerformanceMonitor.getPerformanceStats).mockReturnValue({
        totalQueries: 100,
        slowQueries: 10,
        averageResponseTime: 2500,
        recentSlowQueries: [],
      } as any);

      const alerts = alertManager.checkMetrics();
      const slowQueryAlerts = alerts.filter((a) => a.type === "slow_query");

      expect(slowQueryAlerts.length).toBe(1);
    });

    it("should not alert if within thresholds", () => {
      vi.mocked(queryPerformanceMonitor.getPerformanceStats).mockReturnValue({
        totalQueries: 100,
        slowQueries: 10,
        averageResponseTime: 500,
        recentSlowQueries: [],
      } as any);

      const alerts = alertManager.checkMetrics();
      expect(alerts.filter((a) => a.type === "slow_query").length).toBe(0);
    });
  });

  describe("Error Rate", () => {
    it("should generate alert when error rate exceeds threshold", () => {
      vi.mocked(errorAggregator.getMetrics).mockReturnValue({
        totalErrors: 100,
        errorRate: { last5Min: 10, last15Min: 20, last1Hour: 50 },
        errorsByType: {},
        errorsBySeverity: {},
      } as any);

      const alerts = alertManager.checkMetrics();
      const errorAlerts = alerts.filter((a) => a.type === "error_rate");

      expect(errorAlerts.length).toBe(1);
      expect(errorAlerts[0].severity).toBe("critical");
    });

    it("should not alert if total errors is too low", () => {
      vi.mocked(errorAggregator.getMetrics).mockReturnValue({
        totalErrors: 5,
        errorRate: { last5Min: 5, last15Min: 5, last1Hour: 5 },
        errorsByType: {},
        errorsBySeverity: {},
      } as any);

      const alerts = alertManager.checkMetrics();
      expect(alerts.filter((a) => a.type === "error_rate").length).toBe(0);
    });
  });

  describe("HTTP Error Rate", () => {
    it("should generate alert when HTTP 5xx rate exceeds threshold", () => {
      vi.mocked(httpMetricsTracker.getStats).mockReturnValue({
        totalRequests: 200,
      } as any);
      vi.mocked(httpMetricsTracker.getStatusCodeCategories).mockReturnValue({
        "5xx": 20,
        "2xx": 180,
      } as any);

      const alerts = alertManager.checkMetrics();
      const httpAlerts = alerts.filter((a) => a.type === "http_error_rate");

      expect(httpAlerts.length).toBe(1);
      expect(httpAlerts[0].severity).toBe("critical");
    });

    it("should not alert if sample size too small", () => {
      vi.mocked(httpMetricsTracker.getStats).mockReturnValue({
        totalRequests: 50,
      } as any);
      vi.mocked(httpMetricsTracker.getStatusCodeCategories).mockReturnValue({
        "5xx": 20,
      } as any);

      const alerts = alertManager.checkMetrics();
      expect(alerts.filter((a) => a.type === "http_error_rate").length).toBe(0);
    });
  });

  describe("Circuit Breaker", () => {
    it("should generate alert when circuit is OPEN", () => {
      vi.mocked(appStorageService.getCircuitStatus).mockReturnValue({
        state: "OPEN",
        failureCount: 5,
        totalFailures: 5,
        stateChanges: 1,
        lastStateChange: Date.now(),
      } as any);

      const alerts = alertManager.checkMetrics();
      const cbAlerts = alerts.filter((a) => a.type === "circuit_breaker");

      expect(cbAlerts.length).toBe(1);
      expect(cbAlerts[0].severity).toBe("critical");
    });

    it("should generate alert when circuit is HALF_OPEN", () => {
      vi.mocked(appStorageService.getCircuitStatus).mockReturnValue({
        state: "HALF_OPEN",
        successCount: 1,
        failureCount: 1,
        totalSuccesses: 1,
      } as any);

      const alerts = alertManager.checkMetrics();
      const cbAlerts = alerts.filter((a) => a.type === "circuit_breaker");

      expect(cbAlerts.length).toBe(1);
      expect(cbAlerts[0].severity).toBe("warning");
    });
  });

  describe("Memory Usage", () => {
    it("should generate warning alert when memory > 80%", () => {
      process.memoryUsage = vi.fn().mockReturnValue({
        heapTotal: 100,
        heapUsed: 85,
        rss: 100,
        external: 0,
      });

      const alerts = alertManager.checkMetrics();
      const memAlerts = alerts.filter((a) => a.type === "memory");

      expect(memAlerts.length).toBe(1);
      expect(memAlerts[0].severity).toBe("warning");
    });

    it("should generate critical alert when memory > 90%", () => {
      process.memoryUsage = vi.fn().mockReturnValue({
        heapTotal: 100,
        heapUsed: 95,
        rss: 100,
        external: 0,
      });

      const alerts = alertManager.checkMetrics();
      const memAlerts = alerts.filter((a) => a.type === "memory");

      expect(memAlerts.length).toBe(1);
      expect(memAlerts[0].severity).toBe("critical");
    });
  });

  describe("Cooldown Mechanism", () => {
    it("should not generate same alert within cooldown period", () => {
      vi.mocked(queryPerformanceMonitor.getPerformanceStats).mockReturnValue({
        totalQueries: 100,
        slowQueries: 60,
        averageResponseTime: 500,
        recentSlowQueries: [],
      } as any);

      const firstAlerts = alertManager.checkMetrics();
      expect(firstAlerts.filter((a) => a.type === "slow_query").length).toBe(1);

      const secondAlerts = alertManager.checkMetrics();
      expect(secondAlerts.filter((a) => a.type === "slow_query").length).toBe(0);
    });
  });

  describe("Config Updates", () => {
    it("should update thresholds deeply", () => {
      alertManager.updateThresholds({
        slowQuery: { durationMs: 5000 },
      });

      const thresholds = alertManager.getThresholds();
      expect(thresholds.slowQuery.durationMs).toBe(5000);
      expect(thresholds.slowQuery.enabled).toBe(true);
    });
  });

  describe("Alert Management", () => {
    it("should return recent alerts", () => {
      vi.mocked(queryPerformanceMonitor.getPerformanceStats).mockReturnValue({
        totalQueries: 100,
        slowQueries: 60,
        averageResponseTime: 500,
        recentSlowQueries: [],
      } as any);
      alertManager.checkMetrics();

      const alerts = alertManager.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe("slow_query");

      const byType = alertManager.getAlertsByType("slow_query");
      expect(byType.length).toBeGreaterThan(0);
    });
  });
});
