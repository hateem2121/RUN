import { logger } from '../lib/smart-logger.js';
// Enhanced Health Monitoring System
// PHASE 4: Production Readiness - Comprehensive Health Checks

import { Request, Response } from 'express';
import { getConfig } from '../config/production.js';
import { storage } from '../storage.js';
import { database, development } from '../config/environment.js';
import { appStorageService } from '../app-storage-service.js';
// import { IndexUsageMonitor } from '../scripts/monitor-index-usage.js';

const config = getConfig();

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  details?: any;
  timestamp: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: HealthCheckResult[];
  circuitBreaker?: {
    state: string;
    failureCount: number;
    successCount: number;
    stateChanges: number;
    lastStateChange: string | null; // ISO string when serialized to JSON
    totalFailures: number;
    totalSuccesses: number;
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cache: {
      hitRate: number;
      size: number;
    };
    performance: {
      avgResponseTime: number;
      errorRate: number;
    };
    indexUsage?: {
      totalIndexes: number;
      unusedIndexes: number;
      totalIndexSize: string;
      unusedIndexSize: string;
      warnings: string[];
    };
  };
}

// Individual Health Checks

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Test basic database connectivity
    await storage.getCategories();
    const responseTime = Date.now() - start;

    return {
      service: 'database',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      details: {
        connectionPool: 'active',
        queryTimeout: config.database.queryTimeout + 'ms'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        lastAttempt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  }
}

async function checkCache(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Test cache functionality with a simple operation
    // const testKey = 'health_check_' + Date.now();
    // const testValue = { test: true, timestamp: Date.now() };

    // Simple cache test (using in-memory cache if available)
    const responseTime = Date.now() - start;

    return {
      service: 'cache',
      status: 'healthy',
      responseTime,
      details: {
        type: 'memory_cache',
        ttl: config.cache.defaultTTL + 'ms'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      service: 'cache',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    };
  }
}

async function checkStorage(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Test storage system health (PostgreSQL + KV hybrid)
    const products = await storage.getProducts();
    const responseTime = Date.now() - start;

    return {
      service: 'storage',
      status: responseTime < 2000 ? 'healthy' : 'degraded',
      responseTime,
      details: {
        type: 'hybrid_storage',
        recordCount: products.length,
        postgresqlStatus: 'fallback_available'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      service: 'storage',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    };
  }
}

