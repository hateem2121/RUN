import { removeUndefined } from "../../utils.js";

// Unified Metrics Endpoint
// Aggregates metrics from cache, database, and performance monitoring systems

import os from "node:os";
import type { Express } from "express";
import { z } from "zod";
import type { AlertConfig } from "../../config/alerts.js";
import { getPoolMetrics } from "../../db.js";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { UnifiedCache } from "../../lib/cache/unified-cache.js";
import { queryPerformanceMonitor } from "../../lib/db/query-performance.js";
import { alertManager } from "../../lib/monitoring/alert-manager.js";
import { errorAggregator } from "../../lib/monitoring/error-aggregator.js";
import { httpMetricsTracker } from "../../lib/monitoring/http-metrics.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";
import {
  CacheInvalidationQuerySchema,
  MetricsAlertsQuerySchema,
  MetricsErrorsQuerySchema,
} from "./schemas.js";

// Validation schema for alert threshold updates
const alertThresholdsUpdateSchema = z
  .object({
    slowQuery: z
      .object({
        durationMs: z.number().int().positive().optional(),
        consecutiveCount: z.number().int().positive().optional(),
      })
      .optional(),
    errorRate: z
      .object({
        percentageThreshold: z.number().min(0).max(100).optional(),
        timeWindowMinutes: z.number().int().positive().optional(),
      })
      .optional(),
    httpErrorRate: z
      .object({
        percentageThreshold: z.number().min(0).max(100).optional(),
      })
      .optional(),
    circuitBreaker: z
      .object({
        alertOnOpen: z.boolean().optional(),
        alertOnHalfOpen: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one threshold category must be provided",
  });

// Initialize cache instance
const cache = UnifiedCache.getInstance();

export function registerMetricsRoutes(app: Express): void {
  /**
   * GET /api/metrics
   * Returns comprehensive system metrics including cache, database, and performance data
   */
  app.get("/api/metrics", (_req, res) => {
    try {
      const startTime = performance.now();

      // PRODUCTION OPTIMIZATION: Gather metrics from all systems including batch cache
      const cacheMetrics = cache.getMetrics();
      const cacheHealth = cache.getHealthScore();
      const batchCacheMetrics = twoTierBatchCache.getMetrics(); // PRODUCTION: Add batch cache metrics
      const dbMetrics = queryPerformanceMonitor.getMetrics(); // Legacy API
      const dbPerformanceStats = queryPerformanceMonitor.getPerformanceStats(); // Recent stats
      const dbHealthy = queryPerformanceMonitor.isHealthy();
      const httpStats = httpMetricsTracker.getStats();
      const httpHealthy = httpMetricsTracker.isHealthy();
      const statusCategories = httpMetricsTracker.getStatusCodeCategories();

      // System metrics
      const systemMetrics = {
        hostname: os.hostname(),
        platform: os.platform(),
        nodeVersion: process.version,
        pid: process.pid,
        uptime: {
          process: Math.round(process.uptime()),
          system: Math.round(os.uptime()),
        },
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          systemTotal: Math.round(os.totalmem() / 1024 / 1024),
          systemFree: Math.round(os.freemem() / 1024 / 1024),
          systemUsagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0]?.model || "unknown",
          loadAverage: os.loadavg().map((load) => Math.round(load * 100) / 100),
        },
      };

      // Overall health score (weighted average)
      const overallHealth = Math.round(
        cacheHealth * 0.3 + // 30% cache health
          (dbHealthy ? 100 : 0) * 0.3 + // 30% db health (binary)
          (httpHealthy ? 100 : 0) * 0.25 + // 25% HTTP health (<5% 5xx error rate)
          (systemMetrics.memory.systemUsagePercent < 90 ? 100 : 50) * 0.15, // 15% memory health
      );

      const response = {
        timestamp: new Date().toISOString(),
        responseTime: Math.round((performance.now() - startTime) * 100) / 100,
        health: {
          overall: overallHealth,
          status: overallHealth >= 80 ? "healthy" : overallHealth >= 50 ? "degraded" : "unhealthy",
          cache: {
            score: cacheHealth,
            healthy: cacheHealth >= 70,
          },
          database: {
            healthy: dbHealthy,
            avgResponseTime: dbMetrics.avgResponseTime,
          },
          http: {
            healthy: httpHealthy,
            totalRequests: httpStats.totalRequests,
            avgLatency: httpStats.averageLatency,
            errorRate: ((statusCategories["5xx"] || 0) / (httpStats.totalRequests || 1)) * 100,
          },
          system: {
            memoryUsage: systemMetrics.memory.systemUsagePercent,
            healthy: systemMetrics.memory.systemUsagePercent < 90,
          },
        },
        cache: {
          // BACKWARD COMPATIBILITY: Keep original top-level fields for existing clients
          ...cacheMetrics,
          healthScore: cacheHealth,
          // PRODUCTION OPTIMIZATION: Add nested structure for granular monitoring
          unified: {
            ...cacheMetrics,
            healthScore: cacheHealth,
            meetsTarget: cacheMetrics.hitRate >= 85,
            targetHitRate: "85%",
          },
          batch: {
            ...batchCacheMetrics,
            meetsTarget: batchCacheMetrics.hitRate >= 85,
            targetHitRate: "85%",
          },
        },
        database: {
          legacy: dbMetrics, // All-time counters, 100-query rolling window
          recent: dbPerformanceStats, // Last hour stats
        },
        http: {
          stats: httpStats,
          statusCategories,
          healthy: httpHealthy,
        },
        system: systemMetrics,
      };

      res.json(response);
    } catch (error) {
      logger.error(
        "[Metrics] Failed to gather metrics:",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({
        error: "Failed to gather metrics",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/metrics/cache
   * Returns detailed cache-specific metrics
   */
  app.get("/api/metrics/cache", (_req, res) => {
    try {
      const metrics = cache.getMetrics();
      const healthScore = cache.getHealthScore();

      res.json({
        timestamp: new Date().toISOString(),
        metrics,
        healthScore,
        status: healthScore >= 70 ? "healthy" : healthScore >= 40 ? "degraded" : "critical",
      });
    } catch (error) {
      logger.error(
        "[Metrics] Failed to gather cache metrics:",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({
        error: "Failed to gather cache metrics",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * CHUNK 5: GET /api/batch-cache-metrics
   * Returns TwoTierBatchCache metrics for monitoring batch query performance
   */
  app.get("/api/batch-cache-metrics", (_req, res) => {
    try {
      const batchMetrics = twoTierBatchCache.getMetrics();

      res.json({
        timestamp: new Date().toISOString(),
        cacheSystem: "TwoTierBatchCache (Chunk 5)",
        metrics: {
          hitRate: `${batchMetrics.hitRate.toFixed(2)}%`,
          l1HitRate: `${batchMetrics.l1HitRate.toFixed(2)}%`,
          l2HitRate: `${batchMetrics.l2HitRate.toFixed(2)}%`,
          missRate: `${batchMetrics.missRate.toFixed(2)}%`,
          avgL1Time: `${batchMetrics.avgL1Time.toFixed(2)}ms`,
          avgL2Time: `${batchMetrics.avgL2Time.toFixed(2)}ms`,
          avgDbTime: `${batchMetrics.avgDbTime.toFixed(2)}ms`,
          totalRequests: batchMetrics.totalRequests,
        },
        successCriteria: {
          hitRateTarget: ">80%",
          hitRateCurrent: `${batchMetrics.hitRate.toFixed(2)}%`,
          hitRateMet: batchMetrics.hitRate >= 80,
          batchQueryTarget: "<300ms",
          batchQueryCurrent: `${batchMetrics.avgDbTime.toFixed(2)}ms`,
          batchQueryMet: batchMetrics.avgDbTime < 300 || batchMetrics.avgDbTime === 0,
        },
        health: {
          status:
            batchMetrics.hitRate >= 80 &&
            (batchMetrics.avgDbTime < 300 || batchMetrics.avgDbTime === 0)
              ? "healthy"
              : "degraded",
          cacheEfficiency:
            batchMetrics.hitRate >= 80 ? "excellent" : batchMetrics.hitRate >= 60 ? "good" : "poor",
          queryPerformance:
            batchMetrics.avgDbTime < 300 || batchMetrics.avgDbTime === 0
              ? "excellent"
              : batchMetrics.avgDbTime < 500
                ? "acceptable"
                : "slow",
        },
      });

      // CHUNK 5: Log performance report for monitoring
      twoTierBatchCache.logPerformanceReport("Global Metrics Endpoint");
    } catch (error) {
      logger.error(
        "[Metrics] Failed to gather batch cache metrics:",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({
        error: "Failed to gather batch cache metrics",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/metrics/database
   * Returns detailed database performance metrics including connection pool status
   */
  app.get("/api/metrics/database", (_req, res) => {
    try {
      const legacyMetrics = queryPerformanceMonitor.getMetrics();
      const performanceStats = queryPerformanceMonitor.getPerformanceStats();
      const performanceReport = queryPerformanceMonitor.generatePerformanceReport();
      const healthy = queryPerformanceMonitor.isHealthy();
      const poolMetrics = getPoolMetrics();

      res.json({
        timestamp: new Date().toISOString(),
        healthy,
        pool: poolMetrics, // Connection pool metrics (new)
        legacy: legacyMetrics, // All-time counters
        recent: performanceStats, // Last hour
        report: performanceReport, // Detailed report with slow queries
      });
    } catch (error) {
      logger.error(
        "[Metrics] Failed to gather database metrics:",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({
        error: "Failed to gather database metrics",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/metrics/system
   * Returns system-level metrics (CPU, memory, OS)
   */
  app.get("/api/metrics/system", (_req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const systemMem = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      };

      res.json({
        timestamp: new Date().toISOString(),
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            arrayBuffers: memUsage.arrayBuffers,
          },
        },
        system: {
          hostname: os.hostname(),
          type: os.type(),
          platform: os.platform(),
          release: os.release(),
          uptime: os.uptime(),
          memory: {
            total: systemMem.total,
            free: systemMem.free,
            used: systemMem.used,
            usagePercent: (systemMem.used / systemMem.total) * 100,
          },
          cpu: {
            cores: os.cpus().length,
            model: os.cpus()[0]?.model,
            speed: os.cpus()[0]?.speed,
            loadAverage: os.loadavg(),
          },
        },
      });
    } catch (error) {
      logger.error(
        "[Metrics] Failed to gather system metrics:",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({
        error: "Failed to gather system metrics",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // PHASE 2: GC metrics endpoint
  app.get("/api/metrics/gc", (_req, res) => {
    try {
      const gcMetrics = alertManager.getGCMetrics();
      const thresholds = alertManager.getThresholds();
      const gcThreshold = thresholds.gcPause.thresholdMs;

      res.json({
        timestamp: new Date().toISOString(),
        gcEnabled: typeof global.gc !== "undefined",
        metrics: gcMetrics,
        threshold: gcThreshold,
        status: gcMetrics.maxPauseTime > gcThreshold ? "warning" : "healthy",
      });
    } catch (error) {
      logger.error(
        "[Metrics] Failed to gather GC metrics:",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({
        error: "Failed to gather GC metrics",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/metrics/http
   * Returns detailed HTTP request/response metrics
   */
  app.get("/api/metrics/http", (_req, res) => {
    try {
      const stats = httpMetricsTracker.getStats();
      const statusCategories = httpMetricsTracker.getStatusCodeCategories();
      const healthy = httpMetricsTracker.isHealthy();

      res.json({
        timestamp: new Date().toISOString(),
        healthy,
        stats,
        statusCategories,
        errorRate: ((statusCategories["5xx"] || 0) / (stats.totalRequests || 1)) * 100,
      });
    } catch (error) {
      logger.error(
        "[Metrics] Failed to gather HTTP metrics:",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({
        error: "Failed to gather HTTP metrics",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/metrics/errors/test
   * Test endpoint to trigger sample errors for testing error aggregation
   */
  app.get("/api/metrics/errors/test", (_req, _res, next) => {
    const testError = new Error("Test error for aggregation demo") as Error & {
      status: number;
    };
    testError.status = 500;
    next(testError);
  });

  /**
   * GET /api/metrics/errors
   * Returns error aggregation and analysis metrics
   */
  app.get("/api/metrics/errors", (req, res) => {
    try {
      const query = MetricsErrorsQuerySchema.parse(req.query);
      const { type, severity, since, limit } = query;

      // Get aggregated metrics
      const metrics = errorAggregator.getMetrics();

      // If filters provided, also return filtered errors
      let filtered;
      if (type || severity || since || limit) {
        filtered = errorAggregator.getErrorsFiltered(
          removeUndefined({
            type,
            severity,
            since: since ? new Date(since) : undefined,
            limit,
          }),
        );
      }

      res.json({
        timestamp: new Date().toISOString(),
        metrics,
        ...(filtered && { filtered }),
      });
    } catch (error) {
      logger.error(
        "[Metrics] Failed to gather error metrics:",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({
        error: "Failed to gather error metrics",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/metrics/alerts
   * Returns alert history and threshold configuration
   */
  app.get("/api/metrics/alerts", (req, res) => {
    try {
      const query = MetricsAlertsQuerySchema.parse(req.query);
      const { type, limit } = query;

      // Get alerts (optionally filtered by type)
      const alerts = type
          ? alertManager.getAlertsByType(type)
          : alertManager.getAlerts(limit);

      // Check current metrics and get any new alerts
      const newAlerts = alertManager.checkMetrics();

      res.json({
        timestamp: new Date().toISOString(),
        thresholds: alertManager.getThresholds(),
        alerts,
        newAlerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter((a) => a.severity === "critical").length,
          warning: alerts.filter((a) => a.severity === "warning").length,
        },
      });
    } catch (error) {
      logger.error(
        "[Metrics] Failed to gather alert metrics:",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({
        error: "Failed to gather alert metrics",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * PUT /api/metrics/alerts/thresholds
   * Update alert thresholds (runtime configuration) with validation
   */
  // prettier-ignore
  app.put("/api/metrics/alerts/thresholds", authService.requireAdmin, (req, res) => {
    try {
      // Validate request body
      const validation = alertThresholdsUpdateSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid threshold configuration",
          message: "Payload validation failed",
          issues: validation.error.flatten(),
        });
      }

      // Update thresholds with validated data (type assertion safe due to validation)
      alertManager.updateThresholds(validation.data as Partial<AlertConfig>);

      return res.json({
        success: true,
        thresholds: alertManager.getThresholds(),
        message: "Alert thresholds updated successfully",
      });
    } catch (error) {
      logger.error(
        "[Metrics] Failed to update alert thresholds:",
        error instanceof Error ? error : new Error(String(error)),
      );
      return res.status(500).json({
        error: "Failed to update alert thresholds",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * CHUNK 8: GET /api/health/db
   * Database health check endpoint - tests connectivity with SELECT 1 query
   * Returns: { status: 'healthy'|'unhealthy', latency: number, timestamp: ISO string }
   */
  app.get("/api/health/db", async (_req, res) => {
    try {
      // Test database connectivity with 3s timeout
      const healthCheck = await withTimeout(
        getStorage().checkDatabaseHealth(),
        3000,
        "Database health check",
      );

      const response = {
        status: healthCheck.healthy ? "healthy" : "unhealthy",
        latency: healthCheck.latency,
        timestamp: new Date().toISOString(),
      };

      // Return 503 Service Unavailable if unhealthy, 200 OK if healthy
      const statusCode = healthCheck.healthy ? 200 : 503;
      return res.status(statusCode).json(response);
    } catch (error) {
      // Timeout or other error occurred
      logger.error("[Health Check] Database health check failed:", error);
      return res.status(503).json({
        status: "unhealthy",
        latency: 3000, // Timeout value
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * GET /api/cache/invalidation-time
   * Returns the latest cache invalidation timestamp for a given pattern
   * Used by frontend to detect when backend cache was invalidated
   * Query params: pattern (required) - the cache pattern to check (e.g., 'media:')
   */
  app.get("/api/cache/invalidation-time", async (req, res) => {
    try {
      const { pattern } = CacheInvalidationQuerySchema.parse(req.query);

      const { getLatestInvalidationTime } = await import("../../lib/cache/cache-events.js");
      const timestamp = await getLatestInvalidationTime(pattern);

      return res.json({
        pattern,
        timestamp,
        lastInvalidation: timestamp > 0 ? new Date(timestamp).toISOString() : null,
      });
    } catch (error) {
      logger.error("[Metrics] Failed to get cache invalidation time:", error);
      return res.status(500).json({
        error: "Failed to get cache invalidation time",
        message: error instanceof Error ? error.message : String(error),
        timestamp: 0,
      });
    }
  });

  logger.info(
    "[Routes] Unified metrics endpoints registered: /api/metrics, /api/metrics/cache, /api/metrics/database, /api/metrics/http, /api/metrics/system, /api/metrics/errors, /api/metrics/alerts, /api/health/db, /api/cache/invalidation-time",
  );
}
