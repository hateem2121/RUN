// Alert Management System - Phase 3 Observability
// Configurable thresholds and alerting for slow queries, errors, and timeouts

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PerformanceObserver } from "node:perf_hooks";
import { writeHeapSnapshot } from "node:v8";
import { type AlertConfig, defaultAlertConfig } from "../../config/alerts.js";
import { queryPerformanceMonitor } from "../db/query-performance.js";
import { appStorageService } from "../storage/app-service.js";
import { errorAggregator } from "./error-aggregator.js";
import { httpMetricsTracker } from "./http-metrics.js";
import { logger } from "./logger.js";

interface Alert {
  id: string;
  type:
    | "slow_query"
    | "error_rate"
    | "http_error_rate"
    | "circuit_breaker"
    | "memory"
    | "db_connection"
    | "gc_pause";
  severity: "warning" | "critical";
  message: string;
  timestamp: string;
  details: Record<string, any>;
}

// PHASE 2: GC Metrics tracking
interface GCMetrics {
  totalPauses: number;
  totalPauseTime: number;
  averagePauseTime: number;
  maxPauseTime: number;
  lastPauseTime: number;
  recentPauses: Array<{ timestamp: number; duration: number; kind: string }>;
}

class AlertManager {
  private thresholds: AlertConfig;
  private recentAlerts: Alert[] = [];
  private readonly maxAlerts = 100; // Keep last 100 alerts
  private alertCooldown: Map<string, number> = new Map(); // type -> last alert timestamp
  private readonly cooldownMs = 5 * 60 * 1000; // 5 minutes cooldown between same alert types
  private lastHeapSnapshotTime = 0; // Track last heap snapshot to prevent spam
  private readonly heapSnapshotCooldownMs = 60 * 60 * 1000; // 1 hour cooldown for heap snapshots
  private readonly heapSnapshotDir = "/tmp/heap-snapshots";

  // PHASE 2: GC pause time tracking
  private gcMetrics: GCMetrics = {
    totalPauses: 0,
    totalPauseTime: 0,
    averagePauseTime: 0,
    maxPauseTime: 0,
    lastPauseTime: 0,
    recentPauses: [],
  };
  private gcObserver: PerformanceObserver | null = null;

  constructor() {
    // Load thresholds from configuration
    this.thresholds = { ...defaultAlertConfig };

    // PHASE 2: Initialize GC monitoring if enabled
    if (this.thresholds.gcPause.enabled && typeof global.gc !== "undefined") {
      this.initializeGCMonitoring();
    } else if (this.thresholds.gcPause.enabled) {
      logger.warn(
        "[AlertManager] GC monitoring enabled but --expose-gc flag not set. GC pause tracking unavailable.",
      );
    }

    // Ensure heap snapshot directory exists
    try {
      if (!existsSync(this.heapSnapshotDir)) {
        mkdirSync(this.heapSnapshotDir, { recursive: true });
        logger.info(`[AlertManager] Created heap snapshot directory: ${this.heapSnapshotDir}`);
      }
    } catch (error) {
      logger.error("[AlertManager] Failed to create heap snapshot directory:", error);
    }

    logger.info("[AlertManager] Initialized with thresholds:", this.thresholds);
  }

  /**
   * Check all metrics and trigger alerts if thresholds exceeded
   */
  checkMetrics(): Alert[] {
    const newAlerts: Alert[] = [];

    // Check slow query threshold
    const slowQueryAlert = this.checkSlowQueries();
    if (slowQueryAlert) {
      newAlerts.push(slowQueryAlert);
    }

    // Check error rate threshold
    const errorRateAlert = this.checkErrorRate();
    if (errorRateAlert) {
      newAlerts.push(errorRateAlert);
    }

    // Check HTTP error rate threshold
    const httpErrorAlert = this.checkHttpErrorRate();
    if (httpErrorAlert) {
      newAlerts.push(httpErrorAlert);
    }

    // Check circuit breaker status
    const circuitAlert = this.checkCircuitBreaker();
    if (circuitAlert) {
      newAlerts.push(circuitAlert);
    }

    // CHUNK 8: Memory and DB connection monitoring
    const memoryAlert = this.checkMemoryUsage();
    if (memoryAlert) {
      newAlerts.push(memoryAlert);
    }

    const dbConnectionAlert = this.checkDbConnection();
    if (dbConnectionAlert) {
      newAlerts.push(dbConnectionAlert);
    }

    // Record new alerts
    for (const alert of newAlerts) {
      this.recordAlert(alert);
    }

    return newAlerts;
  }

