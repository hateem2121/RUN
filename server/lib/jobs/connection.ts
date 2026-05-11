import { Redis } from "ioredis";
import { logger } from "../monitoring/logger.js";

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

let connection: Redis | null = null;

if (REDIS_URL) {
  try {
    connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    });

    connection.on("error", (err) => {
      logger.error("[Redis] Connection error:", err);
    });

    connection.on("connect", () => {
      logger.info("[Redis] Queue connection connection established");
    });
  } catch (error) {
    logger.error("[Redis] Failed to initialize connection:", error);
  }
} else {
  logger.warn("[Redis] REDIS_URL not found - Queues will definitely fail if used");
}

export const redisConnection = connection;
export const isRedisConfigured = !!REDIS_URL;
