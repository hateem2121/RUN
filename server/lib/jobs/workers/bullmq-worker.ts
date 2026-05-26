import { SpanStatusCode, trace } from "@opentelemetry/api";
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

/**
 * OB-303: OTel tracer for BullMQ background job tracing.
 * Each job execution creates a span with job metadata for cross-queue correlation.
 */
const tracer = trace.getTracer("bullmq-worker", "1.0.0");

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
        await tracer.startActiveSpan(
          `bullmq.process ${EMAIL_QUEUE_NAME}`,
          {
            attributes: {
              "bullmq.queue.name": EMAIL_QUEUE_NAME,
              "bullmq.job.id": job.id ?? "unknown",
              "bullmq.job.name": job.name,
              "bullmq.job.attempt": job.attemptsMade,
            },
          },
          async (span) => {
            try {
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
                span.setStatus({ code: SpanStatusCode.ERROR, message: "Admin notification failed" });
                throw adminResult.error;
              }

              if (customerResult.isErr()) {
                logger.error(
                  `[Worker:Email] Customer confirmation failed for job ${job.id}:`,
                  customerResult.error,
                );
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: "Customer confirmation failed",
                });
                throw customerResult.error;
              }

              span.setStatus({ code: SpanStatusCode.OK });
              logger.info(`[Worker:Email] Completed job ${job.id}`);
            } catch (error) {
              span.recordException(error as Error);
              span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
              throw error;
            } finally {
              span.end();
            }
          },
        );
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
        await tracer.startActiveSpan(
          `bullmq.process ${CACHE_INVALIDATION_QUEUE_NAME}`,
          {
            attributes: {
              "bullmq.queue.name": CACHE_INVALIDATION_QUEUE_NAME,
              "bullmq.job.id": job.id ?? "unknown",
              "bullmq.job.name": job.name,
              "bullmq.job.attempt": job.attemptsMade,
              "bullmq.cache.pattern": job.data.pattern,
            },
          },
          async (span) => {
            const { pattern } = job.data;
            try {
              logger.info(`[Worker:Cache] Invalidating pattern: ${pattern}`);
              await unifiedCache.clearPattern(pattern);
              span.setStatus({ code: SpanStatusCode.OK });
              logger.info(`[Worker:Cache] Completed invalidation: ${pattern}`);
            } catch (error) {
              logger.error(`[Worker:Cache] Failed invalidation ${pattern}:`, error);
              span.recordException(error as Error);
              span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
              throw error;
            } finally {
              span.end();
            }
          },
        );
      },
      { connection: redisConnection, concurrency: 10 },
    );
  }

  logger.info("[Worker] All workers started (Email, Cache)");
}
