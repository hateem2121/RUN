import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPoolMetrics } from "../../../../server/db.js";
import { queryPerformanceMonitor } from "../../../../server/lib/db/query-performance.js";
import { metricsService } from "../../../../server/services/metrics.service.js";

vi.mock("../../../../server/lib/db/query-performance.js", () => ({
  queryPerformanceMonitor: {
    getPerformanceStats: vi.fn(),
  },
}));

vi.mock("../../../../server/db.js", () => ({
  getPoolMetrics: vi.fn(),
}));

describe("MetricsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDatabaseMetrics", () => {
    it("should return database metrics", async () => {
      vi.mocked(queryPerformanceMonitor.getPerformanceStats).mockReturnValue({
        averageResponseTime: 10.5,
        totalQueries: 100,
        slowQueries: 0,
        maxResponseTime: 50,
      });
      vi.mocked(getPoolMetrics).mockReturnValue({
        currentConcurrentQueries: 2,
        totalConnections: 5,
        idleConnections: 3,
        waitingRequests: 0,
      });

      const result = await metricsService.getDatabaseMetrics();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({
          averageResponseTime: 10.5,
          currentConcurrentQueries: 2,
        });
      }
    });

    it("should handle errors", async () => {
      vi.mocked(queryPerformanceMonitor.getPerformanceStats).mockImplementation(() => {
        throw new Error("Test error");
      });

      const result = await metricsService.getDatabaseMetrics();
      expect(result.isErr()).toBe(true);
    });
  });
});
