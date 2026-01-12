/**
 * Query Performance Analyzer
 *
 * @module query-analyzer
 * @description Monitors database query performance and logs slow queries.
 * Helps identify bottlenecks and optimization opportunities.
 *
 * @performance
 * - Default slow query threshold: 100ms
 * - Logs include query text, duration, and context
 * - Integrates with OpenTelemetry for tracing
 */

import { logger } from "../monitoring/logger.js";

/**
 * Query performance thresholds (in milliseconds)
 */
export const QueryThresholds = {
  FAST: 10, // < 10ms: Optimal
  NORMAL: 50, // 10-50ms: Acceptable
  SLOW: 100, // 50-100ms: Needs attention
  CRITICAL: 500, // > 500ms: Requires immediate optimization
} as const;

/**
 * Query performance classification
 */
export type QueryPerformance = "fast" | "normal" | "slow" | "critical";

/**
 * Query analysis result
 */
export interface QueryAnalysis {
  duration: number;
  performance: QueryPerformance;
  query: string;
  timestamp: Date;
  context?: Record<string, unknown> | undefined;
}

/**
 * Classify query performance based on duration
 */
export function classifyPerformance(durationMs: number): QueryPerformance {
  if (durationMs < QueryThresholds.FAST) return "fast";
  if (durationMs < QueryThresholds.SLOW) return "normal";
  if (durationMs < QueryThresholds.CRITICAL) return "slow";
  return "critical";
}

/**
 * Analyze and log query performance
 *
 * @param query - SQL query string (sanitized, no parameters)
 * @param durationMs - Query execution time in milliseconds
 * @param context - Additional context (table name, operation type, etc.)
 *
 * @example
 * ```typescript
 * const start = performance.now();
 * const result = await db.select().from(products);
 * analyzeQuery('SELECT * FROM products', performance.now() - start, { table: 'products' });
 * ```
 */
export function analyzeQuery(
  query: string,
  durationMs: number,
  context?: Record<string, unknown>,
): QueryAnalysis {
  const performance = classifyPerformance(durationMs);
  const analysis: QueryAnalysis = {
    duration: Math.round(durationMs * 100) / 100,
    performance,
    query: truncateQuery(query),
    timestamp: new Date(),
    context,
  };

  // Log based on performance classification
  switch (performance) {
    case "critical":
      logger.error("[QueryAnalyzer] CRITICAL slow query detected", {
        ...analysis,
        recommendation: "Immediate optimization required. Check indexes and query plan.",
      });
      break;
    case "slow":
      logger.warn("[QueryAnalyzer] Slow query detected", {
        ...analysis,
        recommendation: "Consider adding indexes or optimizing query structure.",
      });
      break;
    case "normal":
      // Only log in development for normal queries
      if (process.env.NODE_ENV === "development") {
        logger.debug("[QueryAnalyzer] Query executed", analysis);
      }
      break;
    case "fast":
      // No logging for fast queries
      break;
  }

  return analysis;
}

/**
 * Truncate long queries for logging
 */
function truncateQuery(query: string, maxLength = 500): string {
  const sanitized = query.replace(/\s+/g, " ").trim();
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  return `${sanitized.substring(0, maxLength)}...`;
}

/**
 * Query metrics aggregator
 * Tracks query performance statistics over time
 */
export class QueryMetrics {
  private metrics: {
    totalQueries: number;
    fastQueries: number;
    normalQueries: number;
    slowQueries: number;
    criticalQueries: number;
    totalDuration: number;
    maxDuration: number;
  } = {
    totalQueries: 0,
    fastQueries: 0,
    normalQueries: 0,
    slowQueries: 0,
    criticalQueries: 0,
    totalDuration: 0,
    maxDuration: 0,
  };

  /**
   * Record a query's performance
   */
  record(durationMs: number): void {
    this.metrics.totalQueries++;
    this.metrics.totalDuration += durationMs;
    this.metrics.maxDuration = Math.max(this.metrics.maxDuration, durationMs);

    const performance = classifyPerformance(durationMs);
    switch (performance) {
      case "fast":
        this.metrics.fastQueries++;
        break;
      case "normal":
        this.metrics.normalQueries++;
        break;
      case "slow":
        this.metrics.slowQueries++;
        break;
      case "critical":
        this.metrics.criticalQueries++;
        break;
    }
  }

  /**
   * Get aggregated metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgDuration:
        this.metrics.totalQueries > 0
          ? Math.round((this.metrics.totalDuration / this.metrics.totalQueries) * 100) / 100
          : 0,
      slowQueryRate:
        this.metrics.totalQueries > 0
          ? Math.round(
              ((this.metrics.slowQueries + this.metrics.criticalQueries) /
                this.metrics.totalQueries) *
                10000,
            ) / 100
          : 0,
    };
  }

  /**
   * Reset metrics (typically called after exporting to monitoring system)
   */
  reset(): void {
    this.metrics = {
      totalQueries: 0,
      fastQueries: 0,
      normalQueries: 0,
      slowQueries: 0,
      criticalQueries: 0,
      totalDuration: 0,
      maxDuration: 0,
    };
  }
}

// Global query metrics instance
export const queryMetrics = new QueryMetrics();
