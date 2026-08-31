import { Histogram } from "prom-client";

export const workerTaskDuration = new Histogram({
  name: "worker_task_duration_seconds",
  help: "Duration of background worker tasks in seconds",
  labelNames: ["operation", "status"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

class JobMetricsService {
  /**
   * Updates Prometheus gauges with current stats
   */
  async updateMetrics(): Promise<void> {
    // BullMQ queues have been removed
  }

  /**
   * Returns a snapshot of current queue health for the health endpoint
   */
  async getQueueHealth() {
    return {
      email: { status: "migrated_to_cloud_tasks" },
      cache: { status: "migrated_to_sync" },
    };
  }
}

export const jobMetricsService = new JobMetricsService();