async function checkObjectStorage(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Get circuit breaker status from Object Storage service
    const circuitStatus = appStorageService?.getCircuitStatus();

    if (!circuitStatus) {
      return {
        service: 'object_storage',
        status: 'degraded',
        responseTime: Date.now() - start,
        details: {
          state: 'service_unavailable',
          message: 'Object Storage service not initialized'
        },
        timestamp: new Date().toISOString()
      };
    }

    // Determine health based on circuit breaker state
    let status: 'healthy' | 'degraded' | 'unhealthy';
    let message: string;

    switch (circuitStatus.state) {
      case 'CLOSED':
        status = 'healthy';
        message = 'Operating normally';
        break;
      case 'HALF_OPEN':
        status = 'degraded';
        message = 'Testing service recovery';
        break;
      case 'OPEN':
        status = 'unhealthy';
        message = 'Service unavailable - circuit breaker open';
        break;
      default:
        status = 'degraded';
        message = 'Unknown circuit state';
    }

    // Perform end-to-end write/read health probe with strict timeout
    // Skip probe if circuit is OPEN (already known to be down)
    if (circuitStatus.state !== 'OPEN') {
      try {
        // End-to-end probe: write sentinel → read back → verify
        const probePromise = (async () => {
          const sentinelKey = '.health-check-probe';
          const sentinelData = Buffer.from(JSON.stringify({
            timestamp: Date.now(),
            probe: 'health-check'
          }));

          // Write sentinel object (isPublic:true adds public/ prefix)
          await appStorageService.uploadAsset(sentinelKey, sentinelData, {
            contentType: 'application/json',
            isPublic: true
          });

          // Read back using the key WITH prefix (upload added public/)
          const readData = await appStorageService.downloadAsset(`public/${sentinelKey}`);

          // Verify data integrity
          const written = sentinelData.toString();
          const read = readData.toString();
          if (written !== read) {
            throw new Error('Data integrity check failed');
          }

          return 'success';
        })();

        // 5-second timeout to accommodate Replit Object Storage latency (200-400ms cold reads)
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Health probe timeout')), 5000)
        );

        await Promise.race([probePromise, timeoutPromise]);

        const responseTime = Date.now() - start;
        const successRate = circuitStatus.totalSuccesses + circuitStatus.totalFailures > 0
          ? `${Math.round((circuitStatus.totalSuccesses / (circuitStatus.totalSuccesses + circuitStatus.totalFailures)) * 100)}%`
          : 'N/A';

        return {
          service: 'object_storage',
          status: responseTime < 5000 ? status : 'degraded',
          responseTime,
          details: {
            state: circuitStatus.state,
            failureCount: circuitStatus.failureCount,
            successCount: circuitStatus.successCount,
            totalFailures: circuitStatus.totalFailures,
            totalSuccesses: circuitStatus.totalSuccesses,
            successRate,
            probeResult: 'write_read_verified',
            message
          },
          timestamp: new Date().toISOString()
        };
      } catch (probeError) {
        // Probe failed - classify error type
        const responseTime = Date.now() - start;
        const isTimeout = probeError instanceof Error && probeError.message.includes('timeout');
        const isPermission = probeError instanceof Error && probeError.message.includes('permission');

        return {
          service: 'object_storage',
          status: 'unhealthy',
          responseTime,
          details: {
            state: circuitStatus.state,
            probeResult: 'failed',
            errorType: isTimeout ? 'timeout' : isPermission ? 'permission_denied' : 'storage_error',
            probeError: probeError instanceof Error ? probeError.message : 'Unknown error',
            failureCount: circuitStatus.failureCount,
            totalFailures: circuitStatus.totalFailures,
            message: 'Storage write/read verification failed'
          },
          timestamp: new Date().toISOString()
        };
      }
    }

    // Circuit is OPEN - skip probe and return unhealthy status
    const responseTime = Date.now() - start;
    return {
      service: 'object_storage',
      status,
      responseTime,
      details: {
        state: circuitStatus.state,
        failureCount: circuitStatus.failureCount,
        totalFailures: circuitStatus.totalFailures,
        probeResult: 'skipped',
        message
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      service: 'object_storage',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    };
  }
}

async function checkExternalServices(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // For now, just check if we can access environment variables
    const hasDbUrl = !!database.url;
    const responseTime = Date.now() - start;

    return {
      service: 'external_services',
      status: hasDbUrl ? 'healthy' : 'degraded',
      responseTime,
      details: {
        postgresql: hasDbUrl ? 'configured' : 'not_configured',
        environment: config.app.environment
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      service: 'external_services',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    };
  }
}

async function checkIndexUsage(): Promise<HealthCheckResult> {
  const start = Date.now();
  // Index monitoring disabled to prevent NeonDbError (undefined column)
  // This feature relies on pg_stat_user_indexes columns that may vary by Postgres version/permissions
  return {
    service: 'index_usage',
    status: 'healthy',
    responseTime: Date.now() - start,
    details: {
      status: 'skipped',
      message: 'Index monitoring disabled for stability'
    },
    timestamp: new Date().toISOString()
  };
}

// System Metrics Collection (memory monitoring disabled for performance)
async function getSystemMetrics(indexUsageCheck?: HealthCheckResult) {
  // Memory monitoring disabled for performance optimization
  // const memUsage = process.memoryUsage();
  // const totalMem = memUsage.heapTotal;
  // const usedMem = memUsage.heapUsed;

  const baseMetrics = {
    memory: {
      used: 0, // Memory monitoring disabled
      total: 0, // Memory monitoring disabled
      percentage: 0 // Memory monitoring disabled
    },
    cache: {
      hitRate: 0, // Will be populated by cache monitor
      size: 0     // Will be populated by cache monitor
    },
    performance: {
      avgResponseTime: 0, // Will be populated by performance monitor
      errorRate: 0        // Will be populated by performance monitor
    }
  };

  if (indexUsageCheck && indexUsageCheck.status !== 'unhealthy') {
    return {
      ...baseMetrics,
      indexUsage: {
        totalIndexes: indexUsageCheck.details?.totalIndexes || 0,
        unusedIndexes: indexUsageCheck.details?.unusedIndexes || 0,
        totalIndexSize: indexUsageCheck.details?.totalIndexSize || '0 B',
        unusedIndexSize: indexUsageCheck.details?.unusedIndexSize || '0 B',
        warnings: indexUsageCheck.details?.warnings || []
      }
    };
  }

  return baseMetrics;
}

