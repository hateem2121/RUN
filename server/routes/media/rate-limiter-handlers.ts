/**
 * FORENSIC INVESTIGATION - Phase 6: Rate Limiter Monitoring Handlers
 */

import type { Request, Response } from "express";
import {
  adminLimiter,
  diagnosticLimiter,
  generalLimiter,
} from "../../lib/resilience/rate-limiter.js";
import { createSuccessResponse } from "./utils.js";

/**
 * GET /api/media/rate-limiter/stats
 * Returns detailed rate limiter statistics
 */
export async function getRateLimiterStats(_req: Request, res: Response) {
  const stats = {
    general: generalLimiter.getStats(),
    admin: adminLimiter.getStats(),
    diagnostic: diagnosticLimiter.getStats(),
    timestamp: Date.now(),
  };

  return res.json(createSuccessResponse(stats));
}

/**
 * GET /api/media/rate-limiter/health
 * Returns rate limiter health status
 */
export async function getRateLimiterHealth(_req: Request, res: Response) {
  const generalHealth = generalLimiter.getHealthStatus();
  const adminHealth = adminLimiter.getHealthStatus();
  const diagnosticHealth = diagnosticLimiter.getHealthStatus();

  const allHealthy = generalHealth.healthy && adminHealth.healthy && diagnosticHealth.healthy;

  const overallStatus = allHealthy
    ? "healthy"
    : [generalHealth, adminHealth, diagnosticHealth].filter((h) => !h.healthy).length === 1
      ? "degraded"
      : "unhealthy";

  return res.json(
    createSuccessResponse({
      overall: {
        healthy: allHealthy,
        status: overallStatus,
      },
      limiters: {
        general: generalHealth,
        admin: adminHealth,
        diagnostic: diagnosticHealth,
      },
      timestamp: Date.now(),
    }),
  );
}
