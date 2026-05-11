import { Queue } from "bullmq";
import { logger } from "../../monitoring/logger.js";
import { isRedisConfigured, redisConnection } from "../connection.js";

export const CACHE_INVALIDATION_QUEUE_NAME = "cache-invalidation";

export interface CacheInvalidationJobData {
  pattern: string;
}

// Initialize queue
export const cacheInvalidationQueue =
  isRedisConfigured && redisConnection
    ? new Queue<CacheInvalidationJobData>(CACHE_INVALIDATION_QUEUE_NAME, {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      })
    : null;

/**
 * Offload expensive cache invalidation (Redis SCAN/DEL) to background queue
 */
export async function queueCacheInvalidation(pattern: string): Promise<boolean> {
  if (!cacheInvalidationQueue) {
    logger.debug("[CacheQueue] Redis not configured, skipping queue");
    return false;
  }

  try {
    await cacheInvalidationQueue.add(
      "invalidate",
      { pattern },
      {
        jobId: `invalidate:${pattern}:${Date.now()}`,
      },
    );
    logger.debug(`[CacheQueue] Invalidation job queued: ${pattern}`);
    return true;
  } catch (error) {
    logger.error(`[CacheQueue] Failed to queue invalidation job: ${pattern}`, error);
    return false;
  }
}
