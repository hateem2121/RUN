import { promisify } from "node:util";
import { gunzip, gzip } from "node:zlib";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { LRUCache } from "lru-cache";
import { logger } from "../monitoring/logger.js";
import { type PostgresCacheProvider, postgresCache } from "./postgres-cache-provider.js";

/**
 * UNIFIED CACHE - HYBRID L1/L2
 *
 * L1: In-Memory LRU Cache (Fastest, per-instance)
 * L2: PostgreSQL / Neon Serverless (Shared, persistence)
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

function escapeRegex(str: string): string {
  return str.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

function safePatternToRegex(pattern: string): RegExp | null {
  if (typeof pattern !== "string" || !pattern) return null;
  const isExplicitRegex =
    pattern.startsWith("^") ||
    pattern.includes(".*") ||
    pattern.includes("(") ||
    pattern.includes("|");
  if (isExplicitRegex) {
    if (/^[a-zA-Z0-9_:|^$()*?.+\-[\]]+$/.test(pattern)) {
      try {
        return new RegExp(pattern);
      } catch {
        return null;
      }
    }
    return null;
  }
  if (pattern.includes("*")) {
    const escaped = escapeRegex(pattern).replace(/\\\*/g, ".*");
    try {
      return new RegExp(`^${escaped}$`);
    } catch {
      return null;
    }
  }
  return null;
}

class DummyCacheProvider {
  async get(_key: string) {
    return null;
  }
  async set(_key: string, _value: string, _exToken?: "EX", _ttlSeconds?: number) {
    return "OK";
  }
  async del(..._keys: string[]) {
    return 0;
  }
  async keys(_pattern: string) {
    return [];
  }
  async expire(_key: string, _ttl: number) {
    return 1;
  }
  async deletePattern(_pattern: string) {}
  async flushdb() {}
  async scan(
    _cursor: string | number,
    _matchToken?: "MATCH",
    _pattern?: string,
    _countToken?: "COUNT",
    _count?: number,
  ) {
    return ["0", []] as [string, string[]];
  }
}
const dummyCache = new DummyCacheProvider();

/**
 * CACHE-03: Approximate cache entry size to prevent V8 heap churn from JSON.stringify.
 */
export function calculateCacheEntrySize(value: unknown, key: string): number {
  if (typeof value === "string") {
    return value.length + key.length;
  }
  if (Buffer.isBuffer(value)) {
    return value.length + key.length;
  }
  if (typeof value === "object" && value !== null) {
    return Object.keys(value as object).length * 64 + key.length + 128;
  }
  return key.length + 128;
}

export class UnifiedCache {
  private static instance: UnifiedCache | null = null;
  private memoryCache: LRUCache<string, object>;
  private l2: PostgresCacheProvider | DummyCacheProvider;

  // Standard TTL presets
  public static readonly TTL_PRESETS = {
    SHORT: 60 * 5, // 5 minutes
    MEDIUM: 60 * 30, // 30 minutes
    LONG: 60 * 60, // 1 hour
    MEDIA: 60 * 60 * 6, // 6 hours
    STATIC: 60 * 60 * 24, // 24 hours
  };

  // In-flight deduplication — prevents cache stampedes under concurrent load
  private inFlight: Map<string, Promise<unknown>> = new Map();

