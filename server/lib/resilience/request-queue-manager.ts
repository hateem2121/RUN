/**
 * FORENSIC INVESTIGATION - Phase 4: Request Queue Manager
 * Prevents connection exhaustion by limiting concurrent requests
 */

import PQueue from "p-queue";
import { logger } from "../monitoring/logger.js";

export class RequestQueueManager {
  private static instance: RequestQueueManager | null = null;
  private queue: PQueue;
  private stats = {
    totalQueued: 0,
    totalCompleted: 0,
    totalFailed: 0,
    currentPending: 0,
    peakPending: 0,
  };

  private constructor() {
    // FORENSIC FIX: Limit concurrent GCS/media requests to prevent browser connection exhaustion
    this.queue = new PQueue({
      concurrency: 10, // Max 10 simultaneous requests
      interval: 1000, // 1 second interval
      intervalCap: 20, // Max 20 requests per interval (rate limiting)
      timeout: 30000, // 30s timeout per request
    });

    // Monitor queue events
    this.queue.on("add", () => {
      this.stats.totalQueued++;
      this.stats.currentPending = this.queue.pending;
      if (this.stats.currentPending > this.stats.peakPending) {
        this.stats.peakPending = this.stats.currentPending;
      }
    });

    this.queue.on("completed", () => {
      this.stats.totalCompleted++;
      this.stats.currentPending = this.queue.pending;
    });

    this.queue.on("error", (error) => {
      this.stats.totalFailed++;
      this.stats.currentPending = this.queue.pending;
      logger.warn("[RequestQueue] Request failed:", error.message);
    });

    logger.info("[RequestQueue] ✅ Initialized with concurrency limit: 10");
  }

  public static getInstance(): RequestQueueManager {
    if (!RequestQueueManager.instance) {
      RequestQueueManager.instance = new RequestQueueManager();
    }
    return RequestQueueManager.instance;
  }

  /**
   * Add a request to the queue with priority support
   */
  async add<T>(
    fn: () => Promise<T>,
    options?: { priority?: number | undefined; signal?: AbortSignal },
  ): Promise<T> {
    const { priority = 0, signal } = options || {};

    // Check if request is already aborted
    if (signal?.aborted) {
      throw new Error("Request aborted before queuing");
    }

    return this.queue.add(
      async () => {
        // Check abort signal before executing
        if (signal?.aborted) {
          throw new Error("Request aborted");
        }

        try {
          return await fn();
        } catch (error) {
          // Don't log abort errors
          if (error instanceof Error && error.message !== "Request aborted") {
            logger.error("[RequestQueue] Request execution failed:", error.message);
          }
          throw error;
        }
      },
      { priority },
    );
  }

  /**
   * Add multiple requests with automatic batching
   */
  async addAll<T>(
    fns: Array<() => Promise<T>>,
    options?: { priority?: number | undefined; signal?: AbortSignal },
  ): Promise<T[]> {
    const promises = fns.map((fn) => this.add(fn, options));
    return Promise.all(promises);
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused,
    };
  }

  /**
   * Get queue health status
   */
  getHealthStatus() {
    const queueUtilization = (this.queue.pending / 10) * 100; // 10 is concurrency limit
    const issues: string[] = [];

    if (queueUtilization > 80) {
      issues.push(`High queue utilization: ${Math.round(queueUtilization)}%`);
    }

    if (this.queue.size > 50) {
      issues.push(`Large queue size: ${this.queue.size} pending requests`);
    }

    const failureRate =
      this.stats.totalQueued > 0 ? (this.stats.totalFailed / this.stats.totalQueued) * 100 : 0;

    if (failureRate > 10) {
      issues.push(`High failure rate: ${Math.round(failureRate)}%`);
    }

    return {
      healthy: issues.length === 0,
      status: issues.length === 0 ? "healthy" : issues.length === 1 ? "degraded" : "unhealthy",
      stats: this.getStats(),
      issues,
      timestamp: Date.now(),
    };
  }

  /**
   * Clear the queue (useful for navigation)
   */
  clear() {
    this.queue.clear();
    logger.info("[RequestQueue] Queue cleared");
  }

  /**
   * Pause the queue
   */
  pause() {
    this.queue.pause();
    logger.info("[RequestQueue] Queue paused");
  }

  /**
   * Resume the queue
   */
  start() {
    this.queue.start();
    logger.info("[RequestQueue] Queue resumed");
  }
}

// Export singleton instance
export const requestQueue = RequestQueueManager.getInstance();
