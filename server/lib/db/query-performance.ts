/**
 * QUERY PERFORMANCE MONITOR - PHASE 2 DATABASE OPTIMIZATION
 * Tracks slow queries >500ms and provides real-time alerting
 * Integrates with existing logging and monitoring infrastructure
 */

import { UnifiedCache } from "../cache/unified-cache.js";
import { logger } from "../monitoring/logger.js";

interface QueryMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  cacheHit: boolean;
  parameters?: Record<string, unknown>;
  phases?: Record<string, number>; // PHASE 2A: Named phase timings for granular analysis
}

interface PerformanceStats {
  totalQueries: number;
  slowQueries: number;
  averageResponseTime: number;
  cacheHitRate: number;
  slowQueryThreshold: number;
  lastCleanup: number;
}

export class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor;
  private cache?: UnifiedCache; // Lazy-loaded to prevent circular dependency
  private metrics: QueryMetrics[] = [];

  // PHASE 6: Query categorization with different thresholds for accurate monitoring
  private readonly QUERY_CATEGORIES = {
    CACHE_WARMUP: {
      patterns: ["legacy-query", "warmCache", "preload", "homepage-batch"],
      threshold: 2000, // Cache warming can take longer
      alertOnSlow: false, // Don't alert on expected slow operations
    },
    USER_FACING: {
      patterns: ["getProducts", "getCategories", "getProductById", "getProductByPath", "getMedia"],
      threshold: 400, // User-facing queries should be fast
      alertOnSlow: true,
    },
    BACKGROUND: {
      patterns: ["cleanup", "audit", "metrics", "sync"],
      threshold: 1000, // Background tasks can be slower
      alertOnSlow: false,
    },
    ADMIN: {
      patterns: ["createProduct", "updateProduct", "bulkUpdate", "upload"],
      threshold: 800, // Admin operations slightly more tolerant
      alertOnSlow: true,
    },
  };

  private readonly DEFAULT_SLOW_QUERY_THRESHOLD = 400; // Default for uncategorized queries
  private readonly MAX_METRICS_BUFFER = 1000;
  private readonly METRICS_TTL = 60 * 60 * 1000; // 1 hour
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes between alerts

  private lastAlertTime = 0;
  private consecutiveSlowQueries = 0;

  // Legacy API state tracking (all-time counters for backward compatibility)
  private activeConnections = 0;
  private timeouts = 0;
  private totalQueries = 0; // All-time query count (original behavior)
  private legacyQueryHistory: number[] = []; // Rolling 100-query window for avgResponseTime (original behavior)
  private readonly MAX_LEGACY_HISTORY = 100;

  private constructor() {
    // Cache is lazy-loaded to prevent circular dependency with UnifiedCache
    this.initializeCleanupInterval();
  }

  /**
   * Get cache instance (lazy-loaded to prevent circular dependency)
   */
  private getCache(): UnifiedCache | null {
    if (!this.cache) {
      try {
        this.cache = UnifiedCache.getInstance();
      } catch (_error) {
        // Cache not available yet (circular dependency during initialization)
        return null;
      }
    }
    return this.cache;
  }

  public static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor();
    }
    return QueryPerformanceMonitor.instance;
  }

  /**
   * Start tracking a database query
   */
  startQuery(operation: string): QueryTracker {
    return new QueryTracker(operation, this);
  }

  /**
   * Backward-compatible simple tracking (for legacy code)
   * @param startTime - Performance.now() timestamp when query started
   * @param success - Whether query succeeded
   */
  trackQuery(startTime: number, success: boolean): void {
    // performance.now() is in milliseconds, consistent with our duration tracking
    const duration = performance.now() - startTime;

    // Track all-time counters for legacy getMetrics()
    this.totalQueries++;
    if (!success) {
      this.timeouts++;
    }

    // Update rolling 100-query window for avgResponseTime (original behavior)
    this.legacyQueryHistory.push(duration);

    // PHASE 3 BLOCK 3A: Memory leak fix - use slice() instead of shift() to prevent unbounded growth
    if (this.legacyQueryHistory.length > this.MAX_LEGACY_HISTORY) {
      // Log warning if buffer significantly exceeds max (10% threshold)
      if (this.legacyQueryHistory.length > this.MAX_LEGACY_HISTORY * 1.1) {
        logger.warn(
          `[QueryPerformanceMonitor] Legacy query history overflow: ${this.legacyQueryHistory.length} > ${this.MAX_LEGACY_HISTORY * 1.1} (10% threshold)`,
        );
      }
      // Truncate to last MAX_LEGACY_HISTORY entries (more efficient than shift())
      this.legacyQueryHistory = this.legacyQueryHistory.slice(-this.MAX_LEGACY_HISTORY);
    }

    // Record as generic operation
    this.recordQuery({
      operation: "legacy-query",
      duration,
      timestamp: Date.now(), // Use current timestamp for the record
      cacheHit: false,
      parameters: { success },
    }) as any;
  }

  /**
   * Legacy API: Update connection count
   */
  updateConnectionCount(count: number): void {
    this.activeConnections = count;
  }

  /**
   * Legacy API: Get performance metrics
   * Uses all-time counters and rolling 100-query window to match original PerformanceMonitor semantics
   */
  getMetrics() {
    const timeoutRate = this.totalQueries > 0 ? (this.timeouts / this.totalQueries) * 100 : 0;

    // Calculate avgResponseTime from rolling 100-query window (original behavior)
    const avgResponseTime =
      this.legacyQueryHistory.length > 0
        ? this.legacyQueryHistory.reduce((sum, time) => sum + time, 0) /
          this.legacyQueryHistory.length
        : 0;

    return {
      activeConnections: this.activeConnections,
      queryCount: this.totalQueries, // All-time counter (original behavior)
      avgResponseTime: Math.round(avgResponseTime * 100) / 100, // Rolling 100-query window (original behavior)
      timeouts: this.timeouts, // All-time counter
      timeoutRate: Math.round(timeoutRate * 100) / 100,
      lastQueryTimes: this.legacyQueryHistory.slice(-10), // Last 10 from rolling window
    };
  }

  /**
   * Legacy API: Reset metrics
   */
  reset(): void {
    this.metrics = [];
    this.consecutiveSlowQueries = 0;
    this.lastAlertTime = 0;
    this.timeouts = 0;
    this.activeConnections = 0;
    this.totalQueries = 0;
    this.legacyQueryHistory = [];
  }

  /**
   * Legacy API: Health check
   */
  isHealthy(): boolean {
    return !this.isPerformanceDegraded();
  }

  /**
   * PHASE 6: Get appropriate threshold for a query based on its category
   */
  private getThresholdForQuery(operation: string): {
    threshold: number;
    shouldAlert: boolean;
    category: string;
  } {
    for (const [categoryName, config] of Object.entries(this.QUERY_CATEGORIES)) {
      if (config.patterns.some((pattern) => operation.includes(pattern))) {
        return {
          threshold: config.threshold,
          shouldAlert: config.alertOnSlow,
          category: categoryName,
        };
      }
    }
    return {
      threshold: this.DEFAULT_SLOW_QUERY_THRESHOLD,
      shouldAlert: true,
      category: "UNCATEGORIZED",
    };
  }

  /**
   * Record completed query metrics
   */
  recordQuery(metrics: QueryMetrics): void {
    // Add to metrics buffer
    this.metrics.push(metrics);

    // Keep buffer size manageable
    if (this.metrics.length > this.MAX_METRICS_BUFFER) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_BUFFER / 2);
    }

    // PHASE 6: Get category-specific threshold
    const { threshold, shouldAlert, category } = this.getThresholdForQuery(metrics.operation);

    // Check for slow query alerts with category-specific threshold
    if (metrics.duration > threshold) {
      if (shouldAlert) {
        this.handleSlowQuery(metrics, threshold, category);
      } else {
        // CRITICAL FIX: DON'T reset counter for non-alerting categories
        // This allows 3 consecutive USER_FACING slow queries to trigger alert
        // even if cache-warmup queries happen in between
        logger.debug(
          `⏱️  Expected slow ${category}: ${metrics.operation} took ${metrics.duration}ms (threshold: ${threshold}ms)`,
          { cacheHit: metrics.cacheHit, category },
        );
      }
    } else {
      // CRITICAL FIX: Only reset counter for FAST alertable queries
      // Non-alerting queries don't affect the consecutive counter
      if (shouldAlert) {
        this.consecutiveSlowQueries = 0;
      }
      logger.debug(
        `⚡ Query completed: ${metrics.operation} in ${metrics.duration}ms (category: ${category})`,
        { cacheHit: metrics.cacheHit },
      );
    }

    // Store metrics in cache for persistence
    this.persistMetrics();
  }

  /**
   * Handle slow query detection and alerting
   * PHASE 6: Only increments consecutiveSlowQueries for alertable categories
   */
  private handleSlowQuery(metrics: QueryMetrics, threshold: number, category: string): void {
    // CRITICAL FIX: Only count consecutive slow queries for alertable categories
    // This prevents cache-warmup operations from triggering cascade alerts
    this.consecutiveSlowQueries++;

    const now = Date.now();
    const shouldAlert =
      now - this.lastAlertTime > this.ALERT_COOLDOWN || this.consecutiveSlowQueries >= 3; // Alert on 3 consecutive slow queries

    if (shouldAlert) {
      this.triggerSlowQueryAlert(metrics, threshold, category);
      this.lastAlertTime = now;
      this.consecutiveSlowQueries = 0;
    } else {
      // Log warning but don't trigger full alert
      logger.warn(
        `🐌 SLOW QUERY: ${metrics.operation} took ${metrics.duration}ms (threshold: ${threshold}ms, category: ${category})`,
        { cacheHit: metrics.cacheHit, parameters: metrics.parameters },
      );
    }
  }

  /**
   * Trigger slow query alert with detailed information
   */
  private triggerSlowQueryAlert(metrics: QueryMetrics, threshold: number, category: string): void {
    const stats = this.getPerformanceStats();

    logger.error(
      `🚨 SLOW QUERY ALERT: ${metrics.operation} exceeded ${threshold}ms threshold (category: ${category})`,
      {
        duration: metrics.duration,
        threshold: threshold,
        category: category,
        cacheHit: metrics.cacheHit,
        consecutiveSlowQueries: this.consecutiveSlowQueries,
        averageResponseTime: stats.averageResponseTime,
        slowQueryRate: (stats.slowQueries / Math.max(stats.totalQueries, 1)) * 100,
        parameters: metrics.parameters,
      },
    );

    // Store alert in cache for dashboard reporting
    this.storeAlert({
      timestamp: metrics.timestamp,
      operation: metrics.operation,
      duration: metrics.duration,
      threshold: threshold,
      category: category,
      performanceStats: stats,
    }) as any;
  }

  /**
   * Get current performance statistics
   * PHASE 6: Now considers category-specific thresholds for slow query detection
   * ONLY counts queries from categories where alertOnSlow is true
   */
  getPerformanceStats(): PerformanceStats {
    const recentMetrics = this.getRecentMetrics();
    const totalQueries = recentMetrics.length;

    // PHASE 6: Filter to ONLY alertable queries for accurate performance measurement
    const alertableMetrics = recentMetrics.filter((m: any) => {
      const { shouldAlert } = this.getThresholdForQuery(m.operation);
      return shouldAlert;
    }) as any;

    // Calculate slow queries ONLY for alertable categories
    const slowQueries = alertableMetrics.filter((m: any) => {
      const { threshold } = this.getThresholdForQuery(m.operation);
      return m.duration > threshold;
    }).length;

    const cacheHits = recentMetrics.filter((m: any) => m.cacheHit).length;

    // CRITICAL FIX: Calculate average ONLY from alertable queries
    // This prevents cache-warmup from inflating average response time
    const averageResponseTime =
      alertableMetrics.length > 0
        ? alertableMetrics.reduce((sum: any, m: any) => sum + m.duration, 0) /
          alertableMetrics.length
        : 0;

    const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;

    return {
      totalQueries,
      slowQueries, // Now only includes alertable slow queries
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowQueryThreshold: this.DEFAULT_SLOW_QUERY_THRESHOLD, // Default threshold for reference
      lastCleanup: Date.now(),
    };
  }

  /**
   * Get metrics from the last hour
   */
  private getRecentMetrics(): QueryMetrics[] {
    const oneHourAgo = Date.now() - this.METRICS_TTL;
    return this.metrics.filter((m: any) => m.timestamp > oneHourAgo);
  }

  /**
   * Check if query performance is degraded
   * PHASE 6: ONLY uses category-aware slow query rate for degradation detection
   * CRITICAL FIX: Don't compare average against fixed threshold since different
   * categories have different acceptable latencies (admin: 800ms, user: 400ms, etc.)
   */
  isPerformanceDegraded(): boolean {
    const stats = this.getPerformanceStats();
    // Performance is degraded ONLY if >10% of ALERTABLE queries exceed their category thresholds
    // This prevents admin/cache-warmup operations from triggering false degraded state
    const alertableMetrics = this.getRecentMetrics().filter((m: any) => {
      const { shouldAlert } = this.getThresholdForQuery(m.operation);
      return shouldAlert;
    }) as any;

    const alertableCount = alertableMetrics.length;
    if (alertableCount === 0) return false; // No alertable queries, system is healthy

    return stats.slowQueries / alertableCount > 0.1; // >10% of alertable queries are slow
  }

  /**
   * Generate performance report for diagnostics
   * PHASE 6: Slow queries now filtered by category-specific thresholds
   * ONLY includes alertable queries in the report
   */
  generatePerformanceReport(): {
    summary: PerformanceStats;
    recentAlerts: Array<Record<string, unknown>>;
    topSlowQueries: QueryMetrics[];
  } {
    const recentMetrics = this.getRecentMetrics();
    // PHASE 6: Filter slow queries - ONLY include alertable categories
    const slowQueries = recentMetrics
      .filter((m: any) => {
        const { threshold, shouldAlert } = this.getThresholdForQuery(m.operation);
        return shouldAlert && m.duration > threshold; // Only alertable slow queries
      })
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      summary: this.getPerformanceStats(),
      recentAlerts: [], // Will be populated from cache
      topSlowQueries: slowQueries,
    };
  }

  /**
   * Store performance metrics in persistent cache
   */
  private async persistMetrics(): Promise<void> {
    const cache = this.getCache();
    if (!cache) return; // Cache not available yet

    try {
      const stats = this.getPerformanceStats();
      await cache.set("performance:stats", stats, this.METRICS_TTL);
    } catch (error) {
      logger.warn(
        "[QueryPerformanceMonitor] Failed to persist metrics",
        undefined,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Store alert information for reporting
   */
  private async storeAlert(alert: Record<string, unknown>): Promise<void> {
    const cache = this.getCache();
    if (!cache) return; // Cache not available yet

    try {
      const alertKey = `performance:alert:${Date.now()}`;
      await cache.set(alertKey, alert, 24 * 60 * 60 * 1000); // 24 hours
    } catch (error) {
      logger.warn(
        "[QueryPerformanceMonitor] Failed to store alert",
        undefined,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Initialize periodic cleanup
   */
  private initializeCleanupInterval(): void {
    setInterval(
      () => {
        const oneHourAgo = Date.now() - this.METRICS_TTL;
        this.metrics = this.metrics.filter((m: any) => m.timestamp > oneHourAgo);

        if (this.metrics.length === 0) {
          this.consecutiveSlowQueries = 0;
        }
      },
      10 * 60 * 1000,
    ); // Clean up every 10 minutes
  }
}

/**
 * Query tracking utility class
 * PHASE 2A: Enhanced with phase-level timing for granular performance analysis
 */
export class QueryTracker {
  private startTime: number; // PHASE 2A: Wall-clock timestamp for TTL/alerting
  private perfStart: number; // PHASE 2A: High-precision timer for duration measurement
  private operation: string;
  private monitor: QueryPerformanceMonitor;
  private cacheHit = false;
  private parameters?: Record<string, unknown>;
  private phases: Record<string, number> = {}; // PHASE 2A: Phase timings
  private static sampleCounter = 0; // For 1-in-N sampling
  private static readonly SAMPLE_RATE = 20; // Log detailed phase data 1 in 20 requests

  constructor(operation: string, monitor: QueryPerformanceMonitor) {
    this.operation = operation;
    this.monitor = monitor;
    this.startTime = Date.now(); // Wall-clock timestamp for metrics persistence
    this.perfStart = performance.now(); // High-precision timer for accurate duration
  }

  /**
   * Mark query as cache hit
   */
  setCacheHit(hit: boolean = true): this {
    this.cacheHit = hit;
    return this;
  }

  /**
   * Set query parameters for debugging
   */
  setParameters(params: Record<string, unknown>): this {
    this.parameters = params;
    return this;
  }

  /**
   * PHASE 2A: Add timing for a named phase
   * Accumulates durations if the same phase is recorded multiple times
   * @param name - Phase name (e.g., 'cacheRead', 'dbQuery', 'serialize')
   * @param durationMs - Duration in milliseconds
   */
  addPhaseTiming(name: string, durationMs: number): this {
    // CRITICAL: Accumulate instead of overwrite to handle repeated phases
    this.phases[name] = (this.phases[name] ?? 0) + durationMs;
    return this;
  }

  /**
   * PHASE 2A: Helper to time an async phase operation
   * Usage: await perfTracker.timePhase('phaseName', async () => { ... })
   */
  async timePhase<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const phaseStart = performance.now();
    try {
      return await operation();
    } finally {
      const phaseDuration = performance.now() - phaseStart;
      this.addPhaseTiming(name, phaseDuration);
    }
  }

  /**
   * Complete query tracking
   * PHASE 2A: Includes phase-level timing data and sampled detailed logging
   */
  complete(): number {
    // PHASE 2A: Use perfStart for accurate duration, startTime for wall-clock timestamp
    const duration = performance.now() - this.perfStart;

    // PHASE 2A: Sampled detailed logging (1 in 20 requests)
    QueryTracker.sampleCounter++;
    const shouldLogDetails = QueryTracker.sampleCounter % QueryTracker.SAMPLE_RATE === 0;

    if (shouldLogDetails && Object.keys(this.phases).length > 0) {
      const phaseSum = Object.values(this.phases).reduce((sum, ms) => sum + ms, 0);
      const unaccounted = duration - phaseSum;

      // PHASE 2A: Use info() instead of debug() to ensure logs are visible
      logger.info(`🔍 [Phase Breakdown] ${this.operation}`, {
        totalDuration: Math.round(duration * 100) / 100,
        cacheHit: this.cacheHit,
        phases: this.phases,
        phaseSum: Math.round(phaseSum * 100) / 100,
        unaccounted: Math.round(unaccounted * 100) / 100,
        sample: `${QueryTracker.sampleCounter}/${QueryTracker.SAMPLE_RATE}`,
      }) as any;
    }

    this.monitor.recordQuery({
      operation: this.operation,
      duration,
      timestamp: this.startTime, // Wall-clock timestamp for TTL/alerting
      cacheHit: this.cacheHit,
      ...(this.parameters ? { parameters: this.parameters } : {}),
      ...(Object.keys(this.phases).length > 0 ? { phases: this.phases } : {}), // Only include if phases recorded
    });

    return duration;
  }
}

// Export singleton instance
export const queryPerformanceMonitor = QueryPerformanceMonitor.getInstance();

// Backward-compatible alias for old performance-monitor.ts
export const performanceMonitor = queryPerformanceMonitor;
