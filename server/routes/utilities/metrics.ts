import { removeUndefined } from "../../lib/utilities/core-utils.js";

// Unified Metrics Endpoint
// Aggregates metrics from cache, database, and performance monitoring systems

import os from "node:os";
import type { Express } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import type { AlertConfig } from "../../config/alerts.js";
import { twoTierBatchCache } from "../../lib/cache/two-tier-batch.js";
import { UnifiedCache } from "../../lib/cache/unified-cache.js";
import { queryPerformanceMonitor } from "../../lib/db/query-performance.js";
import { ValidationError } from "../../lib/errors.js";
import { alertManager } from "../../lib/monitoring/alert-manager.js";
import { errorAggregator } from "../../lib/monitoring/error-aggregator.js";
import { httpMetricsTracker } from "../../lib/monitoring/http-metrics.js";
import { logger } from "../../lib/monitoring/logger.js";
import { authService } from "../../services/auth-service.js";
import { systemService } from "../../services/system.service.js";
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
  app.get("/api/metrics", authService.requireAdmin, (_req, res) => {
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
  });

  /**
   * GET /api/metrics/cache
   * Returns detailed cache-specific metrics
   */
  app.get("/api/metrics/cache", authService.requireAdmin, (_req, res) => {
    const metrics = cache.getMetrics();
    const healthScore = cache.getHealthScore();

    res.json({
      timestamp: new Date().toISOString(),
      metrics,
      healthScore,
      status: healthScore >= 70 ? "healthy" : healthScore >= 40 ? "degraded" : "critical",
    });
  });

  /**
   * CHUNK 5: GET /api/batch-cache-metrics
   * Returns TwoTierBatchCache metrics for monitoring batch query performance
   */
  app.get("/api/batch-cache-metrics", authService.requireAdmin, (_req, res) => {
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
  });

  /**
   * GET /api/metrics/database
   * Returns detailed database performance metrics including connection pool status
   */
  app.get("/api/metrics/database", authService.requireAdmin, (_req, res) => {
    const legacyMetrics = queryPerformanceMonitor.getMetrics();
    const performanceStats = queryPerformanceMonitor.getPerformanceStats();
    const performanceReport = queryPerformanceMonitor.generatePerformanceReport();
    const healthy = queryPerformanceMonitor.isHealthy();
    const poolMetrics = systemService.getPoolMetrics();

    res.json({
      timestamp: new Date().toISOString(),
      healthy,
      pool: poolMetrics, // Connection pool metrics (new)
      legacy: legacyMetrics, // All-time counters
      recent: performanceStats, // Last hour
      report: performanceReport, // Detailed report with slow queries
    });
  });

  /**
   * GET /api/metrics/system
   * Returns system-level metrics (CPU, memory, OS)
   */
  app.get("/api/metrics/system", authService.requireAdmin, (_req, res) => {
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
  });

  // PHASE 2: GC metrics endpoint
  app.get("/api/metrics/gc", authService.requireAdmin, (_req, res) => {
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
  });

  /**
   * GET /api/metrics/http
   * Returns detailed HTTP request/response metrics
   */
  app.get("/api/metrics/http", authService.requireAdmin, (_req, res) => {
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
  });

  /**
   * GET /api/metrics/errors/test
   * Test endpoint to trigger sample errors for testing error aggregation
   */
  app.get("/api/metrics/errors/test", authService.requireAdmin, (_req, _res) => {
    const testError = new Error("Test error for aggregation demo") as Error & {
      status: number;
    };
    testError.status = 500;
    throw testError;
  });

  /**
   * GET /api/metrics/errors
   * Returns error aggregation and analysis metrics
   */
  app.get(
    "/api/metrics/errors",
    authService.requireAdmin,
    validateRequest({ query: MetricsErrorsQuerySchema }),
    (req, res) => {
      const { type, severity, since, limit } = req.query as z.infer<
        typeof MetricsErrorsQuerySchema
      >;

      // Get aggregated metrics
      const metrics = errorAggregator.getMetrics();

      // If filters provided, also return filtered errors
      let filtered: ReturnType<typeof errorAggregator.getErrorsFiltered> | undefined;
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
    },
  );

  /**
   * GET /api/metrics/alerts
   * Returns alert history and threshold configuration
   */
  app.get(
    "/api/metrics/alerts",
    authService.requireAdmin,
    validateRequest({ query: MetricsAlertsQuerySchema }),
    (req, res) => {
      const { type, limit } = req.query as z.infer<typeof MetricsAlertsQuerySchema>;

      // Get alerts (optionally filtered by type)
      const alerts = type ? alertManager.getAlertsByType(type) : alertManager.getAlerts(limit);

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
    },
  );

  /**
   * PUT /api/metrics/alerts/thresholds
   * Update alert thresholds (runtime configuration) with validation
   */
  // prettier-ignore
  app.put("/api/metrics/alerts/thresholds", authService.requireAdmin, (req, res) => {
    // Validate request body
    const validation = alertThresholdsUpdateSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError("Invalid threshold configuration", {
        details: validation.error.flatten(),
      });
    }

    // Update thresholds with validated data (type assertion safe due to validation)
    alertManager.updateThresholds(validation.data as Partial<AlertConfig>);

    return res.json({
      success: true,
      thresholds: alertManager.getThresholds(),
      message: "Alert thresholds updated successfully",
    });
  });

  /**
   * CHUNK 8: GET /api/health/db
   * Database health check endpoint - tests connectivity with SELECT 1 query
   * Returns: { status: 'healthy'|'unhealthy', latency: number, timestamp: ISO string }
   */
  app.get("/api/health/db", async (_req, res) => {
    const start = Date.now();
    const result = await systemService.checkDatabaseConnectivity();
    const latency = Date.now() - start;

    if (result.isOk()) {
      return res.status(200).json({
        status: "healthy",
        latency,
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(503).json({
        status: "unhealthy",
        latency,
        error: result.error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /api/cache/invalidation-time
   * Returns the latest cache invalidation timestamp for a given pattern
   * Used by frontend to detect when backend cache was invalidated
   * Query params: pattern (required) - the cache pattern to check (e.g., 'media:')
   */
  app.get(
    "/api/cache/invalidation-time",
    authService.requireAdmin,
    validateRequest({ query: CacheInvalidationQuerySchema }),
    async (req, res) => {
      const { pattern } = req.query as z.infer<typeof CacheInvalidationQuerySchema>;

      const { getLatestInvalidationTime } = await import("../../lib/cache/cache-events.js");
      const timestamp = await getLatestInvalidationTime(pattern);

      return res.json({
        pattern,
        timestamp,
        lastInvalidation: timestamp > 0 ? new Date(timestamp).toISOString() : null,
      });
    },
  );

  logger.info(
    "[Routes] Unified metrics endpoints registered: /api/metrics, /api/metrics/cache, /api/metrics/database, /api/metrics/http, /api/metrics/system, /api/metrics/errors, /api/metrics/alerts, /api/health/db, /api/cache/invalidation-time",
  );
}
