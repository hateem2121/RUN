import { Gauge, Histogram } from "prom-client";
import { cacheInvalidationQueue } from "../lib/jobs/queues/cache-invalidation-queue.js";
import { emailQueue } from "../lib/jobs/queues/email-queue.js";
import { logger } from "../lib/monitoring/logger.js";

// Prometheus Gauges
const queueDepthGauge = new Gauge({
  name: "bullmq_queue_depth",
  help: "Current number of jobs in the queue",
  labelNames: ["queue", "status"],
});

const queueFailedTotal = new Gauge({
  name: "bullmq_failed_total",
  help: "Total number of failed jobs in the queue",
  labelNames: ["queue"],
});

export const workerTaskDuration = new Histogram({
  name: "worker_task_duration_seconds",
  help: "Duration of background worker tasks in seconds",
  labelNames: ["operation", "status"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

export class JobMetricsService {
  /**
   * Updates Prometheus gauges with current BullMQ stats
   */
  async updateMetrics(): Promise<void> {
    const queues = [
      { name: "email", instance: emailQueue },
      { name: "cache", instance: cacheInvalidationQueue },
    ];

    for (const { name, instance } of queues) {
      if (!instance) continue;

      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          instance.getWaitingCount(),
          instance.getActiveCount(),
          instance.getCompletedCount(),
          instance.getFailedCount(),
          instance.getDelayedCount(),
        ]);

        queueDepthGauge.set({ queue: name, status: "waiting" }, waiting);
        queueDepthGauge.set({ queue: name, status: "active" }, active);
        queueDepthGauge.set({ queue: name, status: "completed" }, completed);
        queueDepthGauge.set({ queue: name, status: "failed" }, failed);
        queueDepthGauge.set({ queue: name, status: "delayed" }, delayed);

        queueFailedTotal.set({ queue: name }, failed);
      } catch (error) {
        logger.error(`[JobMetricsService] Failed to update metrics for queue ${name}`, error);
      }
    }
  }

  /**
   * Returns a snapshot of current queue health for the health endpoint
   */
  async getQueueHealth() {
    const queues = [
      { name: "email", instance: emailQueue },
      { name: "cache", instance: cacheInvalidationQueue },
    ];

    const health: Record<string, unknown> = {};

    for (const { name, instance } of queues) {
      if (!instance) {
        health[name] = { status: "not_configured" };
        continue;
      }

      try {
        const counts = await instance.getJobCounts("waiting", "active", "failed", "delayed");
        health[name] = {
          status: "active",
          counts,
        };
      } catch (error) {
        health[name] = { status: "error", error: (error as Error).message };
      }
    }

    return health;
  }
}

export const jobMetricsService = new JobMetricsService();
