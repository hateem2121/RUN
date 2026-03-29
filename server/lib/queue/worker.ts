import { type Job, Worker } from "bullmq";
import { emailService, type InquiryEmailData } from "../integrations/email-service.js";
import { logger } from "../monitoring/logger.js";
import { isRedisConfigured, redisConnection } from "./connection.js";
import { EMAIL_QUEUE_NAME } from "./email-queue.js";

let worker: Worker<InquiryEmailData> | null = null;

export function startWorker() {
  if (!isRedisConfigured || !redisConnection) {
    logger.warn("[Worker] Skipping worker start (Redis not configured)");
    return;
  }

  if (worker) {
    logger.info("[Worker] Worker already running");
    return;
  }

  worker = new Worker<InquiryEmailData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<InquiryEmailData>) => {
      logger.info(`[Worker] Processing email job ${job.id}`);

      try {
        await emailService.sendAdminNotification(job.data);
        await emailService.sendCustomerConfirmation(job.data);
        logger.info(`[Worker] Completed email job ${job.id}`);
      } catch (error) {
        logger.error(`[Worker] Failed email job ${job.id}:`, error);
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );

  worker.on("completed", (job) => {
    logger.debug(`[Worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`[Worker] Job ${job?.id} failed:`, err);
  });

  logger.info("[Worker] Email worker started");
}
