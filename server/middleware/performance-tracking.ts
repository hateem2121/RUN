/**
 * PERFORMANCE TRACKING MIDDLEWARE
 * Captures detailed performance metrics for all HTTP requests
 * - TTFB (Time to First Byte)
 * - Total request duration
 * - Database query timing
 * - Cache hit/miss tracking
 */

import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/monitoring/logger.js";

// Performance metrics storage (in-memory, last 1000 requests)
const MAX_METRICS = 1000;
const recentMetrics: PerformanceMetric[] = [];

export interface PerformanceMetric {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  ttfb?: number | undefined;
  dbTime?: number | undefined;
  cacheHit?: boolean | undefined;
  userAgent?: string | undefined;
}

export interface PerformanceStats {
  totalRequests: number;
  avgDuration: number;
  avgTTFB: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  slowestRequests: PerformanceMetric[];
  cacheHitRate: number;
}

/**
 * Performance tracking middleware
 * Attaches timing information to request object
 */
export function performanceTrackingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const startHrTime = process.hrtime.bigint();

  // Skip for static assets to avoid stream interference
  if (/\.(jpg|jpeg|png|webp|gif|mp4|webm|glb|gltf|woff|woff2|ttf|eot|otf|ico)$/i.test(req.path)) {
    return next();
  }

  // Track TTFB (time to first byte sent)
  let ttfb: number | undefined;
  const originalWrite = res.write;
  const originalEnd = res.end;

  // Intercept first write to track TTFB
  res.write = function (this: Response) {
    ttfb ??= Date.now() - startTime;
    // eslint-disable-next-line prefer-rest-params, prefer-spread
    return originalWrite.apply(this, arguments as any);
  } as any as typeof res.write;

  // Track total duration on response end
  res.end = function (this: Response) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const endHrTime = process.hrtime.bigint();
    const precisionDuration = Number(endHrTime - startHrTime) / 1_000_000; // Convert to ms

    // If write was never called (cached response, redirect, etc.)
    ttfb ??= duration;

    // Store metric
    const metric: PerformanceMetric = {
      timestamp: endTime,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: precisionDuration,
      ttfb,
      dbTime: (req as any).dbTime,
      cacheHit: (req as any).cacheHit,
      userAgent: req.get("user-agent"),
    };

    addMetric(metric);

    // Log slow requests (>1s)
    if (duration > 1000) {
      logger.warn("[Performance] Slow request detected", {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        ttfb: `${ttfb}ms`,
        statusCode: res.statusCode,
      });
    }

    // Log very slow requests (>5s) as errors
    if (duration > 5000) {
      logger.error("[Performance] Very slow request", {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        ttfb: `${ttfb}ms`,
        statusCode: res.statusCode,
        userAgent: req.get("user-agent"),
      });
    }

    // eslint-disable-next-line prefer-rest-params, prefer-spread
    return originalEnd.apply(this, arguments as any);
  } as any as typeof res.end;

  next();
}

/**
 * Add a metric to the recent metrics buffer
 */
function addMetric(metric: PerformanceMetric): void {
  recentMetrics.push(metric);

  // Keep only the most recent metrics
  if (recentMetrics.length > MAX_METRICS) {
    recentMetrics.shift();
  }
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(path?: string, minutesAgo?: number): PerformanceStats {
  // Filter metrics by path and time window if specified
  let filtered = recentMetrics;

  if (path) {
    filtered = filtered.filter((m) => m.path === path || m.path.startsWith(path));
  }

  if (minutesAgo) {
    const cutoff = Date.now() - minutesAgo * 60 * 1000;
    filtered = filtered.filter((m) => m.timestamp > cutoff);
  }

  if (filtered.length === 0) {
    return {
      totalRequests: 0,
      avgDuration: 0,
      avgTTFB: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
      slowestRequests: [],
      cacheHitRate: 0,
    };
  }

  // Calculate statistics
  const durations = filtered.map((m) => m.duration).sort((a, b) => a - b);
  const ttfbs = filtered.filter((m) => m.ttfb !== undefined).map((m) => m.ttfb!);

  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const avgTTFB = ttfbs.length > 0 ? ttfbs.reduce((sum, t) => sum + t, 0) / ttfbs.length : 0;

  const p50Index = Math.floor(durations.length * 0.5);
  const p95Index = Math.floor(durations.length * 0.95);
  const p99Index = Math.floor(durations.length * 0.99);

  const cacheMetrics = filtered.filter((m) => m.cacheHit !== undefined);
  const cacheHits = cacheMetrics.filter((m) => m.cacheHit === true).length;
  const cacheHitRate = cacheMetrics.length > 0 ? (cacheHits / cacheMetrics.length) * 100 : 0;

  // Get slowest requests
  const slowest = [...filtered].sort((a, b) => b.duration - a.duration).slice(0, 10);

  return {
    totalRequests: filtered.length,
    avgDuration: Math.round(avgDuration * 100) / 100,
    avgTTFB: Math.round(avgTTFB * 100) / 100,
    p50Duration: Math.round((durations[p50Index] ?? 0) * 100) / 100,
    p95Duration: Math.round((durations[p95Index] ?? 0) * 100) / 100,
    p99Duration: Math.round((durations[p99Index] ?? 0) * 100) / 100,
    slowestRequests: slowest,
    cacheHitRate: Math.round(cacheHitRate * 100) / 100,
  };
}

/**
 * Clear all stored metrics (for testing)
 */
export function clearMetrics(): void {
  recentMetrics.length = 0;
}

/**
 * Get raw metrics (for debugging)
 */
export function getRawMetrics(): PerformanceMetric[] {
  return [...recentMetrics];
}
