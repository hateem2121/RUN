import { Queue } from "bullmq";
import type { InquiryEmailData } from "../integrations/email-service.js";
import { logger } from "../monitoring/logger.js";
import { isRedisConfigured, redisConnection } from "./connection.js";

export const EMAIL_QUEUE_NAME = "email-queue";

let emailQueue: Queue<InquiryEmailData> | null = null;

if (isRedisConfigured && redisConnection) {
  emailQueue = new Queue<InquiryEmailData>(EMAIL_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
  logger.info(`[Queue] Initialized ${EMAIL_QUEUE_NAME}`);
} else {
  logger.warn(`[Queue] Skipping ${EMAIL_QUEUE_NAME} initialization (Redis not configured)`);
}

export { emailQueue };
