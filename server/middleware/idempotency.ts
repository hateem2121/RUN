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

// In-memory fallback for development/testing
const memoryStore = new Map<string, StoredResponse>();

/**
 * Idempotency Middleware
 * Ensures safe retries for POST/PATCH operations
 * Stores successful responses for 24 hours
 */
export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers["idempotency-key"] as string;

  // Skip if no key
  if (!idempotencyKey) {
    return next();
  }

  // Only apply to mutating methods
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
    return next();
  }

  const key = `idempotency:${idempotencyKey}`;

  try {
    // Check for existing response
    let cached: StoredResponse | undefined | null;
    if (redis) {
      cached = await redis.get<StoredResponse>(key);
    } else {
      cached = memoryStore.get(key);
    }

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
      res.setHeader("Idempotent-Replayed", "true"); // For compatibility with existing tests

      return res.json(cached.body);
    }

    // Hook response to cache it on finish
    const originalJson = res.json;

    res.json = function (body) {
      if (res.statusCode < 500 && !req.path.includes("/api/health")) {
        const entry: StoredResponse = {
          status: res.statusCode,
          headers: res.getHeaders(),
          body,
          timestamp: new Date().toISOString(),
        };

        if (redis) {
          redis
            .set(key, entry, { ex: 86400 })
            .catch((err) => logger.error("[Idempotency] Failed to cache response", err));
        } else {
          memoryStore.set(key, entry);
          // Auto-cleanup for memory store after 24h
          setTimeout(() => memoryStore.delete(key), 86400 * 1000).unref();
        }
      }

      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    logger.error("[Idempotency] Error processing key", error);
    next();
  }
};

/**
 * Utility to clear the idempotency store (for testing)
 */
export const clearIdempotencyStore = async () => {
  if (redis) {
    const keys = await redis.keys("idempotency:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
  memoryStore.clear();
};

/**
 * Utility to get idempotency metrics (for monitoring/testing)
 */
export const getIdempotencyMetrics = () => {
  const entries = Array.from(memoryStore.entries()).sort(
    (a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime(),
  );

  return {
    isRedisConnected: !!redis,
    memoryEntriesCount: memoryStore.size,
    oldestMemoryEntry: entries[0] ? entries[0][1] : null,
  };
};
