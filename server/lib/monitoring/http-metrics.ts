// HTTP Request/Response Metrics Tracker
// Tracks latency, status codes, routes, and request counts

import type { NextFunction, Request, Response } from "express";
import { logger } from "./logger.js";

interface HttpMetric {
  method: string;
  route: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  userAgent?: string | undefined;
  contentLength?: number | undefined;
}

interface RouteMetrics {
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  statusCodes: Record<number, number>;
  lastRequest: number;
}

interface HttpMetricsStats {
  totalRequests: number;
  averageLatency: number;
  statusCodeDistribution: Record<number, number>;
  topSlowRoutes: Array<{ route: string; avgDuration: number; count: number }>;
  topActiveRoutes: Array<{ route: string; count: number; avgDuration: number }>;
  recentRequests: HttpMetric[];
  timeWindow: string;
}

export class HttpMetricsTracker {
  private static instance: HttpMetricsTracker;
  private metrics: HttpMetric[] = [];
  private routeMetrics: Map<string, RouteMetrics> = new Map();

  private readonly MAX_METRICS_BUFFER = 2000; // Keep last 2000 requests
  private readonly METRICS_TTL = 60 * 60 * 1000; // 1 hour
  private readonly SLOW_REQUEST_THRESHOLD = 500; // 500ms

  private constructor() {
    this.initializeCleanupInterval();
  }

  public static getInstance(): HttpMetricsTracker {
    if (!HttpMetricsTracker.instance) {
      HttpMetricsTracker.instance = new HttpMetricsTracker();
    }
    return HttpMetricsTracker.instance;
  }

  /**
   * Express middleware to track HTTP requests
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      const route = this.normalizeRoute(req.path);

      // Capture response finish event
      res.on("finish", () => {
        const duration = Math.round((performance.now() - startTime) * 100) / 100;
        const statusCode = res.statusCode;

        // Record metric
        const metric: HttpMetric = {
          method: req.method,
          route,
          statusCode,
          duration,
          timestamp: Date.now(),
          userAgent: req.headers["user-agent"],
          contentLength: parseInt(res.getHeader("content-length") as string, 10) || undefined,
        };

        this.recordMetric(metric);

        // Log slow requests
        if (duration > this.SLOW_REQUEST_THRESHOLD) {
          logger.warn(`[SLOW REQUEST] ${req.method} ${req.path} took ${duration}ms`);
        }
      });

      next();
    };
  }

  /**
   * Normalize route patterns (convert IDs to placeholders)
   * /api/products/123 -> /api/products/:id
   */
  private normalizeRoute(path: string): string {
    return path
      .replace(/\/\d+/g, "/:id") // Replace numeric IDs
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:uuid") // Replace UUIDs
      .replace(/\?.*$/, ""); // Remove query strings
  }

