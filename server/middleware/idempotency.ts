/**
 * Idempotency Middleware
 * Ensures POST/PUT/PATCH requests with the same Idempotency-Key return the same response
 *
 * UPGRADED: Uses Redis as primary storage with in-memory fallback
 * - Redis provides cross-instance idempotency for Cloud Run
 * - In-memory fallback for dev/when Redis unavailable
 *
 * Reference: https://stripe.com/docs/api/idempotent_requests
 */

import type { NextFunction, Request, Response } from "express";
import { isRedisEnabled, redis } from "../lib/cache/upstash-client.js";
import { logger } from "../lib/monitoring/logger.js";

const IDEMPOTENCY_HEADER = "idempotency-key";
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24 hours in seconds
const IDEMPOTENCY_TTL_MS = IDEMPOTENCY_TTL_SECONDS * 1000; // 24 hours in ms
const REDIS_KEY_PREFIX = "idempotency:";

// In-memory store (for fallback when Redis unavailable)
interface IdempotencyEntry {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  timestamp: number;
}

const memoryStore = new Map<string, IdempotencyEntry>();

// Routes excluded from idempotency (safe methods or special cases)
const EXCLUDED_ROUTES = ["/api/health", "/api/docs", "/api/auth"];

// Stats for monitoring
const stats = {
  redisHits: 0,
  memoryHits: 0,
  misses: 0,
  redisSets: 0,
  memorySets: 0,
  redisErrors: 0,
};

/**
 * Check if a route is excluded from idempotency checking
 */
function isExcludedRoute(path: string): boolean {
  return EXCLUDED_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

/**
 * Clean up expired entries from memory store periodically
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now - entry.timestamp > IDEMPOTENCY_TTL_MS) {
      memoryStore.delete(key);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

/**
 * Generate a unique key from the request
 * Combines idempotency key with method and path for uniqueness
 */
function generateStoreKey(idempotencyKey: string, method: string, path: string): string {
  return `${idempotencyKey}:${method}:${path}`;
}

/**
 * Get cached entry from Redis (primary) or memory (fallback)
 */
async function getCachedEntry(storeKey: string): Promise<IdempotencyEntry | null> {
  // Try Redis first if enabled
  if (isRedisEnabled) {
    try {
      const redisKey = `${REDIS_KEY_PREFIX}${storeKey}`;
      const data = await redis.get<string>(redisKey);

      if (data) {
        stats.redisHits++;
        const entry = typeof data === "string" ? JSON.parse(data) : data;
        return entry as IdempotencyEntry;
      }
    } catch (error) {
      stats.redisErrors++;
      logger.warn("[Idempotency] Redis get failed, falling back to memory", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Fallback to memory store
  const memoryEntry = memoryStore.get(storeKey);
  if (memoryEntry && Date.now() - memoryEntry.timestamp <= IDEMPOTENCY_TTL_MS) {
    stats.memoryHits++;
    return memoryEntry;
  }

  // Clear expired memory entry
  if (memoryEntry) {
    memoryStore.delete(storeKey);
  }

  stats.misses++;
  return null;
}

/**
 * Store entry in Redis (primary) and memory (backup)
 */
async function setCachedEntry(storeKey: string, entry: IdempotencyEntry): Promise<void> {
  // Always store in memory as backup
  memoryStore.set(storeKey, entry);
  stats.memorySets++;

  // Store in Redis if enabled (with TTL)
  if (isRedisEnabled) {
    try {
      const redisKey = `${REDIS_KEY_PREFIX}${storeKey}`;
      await redis.set(redisKey, JSON.stringify(entry), {
        ex: IDEMPOTENCY_TTL_SECONDS,
      });
      stats.redisSets++;
    } catch (error) {
      stats.redisErrors++;
      logger.warn("[Idempotency] Redis set failed, stored in memory only", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Idempotency Middleware
 * Stores and returns cached responses for duplicate requests
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply to state-changing methods
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }

  // Skip excluded routes
  if (isExcludedRoute(req.path)) {
    return next();
  }

  const idempotencyKey = req.get(IDEMPOTENCY_HEADER);

  // If no idempotency key provided, continue without caching
  if (!idempotencyKey) {
    return next();
  }

  const storeKey = generateStoreKey(idempotencyKey, req.method, req.path);

  // Check for cached response (async, but we handle it properly)
  getCachedEntry(storeKey)
    .then((cachedEntry) => {
      if (cachedEntry) {
        logger.info("[Idempotency] Returning cached response", {
          key: idempotencyKey,
          path: req.path,
          source: isRedisEnabled ? "redis" : "memory",
        });

        // Set cached headers
        for (const [key, value] of Object.entries(cachedEntry.headers)) {
          res.set(key, value);
        }
        res.set("Idempotent-Replayed", "true");
        res.set("X-Idempotency-Source", isRedisEnabled ? "redis" : "memory");

        res.status(cachedEntry.status).json(cachedEntry.body);
        return;
      }

      // No cached entry - proceed with request and capture response
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      const captureResponse = (body: unknown) => {
        // Only cache successful responses (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const entry: IdempotencyEntry = {
            status: res.statusCode,
            headers: {
              "Content-Type": res.get("Content-Type") || "application/json",
            },
            body,
            timestamp: Date.now(),
          };

          // Fire-and-forget cache storage
          setCachedEntry(storeKey, entry).catch((err) => {
            logger.warn("[Idempotency] Failed to cache response", {
              error: err,
            });
          });

          logger.debug("[Idempotency] Cached response", {
            key: idempotencyKey,
            path: req.path,
          });
        }
      };

      res.json = (body: unknown) => {
        captureResponse(body);
        return originalJson(body);
      };

      res.send = (body: unknown) => {
        // Only capture JSON responses
        if (typeof body === "object" && body !== null) {
          captureResponse(body);
        }
        return originalSend(body);
      };

      next();
    })
    .catch((error) => {
      logger.error("[Idempotency] Error checking cache, proceeding without idempotency", {
        error: error instanceof Error ? error.message : String(error),
      });
      next();
    });
}

/**
 * Get idempotency store metrics for monitoring
 */
export function getIdempotencyMetrics(): {
  memoryEntriesCount: number;
  oldestMemoryEntry: number | null;
  redisEnabled: boolean;
  stats: typeof stats;
} {
  let oldestTimestamp: number | null = null;

  for (const entry of memoryStore.values()) {
    if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
      oldestTimestamp = entry.timestamp;
    }
  }

  return {
    memoryEntriesCount: memoryStore.size,
    oldestMemoryEntry: oldestTimestamp,
    redisEnabled: isRedisEnabled,
    stats: { ...stats },
  };
}

/**
 * Clear idempotency store (for testing)
 */
export async function clearIdempotencyStore(): Promise<void> {
  memoryStore.clear();

  if (isRedisEnabled) {
    try {
      // Scan and delete all idempotency keys
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: `${REDIS_KEY_PREFIX}*`,
          count: 100,
        });
        cursor = nextCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== "0");
    } catch (error) {
      logger.warn("[Idempotency] Failed to clear Redis store", { error });
    }
  }
}

// Log initialization status
if (isRedisEnabled) {
  logger.info("[Idempotency] ✅ Redis-backed idempotency initialized (cross-instance support)");
} else {
  logger.info("[Idempotency] ⚠️ Memory-only idempotency (single-instance, dev mode)");
}