  /**
   * Check for slow query violations
   */
  private checkSlowQueries(): Alert | null {
    if (!this.canAlert("slow_query")) {
      return null;
    }

    const stats = queryPerformanceMonitor.getPerformanceStats();

    // Calculate slow query rate from stats
    const slowQueryRate =
      stats.totalQueries > 0 ? (stats.slowQueries / stats.totalQueries) * 100 : 0;

    // Alert if slow query rate is high or average response time exceeds threshold
    if (
      slowQueryRate > 50 ||
      stats.averageResponseTime > this.thresholds.slowQuery.durationMs * 2
    ) {
      return {
        id: `alert_${Date.now()}_slow_query`,
        type: "slow_query",
        severity: "warning",
        message: `Slow query threshold exceeded: ${slowQueryRate.toFixed(1)}% slow queries`,
        timestamp: new Date().toISOString(),
        details: {
          slowQueryRate: slowQueryRate.toFixed(1),
          slowQueries: stats.slowQueries,
          totalQueries: stats.totalQueries,
          averageResponseTime: stats.averageResponseTime,
          threshold: this.thresholds.slowQuery.durationMs,
        },
      };
    }

    return null;
  }

  /**
   * Check for error rate violations
   */
  private checkErrorRate(): Alert | null {
    if (!this.canAlert("error_rate")) {
      return null;
    }

    const errorMetrics = errorAggregator.getMetrics();
    const timeWindowKey =
      this.thresholds.errorRate.timeWindowMinutes === 5
        ? "last5Min"
        : this.thresholds.errorRate.timeWindowMinutes === 15
          ? "last15Min"
          : "last1Hour";

    const errorCount = errorMetrics.errorRate[timeWindowKey];
    const totalErrors = errorMetrics.totalErrors;

    // Calculate error rate percentage (approximate based on recent errors)
    if (totalErrors > 10) {
      // Only alert if we have meaningful sample size
      const errorRate = (errorCount / totalErrors) * 100;

      if (errorRate > this.thresholds.errorRate.percentageThreshold) {
        return {
          id: `alert_${Date.now()}_error_rate`,
          type: "error_rate",
          severity: "critical",
          message: `Error rate exceeded: ${errorRate.toFixed(1)}% in last ${this.thresholds.errorRate.timeWindowMinutes} minutes`,
          timestamp: new Date().toISOString(),
          details: {
            errorRate: errorRate.toFixed(1),
            threshold: this.thresholds.errorRate.percentageThreshold,
            errorCount,
            totalErrors,
            timeWindowMinutes: this.thresholds.errorRate.timeWindowMinutes,
            errorsByType: errorMetrics.errorsByType,
            errorsBySeverity: errorMetrics.errorsBySeverity,
          },
        };
      }
    }

    return null;
  }

  /**
   * Check for HTTP 5xx error rate violations
   */
  private checkHttpErrorRate(): Alert | null {
    if (!this.canAlert("http_error_rate")) {
      return null;
    }

    const stats = httpMetricsTracker.getStats();
    const categories = httpMetricsTracker.getStatusCodeCategories();

    if (stats.totalRequests > 100) {
      // Only alert with meaningful sample
      const errorRate = ((categories["5xx"] || 0) / stats.totalRequests) * 100;

      if (errorRate > this.thresholds.httpErrorRate.percentageThreshold) {
        return {
          id: `alert_${Date.now()}_http_error_rate`,
          type: "http_error_rate",
          severity: "critical",
          message: `HTTP 5xx error rate exceeded: ${errorRate.toFixed(1)}%`,
          timestamp: new Date().toISOString(),
          details: {
            errorRate: errorRate.toFixed(1),
            threshold: this.thresholds.httpErrorRate.percentageThreshold,
            total5xxErrors: categories["5xx"],
            totalRequests: stats.totalRequests,
            statusCategories: categories,
          },
        };
      }
    }

    return null;
  }

