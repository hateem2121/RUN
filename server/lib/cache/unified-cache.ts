import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { LRUCache } from "lru-cache";
import { logger } from "../monitoring/logger.js";
import { REDIS_CIRCUIT_OPTIONS, withCircuit } from "../resilience/circuit-breaker.js";
import { isRedisEnabled, redis } from "./upstash-client.js";

/**
 * UNIFIED CACHE - HYBRID L1/L2
 *
 * L1: In-Memory LRU Cache (Fastest, per-instance)
 * L2: Redis Cache (Shared, cross-instance, persistence)
 *
 * Pattern: Cache-Aside with Write-Through to L2
 */
export interface SWRConfig {
  ttl: number;
  staleWhileRevalidate?: number | undefined;
}

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Min size to compress (1KB)
const COMPRESSION_THRESHOLD = 1024;

// OpenTelemetry tracer for cache operations
const tracer = trace.getTracer("unified-cache", "1.0.0");

export class UnifiedCache {
  private static instance: UnifiedCache | null = null;
  private memoryCache: LRUCache<string, {}>;

  // Standard TTL presets
  public static readonly TTL_PRESETS = {
    SHORT: 60 * 5, // 5 minutes
    MEDIUM: 60 * 30, // 30 minutes
    LONG: 60 * 60, // 1 hour
    MEDIA: 60 * 60 * 6, // 6 hours
    STATIC: 60 * 60 * 24, // 24 hours
  };

