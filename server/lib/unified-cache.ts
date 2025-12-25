import { LRUCache } from "lru-cache";
import { logger } from "./smart-logger.js";

/**
 * UNIFIED CACHE - IN-MEMORY ONLY
 *
 * Replaces the hybrid DB + Memory cache with a pure in-memory LRU cache.
 *
 * Future Upgrade: Can be replaced with Redis (Memorystore) if needed.
 */
export interface SWRConfig {
  ttl: number;
  staleWhileRevalidate?: number;
}

export class UnifiedCache {
  private static instance: UnifiedCache | null = null;
  private memoryCache: LRUCache<string, any>;

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
    l2Hits: 0, // Will always be 0 now
  };

  private constructor() {
    // Initialize L1 Memory Cache (LRU)
    // Tuned for Cloud Run memory limits (usually 512MB - 2GB)
    this.memoryCache = new LRUCache({
      max: 5000, // Max 5000 items
      maxSize: 100 * 1024 * 1024, // Max 100MB (approx)
      sizeCalculation: (value, key) => {
        // Rough size estimation
        return JSON.stringify(value).length + key.length;
      },
      ttl: 1000 * 60 * 60, // 1 hour default TTL
    });

    logger.info("[Cache] ✅ Unified In-Memory Cache initialized");
  }

  public static getInstance(): UnifiedCache {
    if (!UnifiedCache.instance) {
      UnifiedCache.instance = new UnifiedCache();
    }
    return UnifiedCache.instance;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, _namespace?: string): Promise<T | null> {
    // 1. Check L1 Memory Cache
    const memoryValue = this.memoryCache.get(key) as T;
    if (memoryValue !== undefined) {
      this.stats.hits++;
      this.stats.l1Hits++;
      return memoryValue;
    }

    // L2 not present, so it's a miss
    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache
   */
  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds: number = 3600, _category?: string): Promise<void> {
    try {
      // Set in L1 Memory Cache
      this.memoryCache.set(key, value, { ttl: ttlSeconds * 1000 });

      this.stats.sets++;
    } catch (error) {
      logger.error(`[Cache] Set failed for ${key}:`, error);
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
    this.stats.deletes++;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    logger.info("[Cache] Cache cleared completely");
  }

  /**
   * Clear keys matching a pattern (simple prefix match for in-memory)
   */
  async clearPattern(pattern: string): Promise<void> {
    // Convert regex-like string to actual regex if needed, or just substring
    // For simplicity, we'll iterate keys and check
    // Note: LRUCache doesn't have a direct iterator for keys in all versions,
    // but we can use standard iteration if available or just clear all if critical.
    // For safety and performance in this migration, we'll implement a simple prefix/includes check

    const isRegex = pattern.startsWith("^") || pattern.includes("*");
    const regex = isRegex ? new RegExp(pattern.replace("*", ".*")) : null;

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
  }

  /**
   * Warm the cache (No-op for now as we don't have a persistent store to load from)
   */
  async warm(tasks?: any[]): Promise<void> {
    if (tasks && tasks.length > 0) {
      logger.info(`[Cache] Processing ${tasks.length} warmup tasks...`);
      for (const task of tasks) {
        try {
          const data = await task.loader();
          await this.set(task.key, data, task.options?.ttl, task.options?.category);
        } catch (err) {
          logger.warn(`[Cache] Warmup failed for ${task.key}`, err);
        }
      }
    } else {
      logger.info("[Cache] Cache warming skipped (No persistent L2 cache)");
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
   * FORENSIC INVESTIGATION: Monitor cache effectiveness
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
   * Simplified implementation for in-memory cache
   */
  async getSWR<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: any, // SWRConfig
    _namespace: string = "default",
  ): Promise<{
    data: T;
    source: "memory" | "kv" | "stale_memory" | "stale_kv" | "loader";
    timings: any;
  }> {
    const start = performance.now();
    const cached = await this.get<T>(key);

    if (cached) {
      return {
        data: cached,
        source: "memory",
        timings: {
          totalTime: performance.now() - start,
          cacheTime: performance.now() - start,
        },
      };
    }

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
  async setSWR(
    key: string,
    value: any,
    config: any,
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