  /**
   * Check circuit breaker status
   */
  private checkCircuitBreaker(): Alert | null {
    const status = appStorageService.getCircuitStatus();

    if (status.state === "OPEN" && this.thresholds.circuitBreaker.alertOnOpen) {
      if (!this.canAlert("circuit_breaker")) {
        return null;
      }

      return {
        id: `alert_${Date.now()}_circuit_breaker`,
        type: "circuit_breaker",
        severity: "critical",
        message: `Circuit breaker OPEN: Object Storage is unavailable`,
        timestamp: new Date().toISOString(),
        details: {
          state: status.state,
          failureCount: status.failureCount,
          totalFailures: status.totalFailures,
          stateChanges: status.stateChanges,
          lastStateChange: status.lastStateChange,
        },
      };
    }

    if (status.state === "HALF_OPEN" && this.thresholds.circuitBreaker.alertOnHalfOpen) {
      if (!this.canAlert("circuit_breaker")) {
        return null;
      }

      const successRate =
        status.successCount + status.failureCount > 0
          ? (status.successCount / (status.successCount + status.failureCount)) * 100
          : 0;

      return {
        id: `alert_${Date.now()}_circuit_breaker`,
        type: "circuit_breaker",
        severity: "warning",
        message: `Circuit breaker HALF_OPEN: Object Storage is recovering`,
        timestamp: new Date().toISOString(),
        details: {
          state: status.state,
          successCount: status.successCount,
          failureCount: status.failureCount,
          successRate: successRate.toFixed(1),
          totalSuccesses: status.totalSuccesses,
        },
      };
    }

    return null;
  }

  /**
   * Write heap snapshot to disk for memory leak analysis
   * Rate-limited to max 1 snapshot per hour
   */
  private writeMemorySnapshot(usagePercent: number): string | null {
    const now = Date.now();

    // Check cooldown period (1 hour)
    if (now - this.lastHeapSnapshotTime < this.heapSnapshotCooldownMs) {
      const minutesRemaining = Math.ceil(
        (this.heapSnapshotCooldownMs - (now - this.lastHeapSnapshotTime)) / 60000,
      );
      logger.info(
        `[AlertManager] Heap snapshot skipped - cooldown active (${minutesRemaining} minutes remaining)`,
      );
      return null;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `heap-${usagePercent.toFixed(1)}pct-${timestamp}.heapsnapshot`;
      const filepath = join(this.heapSnapshotDir, filename);

      logger.info(`[AlertManager] 📸 Writing heap snapshot: ${filename}`);
      const snapshotPath = writeHeapSnapshot(filepath);

      this.lastHeapSnapshotTime = now;
      logger.info(`[AlertManager] ✅ Heap snapshot saved: ${snapshotPath}`);

      return snapshotPath;
    } catch (error) {
      logger.error("[AlertManager] ❌ Failed to write heap snapshot:", error);
      return null;
    }
  }

  /**
   * CHUNK 8: Check for memory usage >80%
   * Phase 1 Task 4: Added heap snapshot trigger when memory alert fires
   */
  private checkMemoryUsage(): Alert | null {
    if (!this.canAlert("memory")) {
      return null;
    }

    try {
      const used = process.memoryUsage();
      const totalHeap = used.heapTotal;
      const usedHeap = used.heapUsed;
      const usagePercent = (usedHeap / totalHeap) * 100;

      if (usagePercent > this.thresholds.memory.percentageThreshold) {
        // Trigger heap snapshot for memory leak analysis
        const snapshotPath = this.writeMemorySnapshot(usagePercent);

        return {
          id: `alert_${Date.now()}_memory`,
          type: "memory",
          severity: usagePercent > 90 ? "critical" : "warning",
          message: `Memory usage exceeded: ${usagePercent.toFixed(1)}% (${(usedHeap / 1024 / 1024).toFixed(2)}MB used)`,
          timestamp: new Date().toISOString(),
          details: {
            usagePercent: usagePercent.toFixed(1),
            threshold: this.thresholds.memory.percentageThreshold,
            heapUsedMB: (usedHeap / 1024 / 1024).toFixed(2),
            heapTotalMB: (totalHeap / 1024 / 1024).toFixed(2),
            rss: (used.rss / 1024 / 1024).toFixed(2),
            external: (used.external / 1024 / 1024).toFixed(2),
            heapSnapshotPath: snapshotPath || "skipped (cooldown active)",
          },
        };
      }
    } catch (error) {
      logger.error("[AlertManager] Error checking memory usage:", error);
    }

    return null;
  }

