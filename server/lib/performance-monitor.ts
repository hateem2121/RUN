/**
 * CENTRALIZED PERFORMANCE MONITOR
 * Aggregates performance data from various sources:
 * - HTTP request metrics
 * - Database query performance
 * - Cache hit rates
 * - GCS request timing
 */

import { logger } from './smart-logger.js';
import { getPerformanceStats } from '../middleware/performance-tracking.js';
import { UnifiedCache } from './unified-cache.js';

export interface SystemPerformance {
  http: {
    requests: number;
    avgDuration: number;
    avgTTFB: number;
    p95Duration: number;
    p99Duration: number;
    slowRequests: number; // > 1s
    verySlowRequests: number; // > 5s
  };
  cache: {
    hitRate: number;
    size: number;
    operations: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: {
    http: boolean;
    cache: boolean;
    memory: boolean;
  };
  issues: string[];
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private cache = UnifiedCache.getInstance();
  
  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Get system-wide performance metrics
   */
  public async getSystemPerformance(): Promise<SystemPerformance> {
    const httpStats = getPerformanceStats(undefined, 5); // Last 5 minutes
    const cacheStats = await this.cache.getStats();
    const memUsage = process.memoryUsage();

    return {
      http: {
        requests: httpStats.totalRequests,
        avgDuration: httpStats.avgDuration,
        avgTTFB: httpStats.avgTTFB,
        p95Duration: httpStats.p95Duration,
        p99Duration: httpStats.p99Duration,
        slowRequests: httpStats.slowestRequests.filter((r) => r.duration > 1000 && r.duration <= 5000).length,
        verySlowRequests: httpStats.slowestRequests.filter((r) => r.duration > 5000).length,
      },
      cache: {
        hitRate: httpStats.cacheHitRate,
        size: cacheStats.size || 0,
        operations: cacheStats.hits + cacheStats.misses,
      },
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      uptime: Math.round(process.uptime()),
    };
  }

  /**
   * Get health status with threshold-based checks
   */
  public async getHealthStatus(): Promise<HealthStatus> {
    const perf = await this.getSystemPerformance();
    const issues: string[] = [];
    const checks = {
      http: true,
      cache: true,
      memory: true,
    };

    // HTTP health checks
    if (perf.http.p95Duration > 1000) {
      checks.http = false;
      issues.push(`High p95 latency: ${perf.http.p95Duration}ms (threshold: 1000ms)`);
    }

    if (perf.http.verySlowRequests > 0) {
      checks.http = false;
      issues.push(`${perf.http.verySlowRequests} very slow requests (>5s) detected`);
    }

    // Cache health checks
    if (perf.cache.hitRate < 50 && perf.cache.operations > 100) {
      checks.cache = false;
      issues.push(`Low cache hit rate: ${perf.cache.hitRate}% (threshold: 50%)`);
    }

    // Memory health checks
    if (perf.memory.percentage > 90) {
      checks.memory = false;
      issues.push(`High memory usage: ${perf.memory.percentage}% (threshold: 90%)`);
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    const failedChecks = Object.values(checks).filter((c) => !c).length;

    if (failedChecks === 0) {
      status = 'healthy';
    } else if (failedChecks === 1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp: Date.now(),
      checks,
      issues,
    };
  }

  /**
   * Get performance metrics for a specific endpoint
   */
  public async getEndpointMetrics(path: string, minutesAgo: number = 5) {
    const stats = getPerformanceStats(path, minutesAgo);
    
    return {
      path,
      timeWindow: `${minutesAgo} minutes`,
      requests: stats.totalRequests,
      avgDuration: stats.avgDuration,
      avgTTFB: stats.avgTTFB,
      p50: stats.p50Duration,
      p95: stats.p95Duration,
      p99: stats.p99Duration,
      cacheHitRate: stats.cacheHitRate,
      slowestRequests: stats.slowestRequests.slice(0, 5).map((r) => ({
        timestamp: new Date(r.timestamp).toISOString(),
        duration: r.duration,
        ttfb: r.ttfb,
        statusCode: r.statusCode,
      })),
    };
  }

  /**
   * Log performance summary (for debugging)
   */
  public async logPerformanceSummary(): Promise<void> {
    const perf = await this.getSystemPerformance();
    const health = await this.getHealthStatus();

    logger.info('[PerformanceMonitor] System Performance Summary', {
      status: health.status,
      http: {
        requests: perf.http.requests,
        avgDuration: `${perf.http.avgDuration}ms`,
        p95: `${perf.http.p95Duration}ms`,
        slowRequests: perf.http.slowRequests,
      },
      cache: {
        hitRate: `${perf.cache.hitRate}%`,
        operations: perf.cache.operations,
      },
      memory: {
        usage: `${perf.memory.used}MB / ${perf.memory.total}MB (${perf.memory.percentage}%)`,
      },
      uptime: `${Math.floor(perf.uptime / 60)}m ${perf.uptime % 60}s`,
      issues: health.issues,
    });
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
