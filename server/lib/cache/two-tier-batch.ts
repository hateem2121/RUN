/**
 * CHUNK 5: TWO-TIER BATCH CACHE SERVICE
 * Specialized cache for manufacturing, media, and config list/batch queries
 *
 * PHASE 2A TASK 7: Updated to delegate to UnifiedCache.getSWR()
 * - Preserves benchmarking and bypass logic
 * - Adds SWR support with endpoint-specific configurations
 *
 * ARCHITECTURE:
 * - L1 (In-Memory LRU): via UnifiedCache
 * - L2 (Replit KV Store): via UnifiedCache
 * - SWR: Fresh/Stale/Expire windows per endpoint
 *
 * SUCCESS CRITERIA:
 * - Largest batch queries < 300ms
 * - KV cache hit rates > 80%
 * - Flat CPU profile (no spikes)
 *
 * PERFORMANCE BENCHMARKING:
 * - Logs old vs new API times
 * - Tracks cache hit rates
 * - Monitors L1/L2 distribution
 */

import { logger } from "../monitoring/logger.js";
import type { SWRConfig } from "./unified-cache.js";
import { unifiedCache } from "./unified-cache.js";

interface CacheMetrics {
  l1Hits: number;
  l2Hits: number;
  misses: number;
  totalRequests: number;
  avgL1Time: number;
  avgL2Time: number;
  avgDbTime: number;
}

interface BenchmarkResult {
  cacheKey: string;
  l1Time: number | null;
  l2Time: number | null;
  dbTime: number | null;
  hit: "L1" | "L2" | "MISS";
  improvement: number | null; // % improvement from old (DB) to new (cache)
}

export class TwoTierBatchCache {
  private static instance: TwoTierBatchCache;
  private metrics: CacheMetrics;

  // Performance tracking
  private responseTimesL1: number[] = [];
  private responseTimesL2: number[] = [];
  private responseTimesDb: number[] = [];
  private readonly MAX_RESPONSE_BUFFER = 100;

  private constructor() {
    this.metrics = {
      l1Hits: 0,
      l2Hits: 0,
      misses: 0,
      totalRequests: 0,
      avgL1Time: 0,
      avgL2Time: 0,
      avgDbTime: 0,
    };

    logger.info("[TwoTierBatchCache] 🚀 Initialized: Delegating to UnifiedCache with SWR support");
  }

  public static getInstance(): TwoTierBatchCache {
    if (!TwoTierBatchCache.instance) {
      TwoTierBatchCache.instance = new TwoTierBatchCache();
    }
    return TwoTierBatchCache.instance;
  }

  /**
   * PHASE 2A TASK 7: Get data with SWR-enabled two-tier cache lookup
   * Delegates to UnifiedCache.getSWR() while preserving benchmarking
   *
   * @param key - Cache key
   * @param fetchFn - Function to fetch fresh data
   * @param options - Cache options (bypassCache, swrConfig)
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: {
      bypassCache?: boolean | undefined;
      swrConfig?: SWRConfig;
    },
  ): Promise<{ data: T; benchmark: BenchmarkResult }> {
    this.metrics.totalRequests++;

    const benchmark: BenchmarkResult = {
      cacheKey: key,
      l1Time: null,
      l2Time: null,
      dbTime: null,
      hit: "MISS",
      improvement: null,
    };

    const cache = unifiedCache;
    const startTime = performance.now();

    // Bypass cache: fetch directly and cache result
    if (options?.bypassCache) {
      logger.debug(`[TwoTierBatchCache] Cache bypass requested for ${key} - fetching fresh data`);

      this.metrics.misses++;
      const dbStart = performance.now();
      const data = await fetchFn();
      const dbTime = performance.now() - dbStart;
      benchmark.dbTime = dbTime;
      this.recordDbTime(dbTime);

      // Cache the fresh data with SWR if config provided
      if (options.swrConfig) {
        await cache.setSWR(`batch:${key}`, data, options.swrConfig, "static");
      }

      logger.info(`[TwoTierBatchCache] ⬆️ BYPASS + CACHED: ${key} (${dbTime.toFixed(2)}ms)`);
      return { data, benchmark };
    }

    // SWR-enabled cache lookup
    if (options?.swrConfig) {
      const result = await cache.getSWR(`batch:${key}`, fetchFn, options.swrConfig, "static");

      // Map unified cache source to legacy hit labels
      const timingValue =
        result.timings.cacheTime || result.timings.loaderTime || result.timings.totalTime;

      switch (result.source) {
        case "memory":
        case "swr_hit":
          benchmark.hit = "L1";
          benchmark.l1Time = timingValue;
          this.metrics.l1Hits++;
          this.recordL1Time(timingValue);
          break;

        case "kv":
          benchmark.hit = "L2";
          benchmark.l2Time = timingValue;
          this.metrics.l2Hits++;
          this.recordL2Time(timingValue);
          break;
        case "stale_memory":
          benchmark.hit = "L1"; // Report as L1 hit (stale serve)
          benchmark.l1Time = timingValue;
          this.metrics.l1Hits++;
          this.recordL1Time(timingValue);
          break;
        case "stale_kv":
          benchmark.hit = "L2"; // Report as L2 hit (stale serve)
          benchmark.l2Time = timingValue;
          this.metrics.l2Hits++;
          this.recordL2Time(timingValue);
          break;
        case "loader": {
          benchmark.hit = "MISS";
          const loaderTime = result.timings.loaderTime || result.timings.totalTime;
          benchmark.dbTime = loaderTime;
          this.metrics.misses++;
          this.recordDbTime(loaderTime);
          break;
        }
      }

      logger.debug(
        `[TwoTierBatchCache SWR] ✅ ${benchmark.hit} (${result.timings.totalTime.toFixed(
          2,
        )}ms) for ${key}`,
      );
      return { data: result.data, benchmark };
    }

    // Legacy path (no SWR config): use default TTL-based caching
    // This path is kept for backward compatibility
    logger.warn(`[TwoTierBatchCache] No SWR config provided for ${key}, using legacy path`);
    const batchKey = `batch:${key}`;
    const data = await cache.get<T>(batchKey, "static");

    if (data) {
      const totalTime = performance.now() - startTime;
      benchmark.hit = "L1";
      benchmark.l1Time = totalTime;
      this.metrics.l1Hits++;
      this.recordL1Time(totalTime);
      return { data, benchmark };
    }

    // Cache miss: fetch and store
    this.metrics.misses++;
    const dbStart = performance.now();
    const freshData = await fetchFn();
    const dbTime = performance.now() - dbStart;
    benchmark.dbTime = dbTime;
    this.recordDbTime(dbTime);

    await cache.set(batchKey, freshData, 30 * 60 * 1000, "static"); // 30min default TTL

    return { data: freshData, benchmark };
  }

  /**
   * PHASE 2A TASK 7: Invalidate cache entry at all tiers
   * Delegates to UnifiedCache for consistent cache management
   * Includes batch: prefix for namespace isolation
   */
  async invalidate(key: string): Promise<void> {
    try {
      const cache = unifiedCache;
      const batchKey = `batch:${key}`;
      await cache.delete(batchKey, "static");

      // Also try to delete legacy key (backward compatibility)
      try {
        await cache.delete(key, "static");
      } catch {
        // Ignore if legacy key doesn't exist
      }

      logger.debug(`[TwoTierBatchCache] Invalidated: ${key}`);
    } catch (error) {
      logger.error(`[TwoTierBatchCache] Failed to invalidate ${key}:`, error);
    }
  }