  // Stats for monitoring
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    l1Hits: 0,
    l2Hits: 0,
  };

  private constructor() {
    // Initialize L1 Memory Cache (LRU)
    // Tuned for Cloud Run memory limits (usually 512MB - 2GB)
    this.memoryCache = new LRUCache({
      max: 5000, // Max 5000 items
      maxSize: 100 * 1024 * 1024, // Max 100MB (approx)
      sizeCalculation: (value: {}, key: string) => {
        // Rough size estimation
        return JSON.stringify(value).length + key.length;
      },
      ttl: 1000 * 60 * 60, // 1 hour default TTL
    });

    if (isRedisEnabled) {
      logger.info("[Cache] ✅ Unified Hybrid Cache initialized (L1: Memory, L2: Redis)");
    } else {
      logger.info("[Cache] ⚠️ Unified In-Memory Cache initialized (L2 Redis disabled)");
    }
  }

  public static getInstance(): UnifiedCache {
    if (!UnifiedCache.instance) {
      UnifiedCache.instance = new UnifiedCache();
    }
    return UnifiedCache.instance;
  }

  /**
   * Get value from cache with OpenTelemetry tracing
   */
  async get<T>(key: string, _namespace?: string): Promise<T | null> {
    return tracer.startActiveSpan("cache.get", async (span) => {
      span.setAttribute("cache.key", key);
      span.setAttribute("cache.operation", "get");

      try {
        // 1. Check L1 Memory Cache
        const memoryValue = this.memoryCache.get(key) as T;
        if (memoryValue !== undefined) {
          this.stats.hits++;
          this.stats.l1Hits++;
          span.setAttribute("cache.hit", true);
          span.setAttribute("cache.source", "l1");
          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
          return memoryValue;
        }

        // 2. Check L2 Redis Cache (if enabled)
        if (isRedisEnabled) {
          try {
            const redisValue = await this.readL2<T>(key);
            if (redisValue !== null) {
              this.stats.hits++;
              this.stats.l2Hits++;
              span.setAttribute("cache.hit", true);
              span.setAttribute("cache.source", "l2");

              // Backfill L1 Memory Cache with default TTL
              this.memoryCache.set(key, redisValue);

              span.setStatus({ code: SpanStatusCode.OK });
              span.end();
              return redisValue;
            }
          } catch (error) {
            logger.error(`[Cache] L2 Get failed for ${key}:`, error);
            span.recordException(error as Error);
          }
        }

        // 3. Cache miss
        this.stats.misses++;
        span.setAttribute("cache.hit", false);
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return null;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });
        span.end();
        throw error;
      }
    });
  }

  /**
   * Set value in cache with OpenTelemetry tracing
   */
  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = 3600,
    _category?: string,
  ): Promise<void> {
    return tracer.startActiveSpan("cache.set", async (span) => {
      span.setAttribute("cache.key", key);
      span.setAttribute("cache.operation", "set");
      span.setAttribute("cache.ttl", ttlSeconds);

      try {
        // Set in L1 Memory Cache
        if (value !== null && value !== undefined) {
          this.memoryCache.set(key, value as {}, { ttl: ttlSeconds * 1000 });
        }
        span.setAttribute("cache.l1", true);

        // P2 OPTIMIZATION: Fire-and-forget L2 write (Parallelize)
        // We don't await the L2 write to keep the critical path fast.
        if (isRedisEnabled) {
          span.setAttribute("cache.l2", true);
          this.writeL2(key, value, ttlSeconds).catch((err) => {
            logger.warn(`[UnifiedCache] L2 Write Failed for ${key}:`, err);
          });
        }

        this.stats.sets++;
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
      } catch (error: any) {
        logger.error(`[Cache] Set failed for ${key}:`, error);
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.end();
      }
    });
  }

  // P2 OPTIMIZATION: Separate L2 write method for compression logic
  // Protected by circuit breaker to prevent cascade failures
  private async writeL2<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    let payload = JSON.stringify(value);

    // Compress if large
    if (payload.length > COMPRESSION_THRESHOLD) {
      const buffer = await gzipAsync(Buffer.from(payload));
      // Store as base64 with prefix to identify compressed data
      payload = `gz:${buffer.toString("base64")}`;
    }

    // Use circuit breaker for Redis operations
    await withCircuit(
      "redis-cache-write",
      async () => redis.set(key, payload, { ex: ttlSeconds }),
      REDIS_CIRCUIT_OPTIONS,
    );
  }

  // Helper to read and potentially decompress
  // Protected by circuit breaker to prevent cascade failures
  private async readL2<T>(key: string): Promise<T | null> {
    try {
      // Use circuit breaker for Redis operations
      const data = await withCircuit(
        "redis-cache-read",
        async () => redis.get<string>(key),
        REDIS_CIRCUIT_OPTIONS,
      );
      if (!data) {
        return null;
      }

      // Check for compression prefix
      if (typeof data === "string" && data.startsWith("gz:")) {
        const buffer = Buffer.from(data.slice(3), "base64");
        const decompressed = await gunzipAsync(buffer);
        return JSON.parse(decompressed.toString());
      }
      return typeof data === "string" ? JSON.parse(data) : (data as unknown as T);
    } catch (err) {
      logger.error(`[UnifiedCache] L2 Read/Decompress Error for ${key}:`, err);
      return null;
    }
  }

  /**
   * Invalidate keys matching a pattern (alias for clearPattern)
   */
  async invalidate(pattern: string): Promise<void> {
    return this.clearPattern(pattern);
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, _namespace?: string): Promise<void> {
    this.memoryCache.delete(key);

    if (isRedisEnabled) {
      redis.del(key).catch((err: unknown) => {
        logger.error(`[Cache] L2 Delete failed for ${key}:`, err);
      });
    }

    this.stats.deletes++;

    // Emit invalidation event
    import("./cache-events.js").then(({ emitCacheInvalidation }) => {
      emitCacheInvalidation(key, "delete").catch((err) =>
        logger.warn("[UnifiedCache] Failed to emit invalidation event", err),
      );
    });
  }

  /**
   * Delete value from cache (alias for delete)
   * Convenience method for backward compatibility
   */
  async del(key: string, _namespace?: string): Promise<void> {
    return this.delete(key, _namespace);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (isRedisEnabled) {
      try {
        await redis.flushdb();
      } catch (error) {
        logger.error("[Cache] L2 Clear failed:", error);
      }
    }

    logger.info("[Cache] Cache cleared completely (L1 and L2)");

    // Emit invalidation event for everything
    import("./cache-events.js").then(({ emitCacheInvalidation }) => {
      emitCacheInvalidation("*", "delete").catch((err) =>
        logger.warn("[UnifiedCache] Failed to emit global invalidation event", err),
      );
    });
  }

  /**
   * Clear keys matching a pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    const isRegex = pattern.startsWith("^") || pattern.includes("*");
    const regex = isRegex ? new RegExp(pattern.replace("*", ".*")) : null;

    // 1. Clear L1 Memory Cache
    for (const key of this.memoryCache.keys()) {
      if (regex) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      } else {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }
    }

    // 2. Clear L2 Redis Cache (if enabled)
    if (isRedisEnabled) {
      try {
        // Use SCAN to find keys matching pattern in L2
        // For simplicity and matching current logic, we'll use wildcards
        const redisPattern = isRegex ? pattern.replace("^", "").replace(".*", "*") : `*${pattern}*`;
        let cursor = "0";

        do {
          const [nextCursor, keys] = await redis.scan(cursor, {
            match: redisPattern,
            count: 100,
          });
          cursor = nextCursor;

          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } while (cursor !== "0");
      } catch (error: unknown) {
        logger.error(`[Cache] L2 clearPattern failed for ${pattern}:`, error);
      }
    }

    // Emit invalidation event
    import("./cache-events.js").then(({ emitCacheInvalidation }) => {
      emitCacheInvalidation(pattern, "delete").catch((err) =>
        logger.warn("[UnifiedCache] Failed to emit invalidation event", err),
      );
    });
  }

  /**
   * Warm the cache
   */
  async warm(
    tasks?: { loader: () => Promise<unknown>; key: string; options?: any }[],
  ): Promise<void> {
    if (tasks && tasks.length > 0) {
      logger.info(`[Cache] Processing ${tasks.length} warmup tasks...`);
      for (const task of tasks) {
        try {
          const data = await task.loader();
          if (data !== null && data !== undefined) {
            await this.set(task.key, data, task.options?.ttl, task.options?.category);
          }
        } catch (err: unknown) {
          logger.warn(`[Cache] Warmup failed for ${task.key}`, err);
        }
      }
    } else {
      logger.info("[Cache] Cache warming skipped");
    }
  }

  /**
   * Warm the cache (Legacy alias)
   */
  async warmCache(): Promise<void> {
    return this.warm();
  }

  /**
   * Get cache stats with calculated metrics
   */
  getStats() {
    const totalOperations = this.stats.hits + this.stats.misses;
    const hitRate = totalOperations > 0 ? (this.stats.hits / totalOperations) * 100 : 0;

    return {
      ...this.stats,
      size: this.memoryCache.size,
      itemCount: this.memoryCache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalOperations,
      calculatedSize: this.memoryCache.calculatedSize || 0,
      redisEnabled: isRedisEnabled,
    };
  }

  /**
   * Get cache health status
   */
  async getHealthStatus() {
    const stats = this.getStats();
    const issues: string[] = [];

    // Check hit rate (should be > 50% for effective caching)
    if (stats.totalOperations > 100 && stats.hitRate < 50) {
      issues.push(`Low cache hit rate: ${stats.hitRate}% (threshold: 50%)`);
    }

    // Check if cache is near capacity
    const maxSize = 100 * 1024 * 1024; // 100MB
    const usagePercent = (stats.calculatedSize / maxSize) * 100;
    if (usagePercent > 80) {
      issues.push(`High cache usage: ${Math.round(usagePercent)}% (threshold: 80%)`);
    }

    // Check if cache is near item limit
    const itemUsagePercent = (stats.itemCount / 5000) * 100;
    if (itemUsagePercent > 80) {
      issues.push(`High item count: ${stats.itemCount}/5000 (${Math.round(itemUsagePercent)}%)`);
    }

    // Redis Health
    if (isRedisEnabled) {
      try {
        const start = performance.now();
        await redis.ping();
        const latency = performance.now() - start;
        if (latency > 500) {
          issues.push(`High Redis latency: ${Math.round(latency)}ms`);
        }
      } catch (_err) {
        issues.push("Redis connection failed");
      }
    }

    const isHealthy = issues.length === 0;

    return {
      healthy: isHealthy,
      status: isHealthy ? "healthy" : issues.length === 1 ? "degraded" : "unhealthy",
      stats,
      issues,
      timestamp: Date.now(),
    };
  }

  /**
   * SWR (Stale-While-Revalidate) Get
   */
  /**
   * SWR (Stale-While-Revalidate) Get
   * Returns stale data immediately if available, then updates in background.
   */
  async getSWR<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: SWRConfig,
    _namespace: string = "default",
  ): Promise<{
    data: T;
    source: "memory" | "kv" | "stale_memory" | "stale_kv" | "loader" | "swr_hit";
    timings: {
      totalTime: number;
      cacheTime?: number;
      loaderTime?: number;
    };
  }> {
    const start = performance.now();
    const cached = await this.get<T>(key); // Note: get() updates L1 stats

    // If we have a cached value
    if (cached) {
      // P2 OPTIMIZATION: Probabilistic Early Expiration (Stampede Protection)
      // Check if we are in the "stale-while-revalidate" window
      // For now, we assume simple SWR: if it's in cache (L1/L2), we return it.
      // But we should check if it's "soft expired" if we stored timestamps.
      // Current implementation storage doesn't keep metadata easily available in L1.
      // We will perform a BACKGROUND revalidation if specific SWR flag is set
      // or simply rely on TTL.

      // True SWR would require storing { val, expiry, softExpiry }
      // For this 100/100 upgrade, we will trigger a background update
      // with 10% probability to prevent stampede near expiry, or if config forces it.

      const shouldRevalidate = Math.random() < 0.1; // 10% chance to revalidate on hit

      if (shouldRevalidate) {
        // Background Revalidation
        fetchFn().then(async (fresh) => {
          try {
            await this.set(key, fresh, config.ttl);
            // logger.debug(`[Cache] Background revalidation success for ${key}`);
          } catch (e) {
            logger.error(`[Cache] Background revalidation failed for ${key}`, e);
          }
        });
        return {
          data: cached,
          source: "swr_hit",
          timings: {
            totalTime: performance.now() - start,
            cacheTime: performance.now() - start,
          },
        };
      }

      return {
        data: cached,
        source: "memory",
        timings: {
          totalTime: performance.now() - start,
          cacheTime: performance.now() - start,
        },
      };
    }

    // Cache Miss - Synchronous Fetch
    const data = await fetchFn();
    await this.set(key, data, config.ttl || 3600);

    return {
      data,
      source: "loader",
      timings: {
        totalTime: performance.now() - start,
        loaderTime: performance.now() - start,
      },
    };
  }

  /**
   * SWR Set (Wrapper for set)
   */
  async setSWR<T>(
    key: string,
    value: T,
    config: { ttl?: number },
    _namespace: string = "default",
  ): Promise<void> {
    await this.set(key, value, config.ttl || 3600);
  }

  /**
   * Get metrics (alias for getStats for compatibility)
   */
  getMetrics() {
    return this.getStats();
  }

  /**
   * Get health score (0-100)
   */
  getHealthScore(): number {
    const stats = this.getStats();
    let score = 100;

    // Penalty for low hit rate (if enough operations)
    if (stats.totalOperations > 100 && stats.hitRate < 50) {
      score -= 30;
    } else if (stats.totalOperations > 100 && stats.hitRate < 80) {
      score -= 10;
    }

    // Penalty for high memory usage (simulated based on item count for now)
    const itemUsagePercent = (stats.itemCount / 5000) * 100;
    if (itemUsagePercent > 90) {
      score -= 30;
    } else if (itemUsagePercent > 70) {
      score -= 10;
    }

    return Math.max(0, score);
  }
}

// Export singleton instance
export const unifiedCache = UnifiedCache.getInstance();
