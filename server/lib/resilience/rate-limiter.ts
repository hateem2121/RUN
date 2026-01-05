/**
 * CHUNK 13: Production-Grade In-Memory Rate Limiter
 *
 * Custom implementation without external dependencies to avoid peer dependency conflicts.
 * Features:
 * - IP-based request tracking
 * - Configurable window and limit
 * - Standard RateLimit headers (draft-8)
 * - Automatic cleanup of expired entries
 * - Integration with existing metrics system
 */

import type { NextFunction, Request, Response } from "express";
import { logger } from "../monitoring/logger.js";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message?: string | undefined; // Custom error message
  statusCode?: number | undefined; // HTTP status code (default: 429)
  keyGenerator?: (req: Request) => string; // Custom key generator
  skip?: (req: Request) => boolean; // Skip rate limiting for certain requests
  testMode?: boolean | undefined; // FORENSIC: Enable production-like limits in dev
  warningThreshold?: number | undefined; // FORENSIC: Warn at X% of limit (default: 80)
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: Required<RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout;

  // FORENSIC INVESTIGATION - Phase 6: Enhanced monitoring
  private stats = {
    totalRequests: 0,
    blockedRequests: 0,
    warningsSent: 0,
  };

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      max: config.max,
      message: config.message || "Too many requests, please try again later.",
      statusCode: config.statusCode || 429,
      keyGenerator: config.keyGenerator || ((req: Request) => req.ip || "unknown"),
      skip: config.skip || (() => false),
      testMode: config.testMode || false,
      warningThreshold: config.warningThreshold || 80,
    };

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`[RateLimiter] Cleaned ${cleaned} expired entries, ${this.store.size} remain`);
    }
  }

  middleware = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Skip if configured to skip this request
      if (this.config.skip(req)) {
        next();
        return;
      }

      const key = this.config.keyGenerator(req);
      const now = Date.now();

      let entry = this.store.get(key);

      // Create new entry if not exists or window expired
      if (!entry || entry.resetTime < now) {
        entry = {
          count: 0,
          resetTime: now + this.config.windowMs,
        };
        this.store.set(key, entry);
      }

      // Increment request count
      entry.count++;
      this.stats.totalRequests++;

      // Calculate remaining requests
      const remaining = Math.max(0, this.config.max - entry.count);
      const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
      const usagePercent = (entry.count / this.config.max) * 100;

      // Set RateLimit headers (draft-8 standard)
      res.setHeader(
        "RateLimit-Policy",
        `${this.config.max};w=${Math.floor(this.config.windowMs / 1000)}`,
      );
      res.setHeader("RateLimit-Limit", this.config.max.toString());
      res.setHeader("RateLimit-Remaining", remaining.toString());
      res.setHeader("RateLimit-Reset", resetInSeconds.toString());

      // FORENSIC: Add usage percentage header
      res.setHeader("RateLimit-Usage", `${Math.round(usagePercent)}%`);

      // FORENSIC: Warning threshold (80% by default)
      if (
        usagePercent &&
        usagePercent >= (this.config.warningThreshold || 80) &&
        usagePercent < 100
      ) {
        this.stats.warningsSent++;
        res.setHeader("RateLimit-Warning", `Approaching limit: ${Math.round(usagePercent)}%`);
        logger.warn(
          `[RateLimiter] Warning for ${key}: ${entry.count}/${this.config.max} (${Math.round(
            usagePercent,
          )}%)`,
        );
      }

      // Check if limit exceeded
      if (entry.count > this.config.max) {
        this.stats.blockedRequests++;
        logger.warn(
          `[RateLimiter] Rate limit exceeded for ${key}: ${entry.count}/${this.config.max} (window: ${this.config.windowMs}ms)`,
        );

        res.setHeader("Retry-After", resetInSeconds.toString());
        res.status(this.config.statusCode || 429).json({
          success: false,
          error: {
            message: this.config.message,
            retryAfter: resetInSeconds,
            limit: this.config.max,
            windowMs: this.config.windowMs,
          },
        });
        return;
      }

      next();
    };
  };

  // Graceful shutdown
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }

  // Get current stats (for monitoring)
  getStats() {
    return {
      activeKeys: this.store.size,
      config: {
        windowMs: this.config.windowMs,
        max: this.config.max,
        testMode: this.config.testMode,
        warningThreshold: this.config.warningThreshold || 80,
      },
      stats: { ...this.stats },
    };
  }

  // FORENSIC: Get health status
  getHealthStatus() {
    const issues: string[] = [];

    if (this.store.size > 1000) {
      issues.push(`High number of tracked IPs: ${this.store.size}`);
    }

    const blockRate =
      this.stats.totalRequests > 0
        ? (this.stats.blockedRequests / this.stats.totalRequests) * 100
        : 0;

    if (blockRate > 10) {
      issues.push(`High block rate: ${Math.round(blockRate)}%`);
    }

    return {
      healthy: issues.length === 0,
      status: issues.length === 0 ? "healthy" : issues.length === 1 ? "degraded" : "unhealthy",
      stats: this.getStats(),
      issues,
      timestamp: Date.now(),
    };
  }
}

// ============================================================================
// RATE LIMITER CONFIGURATIONS
// ============================================================================

/**
 * General API Rate Limiter
 * - 500 requests per 15 minutes per IP (increased for development/testing)
 * - Applies to all public API routes
 */
/**
 * General API Rate Limiter
 * - 100 requests per 15 minutes per IP (Strict Security Limit)
 * - Applies to all public API routes
 */
export const generalLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many API requests, please try again later.",
});

/**
 * Admin API Rate Limiter
 * - 30 requests per 15 minutes per IP (Strict Security Limit)
 * - Stricter limit for admin operations
 */
export const adminLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: "Too many admin requests, please try again later.",
});

/**
 * Diagnostic/Utility API Rate Limiter
 * - 10 requests per 1 minute per IP
 * - Very strict limit for diagnostic endpoints
 */
export const diagnosticLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: "Too many diagnostic requests, please try again later.",
});

// Log initialization
logger.info("[RateLimiter] Production-grade rate limiters initialized");
logger.info(
  `[RateLimiter] General: ${generalLimiter.getStats().config.max} req/${
    generalLimiter.getStats().config.windowMs
  }ms`,
);
logger.info(
  `[RateLimiter] Admin: ${adminLimiter.getStats().config.max} req/${
    adminLimiter.getStats().config.windowMs
  }ms`,
);
logger.info(
  `[RateLimiter] Diagnostic: ${diagnosticLimiter.getStats().config.max} req/${
    diagnosticLimiter.getStats().config.windowMs
  }ms`,
);

// Graceful shutdown handler
process.on("SIGTERM", () => {
  logger.info("[RateLimiter] Shutting down rate limiters...");
  generalLimiter.destroy();
  adminLimiter.destroy();
  diagnosticLimiter.destroy();
});
