/**
 * Database Metrics Module
 * Tracks query performance and connection metrics
 */

import { sql } from "./connection.js";

const metrics = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  totalQueryTimeMs: 0,
  peakConcurrentQueries: 0,
  currentConcurrentQueries: 0,
  lastHealthCheckAt: new Date(),
  connectionPooling: "enabled",
};

// Wrap SQL function to track metrics
const internalSql = sql;

export const trackedSql = ((strings: TemplateStringsArray | string, ...values: any[]) => {
  metrics.totalQueries++;
  metrics.currentConcurrentQueries++;
  if (metrics.currentConcurrentQueries > metrics.peakConcurrentQueries) {
    metrics.peakConcurrentQueries = metrics.currentConcurrentQueries;
  }
  const start = performance.now();

  // @ts-expect-error - Neon types are tricky with wrappers
  return internalSql(strings, ...values)
    .then((res: any) => {
      metrics.successfulQueries++;
      return res;
    })
    .catch((err: any) => {
      metrics.failedQueries++;
      throw err;
    })
    .finally(() => {
      metrics.currentConcurrentQueries--;
      metrics.totalQueryTimeMs += performance.now() - start;
    });
}) as any;

/**
 * Get database metrics for monitoring
 */
export const getPoolMetrics = () => ({
  totalQueries: metrics.totalQueries,
  successfulQueries: metrics.successfulQueries,
  failedQueries: metrics.failedQueries,
  averageQueryTime:
    metrics.successfulQueries > 0
      ? Math.round(metrics.totalQueryTimeMs / metrics.successfulQueries)
      : 0,
  peakConcurrentQueries: metrics.peakConcurrentQueries,
  currentConcurrentQueries: metrics.currentConcurrentQueries,
  lastHealthCheckAt: metrics.lastHealthCheckAt,
  connectionPooling: metrics.connectionPooling,
});

/**
 * Update last health check timestamp
 */
export function updateHealthCheckTime(): void {
  metrics.lastHealthCheckAt = new Date();
}