  // RFC 5861 SWR metadata tracking (CACHE-01)
  private swrMetadata: Map<string, { staleAt: number; expiresAt: number }> = new Map();

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
      maxSize: 50 * 1024 * 1024, // PC-801: 50MB for better system stability
      sizeCalculation: (value: unknown, key: string) => calculateCacheEntrySize(value, key),
      ttl: 1000 * 60 * 60, // 1 hour default TTL
    });

    if (process.env.NODE_ENV === "test" || process.env.VITEST) {
      this.l2 = dummyCache;
      logger.info("[Cache] ✅ Unified Cache initialized (L1: Memory, L2: None (Test env))");
    } else {
      this.l2 = postgresCache;
      logger.info("[Cache] ✅ Unified Hybrid Cache initialized (L1: Memory, L2: Postgres/Neon)");
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
    const result = (await tracer.startActiveSpan("cache.get", async (span) => {
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

        // 2. Check L2 Cache (Redis or Postgres)
        try {
          const l2Value = await this.readL2(key);
          if (l2Value !== null) {
            this.stats.hits++;
            this.stats.l2Hits++;
            span.setAttribute("cache.hit", true);
            span.setAttribute("cache.source", "l2");

            // Backfill L1 Memory Cache with default TTL
            this.memoryCache.set(key, l2Value as unknown as object);

            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
            return l2Value;
          }
        } catch (error) {
          logger.error(`[Cache] L2 Get failed for ${key}:`, error);
          span.recordException(error as Error);
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
          message: error instanceof Error ? error.message : String(error),
        });
        span.end();
        return null;
      }
    })) as Promise<T | null>;
    return result;
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
          this.memoryCache.set(key, value as object, { ttl: ttlSeconds * 1000 });
        }
        span.setAttribute("cache.l1", true);

        // P2 OPTIMIZATION: Fire-and-forget L2 write (Parallelize)
        // We don't await the L2 write to keep the critical path fast.
        span.setAttribute("cache.l2", true);
        this.writeL2(key, value, ttlSeconds).catch((err) => {
          logger.warn(`[UnifiedCache] L2 Write Failed for ${key}:`, err);
        });

        this.stats.sets++;
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
      } catch (error: unknown) {
        logger.error(`[Cache] Set failed for ${key}:`, error);
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        span.end();
      }
    });
  }

  // P2 OPTIMIZATION: Separate L2 write method for compression logic
  // Circuit breaker protection is handled at the Upstash proxy level (PC-301)
  private async writeL2<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    let payload = JSON.stringify(value);

    // Compress if large
    if (payload.length > COMPRESSION_THRESHOLD) {
      const buffer = await gzipAsync(Buffer.from(payload));
      // Store as base64 with prefix to identify compressed data
      payload = `gz:${buffer.toString("base64")}`;
    }

    await this.l2.set(key, payload, "EX", ttlSeconds);
  }

  // Helper to read and potentially decompress
  // Circuit breaker protection is handled at the Upstash proxy level (PC-301)
  private async readL2<T>(key: string): Promise<T | null> {
    try {
      const data = await this.l2.get(key);
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
    // 1. Clear L1 Memory Cache immediately for the CURRENT instance
    const regex = safePatternToRegex(pattern);

    logger.debug(`[UnifiedCache] Invalidating L1 pattern: ${pattern}. Compiled regex: ${regex}`);
    let deletedCount = 0;
    for (const key of this.memoryCache.keys()) {
      if (regex) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          deletedCount++;
        }
      } else {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
          deletedCount++;
        }
      }
    }
    for (const key of this.swrMetadata.keys()) {
      if (regex ? regex.test(key) : key.includes(pattern)) {
        this.swrMetadata.delete(key);
      }
    }
    if (deletedCount > 0) {
      logger.debug(`[UnifiedCache] Invalidated ${deletedCount} L1 keys for pattern ${pattern}`);
    }

    // 2. Clear L2 Cache (Redis/Postgres) asynchronously
    // BullMQ has been removed. We now perform this directly in the background
    // without awaiting, to avoid blocking the HTTP request thread.
    this.clearPattern(pattern).catch((err) => {
      logger.warn(`[UnifiedCache] Failed to clear L2 asynchronously for ${pattern}`, err);
    });

    // 3. Emit invalidation event for frontend polling
    import("./cache-events.js").then(({ emitCacheInvalidation }) => {
      emitCacheInvalidation(pattern, "delete").catch((err) =>
        logger.warn("[UnifiedCache] Failed to emit invalidation event", err),
      );
    });
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, _namespace?: string): Promise<void> {
    this.memoryCache.delete(key);
    this.swrMetadata.delete(key);

    this.l2.del(key).catch((err: unknown) => {
      logger.error(`[Cache] L2 Delete failed for ${key}:`, err);
    });

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
    this.swrMetadata.clear();

    try {
      await this.l2.flushdb();
    } catch (error) {
      logger.error("[Cache] L2 Clear failed:", error);
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
    const regex = safePatternToRegex(pattern);

    // 1. Clear L1 Memory Cache & SWR metadata
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
    for (const key of this.swrMetadata.keys()) {
      if (regex ? regex.test(key) : key.includes(pattern)) {
        this.swrMetadata.delete(key);
      }
    }

    // 2. Clear L2 Postgres Cache
    try {
      if ("deletePattern" in this.l2 && typeof this.l2.deletePattern === "function") {
        await this.l2.deletePattern(pattern);
      }
    } catch (error: unknown) {
      logger.error(`[Cache] L2 clearPattern failed for ${pattern}:`, error);
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
    tasks?: {
      loader: () => Promise<unknown>;
      key: string;
      options?: {
        ttl?: number | undefined;
        category?: string | undefined;
        priority?: string | undefined;
        tags?: string[] | undefined;
      };
    }[],
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
    const maxSize = 50 * 1024 * 1024; // 50MB
    const usagePercent = (stats.calculatedSize / maxSize) * 100;
    if (usagePercent > 80) {
      issues.push(`High cache usage: ${Math.round(usagePercent)}% (threshold: 80%)`);
    }

    // Check if cache is near item limit
    const itemUsagePercent = (stats.itemCount / 5000) * 100;
    if (itemUsagePercent > 80) {
      issues.push(`High item count: ${stats.itemCount}/5000 (${Math.round(itemUsagePercent)}%)`);
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
   * SWR (Stale-While-Revalidate) Get (RFC 5861 - CACHE-01)
   * Evaluates deterministic staleAt and expiresAt windows:
   * - now <= staleAt: fresh hit (source: "memory")
   * - staleAt < now <= expiresAt: stale hit (source: "swr_hit") with non-blocking background refresh
   * - now > expiresAt or cache miss: synchronous refresh (source: "loader")
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
    const cached = await this.get<T>(key);
    const meta = this.swrMetadata.get(key);
    const now = Date.now();

    // If entry exists in cache
    if (cached !== null && cached !== undefined) {
      if (meta) {
        // 1. Fresh hit: now <= staleAt
        if (now <= meta.staleAt) {
          return {
            data: cached,
            source: "memory",
            timings: {
              totalTime: performance.now() - start,
              cacheTime: performance.now() - start,
            },
          };
        }

        // 2. Stale hit: now > staleAt && now <= expiresAt (RFC 5861 SWR window)
        if (now <= meta.expiresAt) {
          // Trigger non-blocking background revalidation if not already in-flight for this key
          if (!this.inFlight.has(key)) {
            const backgroundPromise = fetchFn()
              .then(async (fresh) => {
                await this.setSWR(key, fresh, config);
                return fresh;
              })
              .catch((err) => {
                logger.error(`[Cache] Background SWR revalidation failed for ${key}:`, err);
                return cached;
              })
              .finally(() => {
                this.inFlight.delete(key);
              });
            this.inFlight.set(key, backgroundPromise);
          }

          return {
            data: cached,
            source: "swr_hit",
            timings: {
              totalTime: performance.now() - start,
              cacheTime: performance.now() - start,
            },
          };
        }

        // 3. Expired: now > meta.expiresAt -> Fall through to synchronous fetch
      } else {
        // Cached value without SWR metadata (e.g. set via plain set())
        return {
          data: cached,
          source: "memory",
          timings: {
            totalTime: performance.now() - start,
            cacheTime: performance.now() - start,
          },
        };
      }
    }

    // Cache Miss or Expired — fetch synchronously via inFlight dedup and update cache
    let inflight = this.inFlight.get(key) as Promise<T> | undefined;
    if (!inflight) {
      inflight = fetchFn()
        .then(async (fresh) => {
          await this.setSWR(key, fresh, config);
          return fresh;
        })
        .finally(() => {
          this.inFlight.delete(key);
        });
      this.inFlight.set(key, inflight);
    }
    const data = await inflight;

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
   * SWR Set (RFC 5861 - CACHE-01)
   * Calculates staleAt and expiresAt timestamps and caches the entry with total TTL.
   */
  async setSWR<T>(
    key: string,
    value: T,
    config: SWRConfig,
    _namespace: string = "default",
  ): Promise<void> {
    const ttl = config.ttl || 3600;
    const staleWhileRevalidate = config.staleWhileRevalidate ?? ttl;
    const totalTtlSeconds = ttl + staleWhileRevalidate;

    const now = Date.now();
    this.swrMetadata.set(key, {
      staleAt: now + ttl * 1000,
      expiresAt: now + totalTtlSeconds * 1000,
    });

    await this.set(key, value, totalTtlSeconds);
  }

  /**
   * Inspect SWR metadata for testing and diagnostics
   */
  getSWRMetadata(key: string): { staleAt: number; expiresAt: number } | undefined {
    return this.swrMetadata.get(key);
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
