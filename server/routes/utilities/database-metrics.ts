/**
 * Database Metrics Endpoint
 * Exposes pool metrics for monitoring (admin-only access)
 */

import type { Request, Response, Router } from "express";
import { getPoolMetrics } from "../../db.js";
import { authService } from "../../services/auth-service.js";

export function registerDatabaseMetricsRoute(router: Router): void {
  /**
   * GET /api/metrics/database
   * Returns database connection pool metrics
   * Protected: Admin only
   */
  router.get(
    "/api/metrics/database",
    authService.requireAdmin,
    async (_req: Request, res: Response) => {
      const metrics = getPoolMetrics();

      res.json({
        status: "healthy",
        metrics: {
          totalQueries: metrics.totalQueries,
          successfulQueries: metrics.successfulQueries,
          failedQueries: metrics.failedQueries,
          averageQueryTime: Math.round(metrics.averageQueryTime * 100) / 100,
          peakConcurrentQueries: metrics.peakConcurrentQueries,
          currentConcurrentQueries: metrics.currentConcurrentQueries,
          connectionPooling: metrics.connectionPooling,
          lastHealthCheckAt: metrics.lastHealthCheckAt?.toISOString() ?? null,
        },
        computedMetrics: {
          successRate:
            metrics.totalQueries > 0
              ? Math.round((metrics.successfulQueries / metrics.totalQueries) * 10000) / 100
              : 100,
          failureRate:
            metrics.totalQueries > 0
              ? Math.round((metrics.failedQueries / metrics.totalQueries) * 10000) / 100
              : 0,
        },
        timestamp: new Date().toISOString(),
      });
    },
  );
}