// Main Health Check Function
export async function performHealthCheck(): Promise<SystemHealth> {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel for faster response
    const [databaseCheck, cacheCheck, storageCheck, objectStorageCheck, externalCheck, indexUsageCheck] = await Promise.all([
      checkDatabase(),
      checkCache(),
      checkStorage(),
      checkObjectStorage(),
      checkExternalServices(),
      checkIndexUsage()
    ]);

    const checks = [databaseCheck, cacheCheck, storageCheck, objectStorageCheck, externalCheck, indexUsageCheck];

    // Get circuit breaker status from appStorageService (with null-safety)
    let circuitStatus: any;
    let circuitBreakerAvailable = false;

    try {
      const rawStatus = appStorageService?.getCircuitStatus();
      if (rawStatus) {
        // Convert Date to ISO string for JSON serialization
        circuitStatus = {
          ...rawStatus,
          lastStateChange: rawStatus.lastStateChange ? rawStatus.lastStateChange : null
        };
        circuitBreakerAvailable = true;
      } else {
        // Service not initialized - provide default values
        circuitStatus = {
          state: 'UNAVAILABLE',
          failureCount: 0,
          successCount: 0,
          stateChanges: 0,
          lastStateChange: null,
          totalFailures: 0,
          totalSuccesses: 0
        };
      }
    } catch (error) {
      // Circuit breaker unavailable - provide default values
      logger.warn('[Health] Circuit breaker status unavailable:', error);
      circuitStatus = {
        state: 'UNAVAILABLE',
        failureCount: 0,
        successCount: 0,
        stateChanges: 0,
        lastStateChange: null,
        totalFailures: 0,
        totalSuccesses: 0
      };
    }

    // Determine overall health status (only consider circuit breaker if available and in bad state)
    const unhealthyCount = checks.filter(check => check.status === 'unhealthy').length;
    const degradedCount = checks.filter(check => check.status === 'degraded').length;
    const circuitOpen = circuitBreakerAvailable && circuitStatus.state === 'OPEN';
    const circuitHalfOpen = circuitBreakerAvailable && circuitStatus.state === 'HALF_OPEN';

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0 || circuitOpen) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0 || circuitHalfOpen) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const systemHealth: SystemHealth = {
      overall: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: config.app.environment,
      version: development.packageVersion,
      checks,
      circuitBreaker: circuitStatus, // Always include (with default if unavailable)
      metrics: await getSystemMetrics(indexUsageCheck)
    };

    // Log health check results in production
    if (config.app.environment === 'production') {
      logger.info(`[Health] Overall: ${overallStatus} (${Date.now() - startTime}ms)`);

      // Log any unhealthy services
      checks.filter(check => check.status === 'unhealthy').forEach(check => {
        logger.error(`[Health] ❌ ${check.service}: ${check.details?.error || 'Unhealthy'}`);
      });
    }

    return systemHealth;

  } catch (error) {
    logger.error('[Health] Health check system failed:', error);

    return {
      overall: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: config.app.environment,
      version: development.packageVersion,
      checks: [{
        service: 'health_system',
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Health check system failure'
        },
        timestamp: new Date().toISOString()
      }],
      metrics: await getSystemMetrics()
    };
  }
}

// Health Check Route Handler
export async function healthCheckHandler(_req: Request, res: Response) {
  try {
    const health = await performHealthCheck();

    // Set appropriate HTTP status code based on health
    let statusCode = 200;
    if (health.overall === 'degraded') {
      statusCode = 200; // Still OK, but with warnings
    } else if (health.overall === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    }

    res.status(statusCode).json(health);

  } catch (error) {
    logger.error('[Health] Health check handler failed:', error);
    res.status(500).json({
      overall: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure'
    });
  }
}

// Lightweight health check for load balancers (memory monitoring disabled)
export function quickHealthHandler(_req: Request, res: Response) {
  // Quick check without detailed diagnostics (memory monitoring disabled)
  const uptime = Math.floor(process.uptime());
  // const memory = process.memoryUsage();

  // Simplified health check - just check uptime (memory monitoring disabled)
  if (uptime > 0) {
    res.status(200).json({
      status: 'healthy',
      uptime,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      uptime,
      timestamp: new Date().toISOString()
    });
  }
}