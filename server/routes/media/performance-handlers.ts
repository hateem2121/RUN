/**
 * PERFORMANCE & MONITORING HANDLERS
 * Forensic Investigation Phase 2: Cache Monitoring
 */

import type { Request, Response } from "express";
import { performanceMonitor } from "../../lib/performance-monitor.js";
import { unifiedCache } from "../../lib/unified-cache.js";
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
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[getCacheHealth] Error:', errorMessage);
    return res
      .status(500)
      .json(createErrorResponse("Failed to get cache health"));
  }
}

/**
 * GET /api/media/performance/system
 * Returns aggregated system performance metrics
 */
export async function getSystemPerformance(_req: Request, res: Response) {
  try {
    const summary = await performanceMonitor.getSystemPerformance();
    const health = await performanceMonitor.getHealthStatus();
    
    return res.json(
      createSuccessResponse({
        performance: summary,
        health,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[getSystemPerformance] Error:', errorMessage);
    return res
      .status(500)
      .json(createErrorResponse("Failed to get system performance"));
  }
}

/**
 * GET /api/media/performance/endpoint
 * Returns metrics for a specific endpoint
 */
export async function getEndpointPerformance(req: Request, res: Response) {
  try {
    const { path, minutes = 5 } = req.query;
    
    if (!path || typeof path !== 'string') {
      return res
        .status(400)
        .json(createErrorResponse("Missing or invalid 'path' query parameter"));
    }
    
    const metrics = performanceMonitor.getEndpointMetrics(
      path,
      Number.parseInt(minutes as string, 10)
    );
    
    return res.json(createSuccessResponse(metrics));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[getEndpointPerformance] Error:', errorMessage);
    return res
      .status(500)
      .json(createErrorResponse("Failed to get endpoint performance"));
  }
}

/**
 * Helper: Generate cache recommendations based on health status
 */
function generateCacheRecommendations(healthStatus: any): string[] {
  const recommendations: string[] = [];
  
  if (healthStatus.stats.hitRate < 50 && healthStatus.stats.totalOperations > 100) {
    recommendations.push(
      "Consider increasing cache TTL for frequently accessed resources",
      "Review cache invalidation patterns - may be clearing too aggressively"
    );
  }
  
  if (healthStatus.stats.calculatedSize / (100 * 1024 * 1024) > 0.8) {
    recommendations.push(
      "Cache approaching size limit - consider implementing cache eviction strategy"
    );
  }
  
  if (healthStatus.stats.itemCount > 4000) {
    recommendations.push(
      "High item count - review if all cached items are necessary"
    );
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Cache performance is optimal");
  }
  
  return recommendations;
}