  /**
   * Get cache metrics and hit rates
   */
  getMetrics(): {
    hitRate: number;
    l1HitRate: number;
    l2HitRate: number;
    missRate: number;
    avgL1Time: number;
    avgL2Time: number;
    avgDbTime: number;
    totalRequests: number;
  } {
    const { l1Hits, l2Hits, misses, totalRequests } = this.metrics;
    const totalHits = l1Hits + l2Hits;

    return {
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      l1HitRate: totalRequests > 0 ? (l1Hits / totalRequests) * 100 : 0,
      l2HitRate: totalRequests > 0 ? (l2Hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (misses / totalRequests) * 100 : 0,
      avgL1Time: this.metrics.avgL1Time,
      avgL2Time: this.metrics.avgL2Time,
      avgDbTime: this.metrics.avgDbTime,
      totalRequests,
    };
  }

  /**
   * Log comprehensive cache performance report
   */
  logPerformanceReport(context: string): void {
    const metrics = this.getMetrics();

    logger.info(`\n[TwoTierBatchCache] 📊 Performance Report: ${context}`);
    logger.info(`├─ Total Requests: ${metrics.totalRequests}`);
    logger.info(`├─ Overall Hit Rate: ${metrics.hitRate.toFixed(2)}% (target: >80%)`);
    logger.info(`├─ L1 Hit Rate: ${metrics.l1HitRate.toFixed(2)}%`);
    logger.info(`├─ L2 Hit Rate: ${metrics.l2HitRate.toFixed(2)}%`);
    logger.info(`├─ Miss Rate: ${metrics.missRate.toFixed(2)}%`);
    logger.info(`├─ Avg L1 Time: ${metrics.avgL1Time.toFixed(2)}ms`);
    logger.info(`├─ Avg L2 Time: ${metrics.avgL2Time.toFixed(2)}ms`);
    logger.info(`└─ Avg DB Time: ${metrics.avgDbTime.toFixed(2)}ms`);

    // Success criteria validation
    if (metrics.hitRate >= 80) {
      logger.info(`✅ SUCCESS: Hit rate ${metrics.hitRate.toFixed(2)}% exceeds 80% target`);
    } else {
      logger.warn(`⚠️ WARN: Hit rate ${metrics.hitRate.toFixed(2)}% below 80% target`);
    }

    if (metrics.avgDbTime > 0 && metrics.avgDbTime < 300) {
      logger.info(`✅ SUCCESS: Avg DB time ${metrics.avgDbTime.toFixed(2)}ms below 300ms target`);
    } else if (metrics.avgDbTime >= 300) {
      logger.warn(`⚠️ WARN: Avg DB time ${metrics.avgDbTime.toFixed(2)}ms exceeds 300ms target`);
    }
  }

  // Private helper methods
  private recordL1Time(time: number): void {
    this.responseTimesL1.push(time);
    if (this.responseTimesL1.length > this.MAX_RESPONSE_BUFFER) {
      this.responseTimesL1.shift();
    }
    this.metrics.avgL1Time =
      this.responseTimesL1.reduce((a, b) => a + b, 0) / this.responseTimesL1.length;
  }

  private recordL2Time(time: number): void {
    this.responseTimesL2.push(time);
    if (this.responseTimesL2.length > this.MAX_RESPONSE_BUFFER) {
      this.responseTimesL2.shift();
    }
    this.metrics.avgL2Time =
      this.responseTimesL2.reduce((a, b) => a + b, 0) / this.responseTimesL2.length;
  }

  private recordDbTime(time: number): void {
    this.responseTimesDb.push(time);
    if (this.responseTimesDb.length > this.MAX_RESPONSE_BUFFER) {
      this.responseTimesDb.shift();
    }
    this.metrics.avgDbTime =
      this.responseTimesDb.reduce((a, b) => a + b, 0) / this.responseTimesDb.length;
  }
}

// Export singleton instance
export const twoTierBatchCache = TwoTierBatchCache.getInstance();