  /**
   * CHUNK 8: Check for database connection errors
   * Monitors database metrics for connection failures and timeouts
   */
  private checkDbConnection(): Alert | null {
    if (!this.canAlert("db_connection")) {
      return null;
    }

    try {
      // Import database metrics if available
      const { dbMetricsTracker } = require("./database-metrics-tracker.js");
      const metrics = dbMetricsTracker?.getMetrics();

      if (!metrics) {
        return null;
      }

      // Check for connection errors
      if (this.thresholds.dbConnection.alertOnError && metrics.connectionErrors > 0) {
        return {
          id: `alert_${Date.now()}_db_connection`,
          type: "db_connection",
          severity: "critical",
          message: `Database connection errors detected: ${metrics.connectionErrors} failures`,
          timestamp: new Date().toISOString(),
          details: {
            connectionErrors: metrics.connectionErrors,
            totalQueries: metrics.totalQueries,
            avgResponseTime: metrics.avgResponseTime,
            lastError: metrics.lastError,
          },
        };
      }

      // Check for timeouts
      if (this.thresholds.dbConnection.alertOnTimeout && metrics.timeouts > 0) {
        const timeoutRate = (metrics.timeouts / metrics.totalQueries) * 100;

        if (timeoutRate > 5) {
          // Alert if >5% timeout rate
          return {
            id: `alert_${Date.now()}_db_connection`,
            type: "db_connection",
            severity: "warning",
            message: `Database timeout rate high: ${timeoutRate.toFixed(1)}% (${metrics.timeouts} timeouts)`,
            timestamp: new Date().toISOString(),
            details: {
              timeouts: metrics.timeouts,
              totalQueries: metrics.totalQueries,
              timeoutRate: timeoutRate.toFixed(1),
              avgResponseTime: metrics.avgResponseTime,
            },
          };
        }
      }
    } catch (_error) {
      // Silently ignore if database metrics tracker doesn't exist
      // This is expected in development or if DB monitoring isn't set up
    }

    return null;
  }

  /**
   * Check if we can alert (cooldown check)
   * FIXED: Now cleans up expired cooldown entries to prevent memory leak
   */
  private canAlert(type: string): boolean {
    const lastAlert = this.alertCooldown.get(type);
    if (!lastAlert) {
      return true;
    }

    const now = Date.now();
    if (now - lastAlert >= this.cooldownMs) {
      // MEMORY LEAK FIX: Delete expired cooldown entry
      this.alertCooldown.delete(type);
      return true;
    }

    return false;
  }

  /**
   * Record an alert
   */
  private recordAlert(alert: Alert): void {
    // Add to history
    this.recentAlerts.push(alert);
    if (this.recentAlerts.length > this.maxAlerts) {
      this.recentAlerts.shift();
    }

    // Update cooldown
    this.alertCooldown.set(alert.type, Date.now());

    // Log alert
    if (alert.severity === "critical") {
      logger.error(`🚨 [ALERT] ${alert.message}`, alert.details);
    } else {
      logger.warn(`⚠️ [ALERT] ${alert.message}`, alert.details);
    }
  }

  /**
   * Get current thresholds configuration
   */
  getThresholds(): AlertConfig {
    return { ...this.thresholds };
  }

