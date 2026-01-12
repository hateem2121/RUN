import { Redis } from "@upstash/redis";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/monitoring/logger.js";

// Initialize Redis if available
let redis: Redis | undefined;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = Redis.fromEnv();
  } catch (_error) {
    logger.warn("[Idempotency] Failed to initialize Redis, idempotency disabled");
  }
}

interface StoredResponse {
  status: number;
  headers: Record<string, any>;
  body: any;
  timestamp: string;
}

/**
 * Idempotency Middleware
 * Ensures safe retries for POST/PATCH operations
 * Stores successful responses for 24 hours
 */
export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers["idempotency-key"] as string;

  // Skip if no key or no Redis
  if (!idempotencyKey || !redis) {
    return next();
  }

  // Only apply to mutating methods
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
    return next();
  }

  const key = `idempotency:${idempotencyKey}`;

  try {
    // Check for existing response
    const cached = await redis.get<StoredResponse>(key);

    if (cached) {
      logger.info(`[Idempotency] Hit for key: ${idempotencyKey}`);

      // Replay headers and status
      res.status(cached.status);
      Object.entries(cached.headers || {}).forEach(([header, value]) => {
        if (header.toLowerCase() !== "content-length") {
          // Recalculated automatically
          res.setHeader(header, value as string);
        }
      });
      res.setHeader("X-Idempotency-Hit", "true");

      return res.json(cached.body);
    }

    // Hook response to cache it on finish
    // We override json/send to capture the body
    const originalJson = res.json;

    // Simple capture for JSON responses
    res.json = function (body) {
      // Only cache successful or client error responses, not server crashes
      if (res.statusCode < 500) {
        // Fire and forget cache set
        redis
          ?.set(
            key,
            {
              status: res.statusCode,
              headers: res.getHeaders(),
              body,
              timestamp: new Date().toISOString(),
            },
            { ex: 86400 }, // 24 hours
          )
          .catch((err) => logger.error("[Idempotency] Failed to cache response", err));
      }

      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    logger.error("[Idempotency] Error processing key", error);
    // Fail open: continue processing request if cache fails
    next();
  }
};
