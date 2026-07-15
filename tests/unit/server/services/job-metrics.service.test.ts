import { describe, expect, it } from "vitest";
import { jobMetricsService } from "../../../../server/services/job-metrics.service.js";

describe("JobMetricsService", () => {
  describe("updateMetrics", () => {
    it("should not throw", async () => {
      await expect(jobMetricsService.updateMetrics()).resolves.toBeUndefined();
    });
  });

  describe("getQueueHealth", () => {
    it("should return status", async () => {
      const result = await jobMetricsService.getQueueHealth();
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("cache");
    });
  });
});