  /**
   * Record an HTTP metric
   */
  private recordMetric(metric: HttpMetric): void {
    // Add to metrics buffer
    this.metrics.push(metric);

    // Trim buffer if needed
    if (this.metrics.length > this.MAX_METRICS_BUFFER) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_BUFFER);
    }

    // Update route-specific metrics
    const routeKey = `${metric.method} ${metric.route}`;
    const existing = this.routeMetrics.get(routeKey);

    if (existing) {
      existing.count++;
      existing.totalDuration += metric.duration;
      existing.avgDuration = Math.round((existing.totalDuration / existing.count) * 100) / 100;
      existing.minDuration = Math.min(existing.minDuration, metric.duration);
      existing.maxDuration = Math.max(existing.maxDuration, metric.duration);
      existing.statusCodes[metric.statusCode] = (existing.statusCodes[metric.statusCode] || 0) + 1;
      existing.lastRequest = metric.timestamp;
    } else {
      this.routeMetrics.set(routeKey, {
        count: 1,
        totalDuration: metric.duration,
        avgDuration: metric.duration,
        minDuration: metric.duration,
        maxDuration: metric.duration,
        statusCodes: { [metric.statusCode]: 1 },
        lastRequest: metric.timestamp,
      });
    }
  }

  /**
   * Get recent metrics (last hour by default)
   */
  private getRecentMetrics(): HttpMetric[] {
    const cutoff = Date.now() - this.METRICS_TTL;
    return this.metrics.filter((m) => m.timestamp > cutoff);
  }

  /**
   * Get comprehensive HTTP metrics statistics
   */
  getStats(): HttpMetricsStats {
    const recentMetrics = this.getRecentMetrics();
    const totalRequests = recentMetrics.length;

    // Calculate average latency
    const averageLatency =
      totalRequests > 0
        ? Math.round(
            (recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests) * 100,
          ) / 100
        : 0;

    // Status code distribution
    const statusCodeDistribution: Record<number, number> = {};
    recentMetrics.forEach((m) => {
      statusCodeDistribution[m.statusCode] = (statusCodeDistribution[m.statusCode] || 0) + 1;
    });

    // Top slow routes (by average duration)
    const topSlowRoutes = Array.from(this.routeMetrics.entries())
      .map(([route, metrics]) => ({
        route,
        avgDuration: metrics.avgDuration,
        count: metrics.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    // Top active routes (by request count)
    const topActiveRoutes = Array.from(this.routeMetrics.entries())
      .map(([route, metrics]) => ({
        route,
        count: metrics.count,
        avgDuration: metrics.avgDuration,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      averageLatency,
      statusCodeDistribution,
      topSlowRoutes,
      topActiveRoutes,
      recentRequests: recentMetrics.slice(-20), // Last 20 requests
      timeWindow: "1 hour",
    };
  }

  /**
   * Get metrics for a specific route
   */
  getRouteMetrics(method: string, route: string): RouteMetrics | null {
    const routeKey = `${method} ${this.normalizeRoute(route)}`;
    return this.routeMetrics.get(routeKey) || null;
  }

  /**
   * Get all route metrics
   */
  getAllRouteMetrics(): Map<string, RouteMetrics> {
    return new Map(this.routeMetrics);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
    this.routeMetrics.clear();
    logger.info("[HttpMetrics] All HTTP metrics reset");
  }

  /**
   * Initialize cleanup interval to prevent memory leaks
   */
  private initializeCleanupInterval(): void {
    setInterval(
      () => {
        const cutoff = Date.now() - this.METRICS_TTL;
        const beforeCount = this.metrics.length;

        // Clean old metrics
        this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);

        // Clean stale route metrics (not accessed in 24h)
        const staleThreshold = Date.now() - 24 * 60 * 60 * 1000;
        for (const [route, metrics] of this.routeMetrics.entries()) {
          if (metrics.lastRequest < staleThreshold) {
            this.routeMetrics.delete(route);
          }
        }

        if (beforeCount !== this.metrics.length) {
          logger.debug(`[HttpMetrics] Cleaned ${beforeCount - this.metrics.length} old metrics`);
        }
      },
      15 * 60 * 1000,
    ); // Clean every 15 minutes
  }

  /**
   * Get status code category statistics (2xx, 3xx, 4xx, 5xx)
   */
  getStatusCodeCategories(): Record<string, number> {
    const recentMetrics = this.getRecentMetrics();
    const categories: Record<string, number> = {
      "2xx": 0,
      "3xx": 0,
      "4xx": 0,
      "5xx": 0,
      other: 0,
    };

    recentMetrics.forEach((m) => {
      const code = m.statusCode;
      if (code >= 200 && code < 300) categories["2xx"] = (categories["2xx"] || 0) + 1;
      else if (code >= 300 && code < 400) categories["3xx"] = (categories["3xx"] || 0) + 1;
      else if (code >= 400 && code < 500) categories["4xx"] = (categories["4xx"] || 0) + 1;
      else if (code >= 500 && code < 600) categories["5xx"] = (categories["5xx"] || 0) + 1;
      else categories.other = (categories.other || 0) + 1;
    });

    return categories;
  }

  /**
   * Get health status based on error rates
   */
  isHealthy(): boolean {
    const recentMetrics = this.getRecentMetrics();
    if (recentMetrics.length < 10) return true; // Not enough data

    const errorRequests = recentMetrics.filter((m) => m.statusCode >= 500).length;
    const errorRate = (errorRequests / recentMetrics.length) * 100;

    // Healthy if <5% error rate
    return errorRate < 5;
  }
}

// Export singleton instance
export const httpMetricsTracker = HttpMetricsTracker.getInstance();
