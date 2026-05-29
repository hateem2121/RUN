/**
 * Prometheus Metrics Endpoint
 * Exposes Node.js and application metrics in Prometheus format
 */

import { Router } from "express";
import prom from "prom-client";
import { getPoolMetrics } from "../db.js";
import { twoTierBatchCache } from "../lib/cache/two-tier-batch.js";
import { UnifiedCache } from "../lib/cache/unified-cache.js";
import { queryPerformanceMonitor } from "../lib/db/query-performance.js";
import { errorAggregator } from "../lib/monitoring/error-aggregator.js";
import { httpMetricsTracker } from "../lib/monitoring/http-metrics.js";
import { logger } from "../lib/monitoring/logger.js";

const router = Router();
let defaultMetricsRegistered = false;

// 1. HTTP Request Metrics
const httpRequestsTotal = new prom.Gauge({
  name: "http_requests_total",
  help: "Total number of HTTP requests mapped dynamically",
  labelNames: ["method", "route", "status_code"],
});

const httpRequestDuration = new prom.Gauge({
  name: "http_request_duration_seconds",
  help: "Average duration of HTTP requests in seconds",
  labelNames: ["method", "route"],
});

// 2. Cache Metrics
const cacheHitsTotal = new prom.Gauge({
  name: "cache_hits_total",
  help: "Total number of cache hits",
  labelNames: ["cache_type"],
});

const cacheMissesTotal = new prom.Gauge({
  name: "cache_misses_total",
  help: "Total number of cache misses",
  labelNames: ["cache_type"],
});

// 3. Database Metrics
const dbQueryDuration = new prom.Gauge({
  name: "db_query_duration_seconds",
  help: "Average database query duration in seconds",
  labelNames: ["operation"],
});

const dbConnectionsActive = new prom.Gauge({
  name: "db_connections_active",
  help: "Number of active database connections in the pool",
});

// 4. Error Metrics
const errorRateTotal = new prom.Gauge({
  name: "error_rate_total",
  help: "Total number of tracked server-side errors",
});

const errorByTypeTotal = new prom.Gauge({
  name: "error_by_type_total",
  help: "Total number of errors by type",
  labelNames: ["type"],
});

const errorBySeverityTotal = new prom.Gauge({
  name: "error_by_severity_total",
  help: "Total number of errors by severity",
  labelNames: ["severity"],
});

/**
 * GET /metrics
 * Prometheus-compatible metrics endpoint
 * Protected by METRICS_SECRET or HEALTH_CHECK_SECRET
 */
router.get("/", async (req, res) => {
  const secret =
    process.env.METRICS_SECRET ||
    process.env.HEALTH_CHECK_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "dev-metrics-key");
  const providedSecret = req.headers["x-metrics-key"] || req.query.key;

  if (!secret) {
    logger.error(
      "[Metrics] METRICS_SECRET is missing in production. Refusing access for security.",
    );
    res.status(500).json({ error: "Metrics endpoint configuration error" });
    return;
  }

  if (providedSecret !== secret) {
    logger.warn(`[Metrics] Unauthorized access attempt from ${req.ip}`);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Register default Node.js metrics once
  if (!defaultMetricsRegistered) {
    try {
      prom.collectDefaultMetrics();
      defaultMetricsRegistered = true;
      logger.info("[Metrics] Default Node.js runtime metrics registered.");
    } catch (_e) {
      // Ignore if already registered
    }
  }

  // 1. Update HTTP metrics dynamically
  try {
    const routeMetrics = httpMetricsTracker.getAllRouteMetrics();
    for (const [key, metrics] of routeMetrics.entries()) {
      const parts = key.split(" ");
      const method = parts[0] || "GET";
      const route = parts[1] || "/";

      // Set average duration (in seconds)
      httpRequestDuration.set({ method, route }, metrics.avgDuration / 1000);

      // Set request count by status code
      for (const [statusCode, count] of Object.entries(metrics.statusCodes)) {
        httpRequestsTotal.set({ method, route, status_code: String(statusCode) }, count);
      }
    }
  } catch (err) {
    logger.warn("[Metrics] Failed to update HTTP scraping gauges", err);
  }

  // 2. Update Cache metrics dynamically
  try {
    const unifiedMetrics = UnifiedCache.getInstance().getMetrics();
    cacheHitsTotal.set({ cache_type: "unified" }, unifiedMetrics.hits);
    cacheMissesTotal.set({ cache_type: "unified" }, unifiedMetrics.misses);

    const batchMetrics = twoTierBatchCache.getMetrics();
    const batchHits = Math.round(batchMetrics.totalRequests * (batchMetrics.hitRate / 100));
    const batchMisses = Math.round(batchMetrics.totalRequests * (batchMetrics.missRate / 100));
    cacheHitsTotal.set({ cache_type: "batch" }, batchHits);
    cacheMissesTotal.set({ cache_type: "batch" }, batchMisses);
  } catch (err) {
    logger.warn("[Metrics] Failed to update Cache scraping gauges", err);
  }

  // 3. Update Database metrics dynamically
  try {
    const dbStats = queryPerformanceMonitor.getPerformanceStats();
    dbQueryDuration.set({ operation: "all" }, dbStats.averageResponseTime / 1000);

    const poolMetrics = getPoolMetrics();
    dbConnectionsActive.set(poolMetrics.currentConcurrentQueries);
  } catch (err) {
    logger.warn("[Metrics] Failed to update DB scraping gauges", err);
  }

  // 4. Update Error metrics dynamically
  try {
    const errorMetrics = errorAggregator.getMetrics();
    errorRateTotal.set(errorMetrics.totalErrors);

    for (const [type, count] of Object.entries(errorMetrics.errorsByType)) {
      errorByTypeTotal.set({ type }, count);
    }
    for (const [severity, count] of Object.entries(errorMetrics.errorsBySeverity)) {
      errorBySeverityTotal.set({ severity }, count);
    }
  } catch (err) {
    logger.warn("[Metrics] Failed to update Error scraping gauges", err);
  }

  res.set("Content-Type", prom.register.contentType);
  res.send(await prom.register.metrics());
});

export default router;
