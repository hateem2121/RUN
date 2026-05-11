import type { InquiryEmailJobData as InquiryEmailData } from "@run-remix/shared";
import { type Job, Worker } from "bullmq";
import { unifiedCache } from "../../cache/unified-cache.js";
import { emailService } from "../../integrations/email-service.js";
import { logger } from "../../monitoring/logger.js";
import { isRedisConfigured, redisConnection } from "../connection.js";
import {
  CACHE_INVALIDATION_QUEUE_NAME,
  type CacheInvalidationJobData,
} from "../queues/cache-invalidation-queue.js";
import { EMAIL_QUEUE_NAME } from "../queues/email-queue.js";

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

        const [adminResult, customerResult] = await Promise.all([
          emailService.sendAdminNotification(job.data),
          emailService.sendCustomerConfirmation(job.data),
        ]);

        if (adminResult.isErr()) {
          logger.error(
            `[Worker:Email] Admin notification failed for job ${job.id}:`,
            adminResult.error,
          );
          throw adminResult.error;
        }

        if (customerResult.isErr()) {
          logger.error(
            `[Worker:Email] Customer confirmation failed for job ${job.id}:`,
            customerResult.error,
          );
          throw customerResult.error;
        }

        logger.info(`[Worker:Email] Completed job ${job.id}`);
      },
      { connection: redisConnection, concurrency: 5 },
    );

    // [WJ-107] Basic failure monitoring
    emailWorker.on("failed", (job, err) => {
      logger.error(`[Worker:Email] Job ${job?.id} failed definitively:`, err);
    });
  }

  // 2. Cache Invalidation Worker
  if (!cacheWorker) {
    cacheWorker = new Worker<CacheInvalidationJobData>(
      CACHE_INVALIDATION_QUEUE_NAME,
      async (job: Job<CacheInvalidationJobData>) => {
        const { pattern } = job.data;
        logger.info(`[Worker:Cache] Invalidating pattern: ${pattern}`);
        try {
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
