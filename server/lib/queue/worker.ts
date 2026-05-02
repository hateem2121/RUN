import { type Job, Worker } from "bullmq";
import { unifiedCache } from "../cache/unified-cache.js";
import { emailService, type InquiryEmailData } from "../integrations/email-service.js";
import { logger } from "../monitoring/logger.js";
import {
  CACHE_INVALIDATION_QUEUE_NAME,
  type CacheInvalidationJobData,
} from "./cache-invalidation-queue.js";
import { isRedisConfigured, redisConnection } from "./connection.js";
import { EMAIL_QUEUE_NAME } from "./email-queue.js";

let emailWorker: Worker<InquiryEmailData> | null = null;
let cacheWorker: Worker<CacheInvalidationJobData> | null = null;

export function startWorker() {
  if (!isRedisConfigured || !redisConnection) {
    logger.warn("[Worker] Skipping worker start (Redis not configured)");
    return;
  }

  // 1. Email Worker
  if (!emailWorker) {
    emailWorker = new Worker<InquiryEmailData>(
      EMAIL_QUEUE_NAME,
      async (job: Job<InquiryEmailData>) => {
        logger.info(`[Worker:Email] Processing job ${job.id}`);
        try {
          await emailService.sendAdminNotification(job.data);
          await emailService.sendCustomerConfirmation(job.data);
          logger.info(`[Worker:Email] Completed job ${job.id}`);
        } catch (error) {
          logger.error(`[Worker:Email] Failed job ${job.id}:`, error);
          throw error;
        }
      },
      { connection: redisConnection, concurrency: 5 },
    );
  }

  // 2. Cache Invalidation Worker
  if (!cacheWorker) {
    cacheWorker = new Worker<CacheInvalidationJobData>(
      CACHE_INVALIDATION_QUEUE_NAME,
      async (job: Job<CacheInvalidationJobData>) => {
        const { pattern } = job.data;
        logger.info(`[Worker:Cache] Invalidating pattern: ${pattern}`);
        try {
          // Perform the actual invalidation in the background
          // We use clearPattern directly to avoid re-queuing
          await unifiedCache.clearPattern(pattern);
          logger.info(`[Worker:Cache] Completed invalidation: ${pattern}`);
        } catch (error) {
          logger.error(`[Worker:Cache] Failed invalidation ${pattern}:`, error);
          throw error;
        }
      },
      { connection: redisConnection, concurrency: 10 },
    );
  }

  logger.info("[Worker] All workers started (Email, Cache)");
}
