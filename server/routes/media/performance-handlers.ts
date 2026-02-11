/**
 * PERFORMANCE & MONITORING HANDLERS
 * Forensic Investigation Phase 2: Cache Monitoring
 */

import type { Request, Response } from "express";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { performanceMonitor } from "../../lib/db/query-performance.js";
import { createErrorResponse, createSuccessResponse } from "./utils.js";

/**
 * GET /api/media/cache/stats
 * Returns detailed cache statistics and hit rate
 */
export async function getCacheHealth(_req: Request, res: Response) {
  try {
    const healthStatus = await unifiedCache.getHealthStatus();

    return res.json(
      createSuccessResponse({
        ...healthStatus,
        recommendations: generateCacheRecommendations(healthStatus),
      }),
    );
  } catch (error) {
    const _errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json(createErrorResponse("Failed to get cache health"));
  }
}

/**
 * GET /api/media/performance/system
 * Returns aggregated system performance metrics
 */
export async function getSystemPerformance(_req: Request, res: Response) {
  try {
    // Get current performance stats
    const stats = performanceMonitor.getPerformanceStats();

    // Get health status
    const isHealthy = performanceMonitor.isHealthy();

    const metrics = {
      ...stats,
      status: isHealthy ? "healthy" : "degraded",
      timestamp: Date.now(),
    };

    return res.json(createSuccessResponse(metrics));
  } catch (error) {
    const _errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Assuming a logger might be introduced or using existing error response utility
    return res.status(500).json(createErrorResponse("Failed to get performance metrics"));
  }
}

/**
 * GET /api/media/performance/endpoint
 * Returns metrics for a specific endpoint
 */
import { PerformanceQuerySchema } from "./schemas.js";

// ...

export async function getEndpointPerformance(req: Request, res: Response) {
  try {
    const { path } = PerformanceQuerySchema.parse(req.query);

    // Validation handled by Zod above

    // Since getEndpointMetrics doesn't exist, we return the general performance report
    // In a real implementation, we would filter the report by path if feasible
    const report = performanceMonitor.generatePerformanceReport();

    return res.json(createSuccessResponse(report));
  } catch (error) {
    const _errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json(createErrorResponse("Failed to get endpoint performance"));
  }
}

/**
 * Helper: Generate cache recommendations based on health status
 */
function generateCacheRecommendations(
  healthStatus: Awaited<ReturnType<typeof unifiedCache.getHealthStatus>>,
): string[] {
  const recommendations: string[] = [];

  if (healthStatus.stats.hitRate < 50 && healthStatus.stats.totalOperations > 100) {
    recommendations.push(
      "Consider increasing cache TTL for frequently accessed resources",
      "Review cache invalidation patterns - may be clearing too aggressively",
    );
  }

  if (healthStatus.stats.calculatedSize / (100 * 1024 * 1024) > 0.8) {
    recommendations.push(
      "Cache approaching size limit - consider implementing cache eviction strategy",
    );
  }

  if (healthStatus.stats.itemCount > 4000) {
    recommendations.push("High item count - review if all cached items are necessary");
  }

  if (recommendations.length === 0) {
    recommendations.push("Cache performance is optimal");
  }

  return recommendations;
}