  /**
   * Update thresholds (runtime configuration) with deep merge to preserve unspecified fields
   * @param updates - Validated partial threshold updates (should be validated before calling)
   */
  updateThresholds(updates: Partial<AlertConfig>): void {
    // Guard against null/undefined category objects
    if (updates.slowQuery && typeof updates.slowQuery === "object") {
      this.thresholds.slowQuery = {
        ...this.thresholds.slowQuery,
        ...updates.slowQuery,
      };
    }

    if (updates.errorRate && typeof updates.errorRate === "object") {
      this.thresholds.errorRate = {
        ...this.thresholds.errorRate,
        ...updates.errorRate,
      };
    }

    if (updates.httpErrorRate && typeof updates.httpErrorRate === "object") {
      this.thresholds.httpErrorRate = {
        ...this.thresholds.httpErrorRate,
        ...updates.httpErrorRate,
      };
    }

    if (updates.circuitBreaker && typeof updates.circuitBreaker === "object") {
      this.thresholds.circuitBreaker = {
        ...this.thresholds.circuitBreaker,
        ...updates.circuitBreaker,
      };
    }

    logger.info("[AlertManager] Thresholds updated:", this.thresholds);
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit?: number): Alert[] {
    const alerts = [...this.recentAlerts].reverse();
    return limit ? alerts.slice(0, limit) : alerts;
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: Alert["type"]): Alert[] {
    return this.recentAlerts.filter((a) => a.type === type).reverse();
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.recentAlerts = [];
    this.alertCooldown.clear();
    logger.info("[AlertManager] All alerts cleared");
  }

  /**
   * PHASE 2: Initialize GC monitoring using PerformanceObserver
   */
  private initializeGCMonitoring(): void {
    try {
      this.gcObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries) {
          if (entry.entryType === "gc") {
            const gcEntry = entry as any; // GC performance entry type
            const duration = gcEntry.duration;
            const kind = gcEntry.kind || "unknown";

            // Track GC metrics
            this.gcMetrics.totalPauses++;
            this.gcMetrics.totalPauseTime += duration;
            this.gcMetrics.averagePauseTime =
              this.gcMetrics.totalPauseTime / this.gcMetrics.totalPauses;
            this.gcMetrics.maxPauseTime = Math.max(this.gcMetrics.maxPauseTime, duration);
            this.gcMetrics.lastPauseTime = duration;

            // Keep recent pauses (last 100)
            this.gcMetrics.recentPauses.push({
              timestamp: Date.now(),
              duration,
              kind: String(kind),
            });

            if (this.gcMetrics.recentPauses.length > 100) {
              this.gcMetrics.recentPauses.shift();
            }

            // Alert if pause exceeds threshold
            if (duration > this.thresholds.gcPause.thresholdMs) {
              logger.warn(
                `[AlertManager] 🐌 GC PAUSE: ${duration.toFixed(2)}ms (threshold: ${this.thresholds.gcPause.thresholdMs}ms, kind: ${kind})`,
              );

              // Create alert for long GC pause
              const alert: Alert = {
                id: `alert_${Date.now()}_gc_pause`,
                type: "gc_pause",
                severity:
                  duration > this.thresholds.gcPause.thresholdMs * 2 ? "critical" : "warning",
                message: `GC pause exceeded ${this.thresholds.gcPause.thresholdMs}ms threshold`,
                timestamp: new Date().toISOString(),
                details: {
                  pauseDuration: duration.toFixed(2),
                  threshold: this.thresholds.gcPause.thresholdMs,
                  kind,
                  averagePauseTime: this.gcMetrics.averagePauseTime.toFixed(2),
                  maxPauseTime: this.gcMetrics.maxPauseTime.toFixed(2),
                  totalPauses: this.gcMetrics.totalPauses,
                },
              };

              this.recordAlert(alert);
            }
          }
        }
      });

      this.gcObserver.observe({ entryTypes: ["gc"] });
      logger.info(
        `[AlertManager] ✅ GC monitoring initialized (threshold: ${this.thresholds.gcPause.thresholdMs}ms)`,
      );
    } catch (error) {
      logger.error("[AlertManager] Failed to initialize GC monitoring:", error);
    }
  }

  /**
   * PHASE 2: Get current GC metrics
   */
  getGCMetrics(): GCMetrics {
    return { ...this.gcMetrics };
  }

  /**
   * PHASE 2: Cleanup GC observer on shutdown
   */
  destroy(): void {
    if (this.gcObserver) {
      this.gcObserver.disconnect();
      logger.info("[AlertManager] GC observer disconnected");
    }
  }
}

// Singleton instance
export const alertManager = new AlertManager();
