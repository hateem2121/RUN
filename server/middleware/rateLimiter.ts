import { Redis } from "@upstash/redis";
import type { NextFunction, Request, Response } from "express";
import { RateLimitError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  statusCode: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private redis: Redis | null = null;
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Try to initialize Redis
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        this.redis = Redis.fromEnv();
      } catch (_error) {
        logger.warn("[RateLimiter] Failed to initialize Redis, falling back to memory");
      }
    } else {
    }

    // Cleanup interval for memory store
    if (!this.redis) {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  middleware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Skip rate limiting in test mode unless explicitly enabled
      if (process.env.NODE_ENV === "test" && process.env.ENABLE_RATE_LIMIT_IN_TESTS !== "true") {
        return next();
      }
      const ip = req.ip || "unknown";
      const key = `ratelimit:${ip}`;

      let current = 0;
      let ttl = 0;

      try {
        if (this.redis) {
          // Redis Fixed Window
          const requests = await this.redis.incr(key);
          if (requests === 1) {
            await this.redis.expire(key, Math.ceil(this.config.windowMs / 1000));
            ttl = Math.ceil(this.config.windowMs / 1000);
          } else {
            ttl = await this.redis.ttl(key);
          }
          current = requests;
        } else {
          // In-Memory Fallback
          const now = Date.now();
          let entry = this.store.get(ip);

          if (!entry || entry.resetTime < now) {
            entry = {
              count: 0,
              resetTime: now + this.config.windowMs,
            };
            this.store.set(ip, entry);
          }

          entry.count++;
          current = entry.count;
          ttl = Math.ceil((entry.resetTime - now) / 1000);
        }

        // Set Headers
        const remaining = Math.max(0, this.config.max - current);

        res.setHeader("RateLimit-Limit", this.config.max.toString());
        res.setHeader("RateLimit-Remaining", remaining.toString());
        res.setHeader("RateLimit-Reset", ttl.toString());

        if (current > this.config.max) {
          return next(
            new RateLimitError(this.config.message, {
              retryAfter: ttl,
              limit: this.config.max,
              windowMs: this.config.windowMs,
            }),
          );
        }

        next();
      } catch (error: unknown) {
        // Fallback to in-memory if Redis fails during the request
        logger.error(
          "[RateLimiter] Error in rate limiter, falling back to memory strict",
          error instanceof Error ? error : new Error(String(error)),
        );

        // Critical System Protection: Do NOT fail open if Redis dies, switch to local map
        try {
          const now = Date.now();
          let entry = this.store.get(ip);
          if (!entry || entry.resetTime < now) {
            entry = { count: 0, resetTime: now + this.config.windowMs };
            this.store.set(ip, entry);
          }
          entry.count++;
          if (entry.count > this.config.max) {
            return next(
              new RateLimitError("Too many requests (fallback)", {
                retryAfter: 60, // Default 1 min fallback type
                fallback: true,
              }),
            );
          }
          next();
        } catch (innerError) {
          // If even memory fails, allow request but log critical error
          logger.error("[RateLimiter] Critical failure in fallback", innerError);
          next();
        }
      }
    };
  };

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Requirement: Optimize to 1000 requests per 15 minutes
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: "Too many API requests, please try again later.",
  statusCode: 429,
});

/**
 * Factory function to create rate limiters with custom configuration
 * Replaces deprecated createRateLimiter from rate-limiter.ts
 */
export interface CreateRateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
  skip?: (req: Request) => boolean;
}

export function createRateLimiter(options: CreateRateLimiterOptions) {
  const limiter = new RateLimiter({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || "Too many requests, please try again later.",
    statusCode: 429,
  });
  return limiter.middleware();
}

/**
 * UploadRateLimiter - Simple rate limiter for upload endpoints
 * Migrated from deprecated rate-limiter.ts for backward compatibility
 */
export class UploadRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxRequests: number = 50, windowMs: number = 5 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private getClientKey(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"] as string;
    const ip = forwarded ? forwarded.split(",")[0] : req.ip;
    return `upload_${ip}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.getClientKey(req);
    const now = Date.now();

    let entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.store.set(key, entry);
      next();
      return;
    }

    if (entry.count >= this.maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      res.set({
        "RateLimit-Limit": this.maxRequests.toString(),
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": resetIn.toString(),
        "Retry-After": resetIn.toString(),
      });

      res.status(429).json({
        success: false,
        error: "Too many upload requests",
        message: `Rate limit exceeded. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
        retryAfter: resetIn,
      });
      return;
    }

    entry.count++;
    const remaining = this.maxRequests - entry.count;
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    res.set({
      "RateLimit-Limit": this.maxRequests.toString(),
      "RateLimit-Remaining": remaining.toString(),
      "RateLimit-Reset": resetIn.toString(),
    });

    next();
  };

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance for backward compatibility
export const uploadRateLimit = new UploadRateLimiter();

/**
 * Authentication Rate Limiter
 * Strict limit for login and auth-related endpoints
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: "Too many login attempts, please try again after 15 minutes.",
});

/**
 * Write Rate Limiter
 * Standard limit for public POST/PUT/PATCH endpoints
 */
export const writeRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests
  message: "Too many requests, please try again later.",
});
