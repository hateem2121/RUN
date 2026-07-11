import type { NextFunction, Request, Response } from "express";
import { Redis } from "ioredis";
import { ResultAsync } from "neverthrow";
import { RateLimitError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";

const REDIS_URL = process.env.REDIS_URL ?? "";

const DUMMY_PATTERNS = ["dummy", "placeholder", "example.com", "localhost"];

const isRealRedisConfigured =
  REDIS_URL.length > 0 && !DUMMY_PATTERNS.some((p) => REDIS_URL.includes(p));

// Only instantiate Redis client if URL is real
const redis = isRealRedisConfigured ? new Redis(REDIS_URL) : null;

logger.info("rateLimiter initialized", {
  redis: isRealRedisConfigured ? "redis" : "in-memory-fallback",
});

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
  private redis: Redis | null = redis;
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig, customRedis?: Redis | null) {
    this.config = config;
    if (customRedis !== undefined) {
      this.redis = customRedis;
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
      if (
        (process.env.NODE_ENV === "test" && process.env.ENABLE_RATE_LIMIT_IN_TESTS !== "true") ||
        process.env.NODE_ENV === "development"
      ) {
        return next();
      }
      const clientIp = req.ip ?? req.socket.remoteAddress ?? "";
      const ip = clientIp || "unknown";
      const key = `ratelimit:${ip}`;

      const runLimiter = (): ResultAsync<{ current: number; ttl: number }, Error> => {
        if (this.redis) {
          return ResultAsync.fromPromise(
            this.redis.incr(key).then(async (requests) => {
              let ttl: number;
              if (requests === 1) {
                const ttlVal = Math.ceil(this.config.windowMs / 1000);
                await this.redis!.expire(key, ttlVal);
                ttl = ttlVal;
              } else {
                ttl = await this.redis!.ttl(key);
              }
              return { current: requests, ttl };
            }),
            (err) => (err instanceof Error ? err : new Error(String(err))),
          );
        } else {
          return ResultAsync.fromSafePromise(
            new Promise<{ current: number; ttl: number }>((resolve) => {
              const now = Date.now();
              let entry = this.store.get(ip);
              if (!entry || entry.resetTime < now) {
                entry = { count: 0, resetTime: now + this.config.windowMs };
                this.store.set(ip, entry);
              }
              entry.count++;
              resolve({
                current: entry.count,
                ttl: Math.ceil((entry.resetTime - now) / 1000),
              });
            }),
          );
        }
      };

      await runLimiter().match(
        ({ current, ttl }) => {
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
        },
        async (error) => {
          logger.error("[RateLimiter] Error in rate limiter, falling back to memory strict", error);

          await ResultAsync.fromSafePromise(
            new Promise<void>((resolve) => {
              const now = Date.now();
              let entry = this.store.get(ip);
              if (!entry || entry.resetTime < now) {
                entry = { count: 0, resetTime: now + this.config.windowMs };
                this.store.set(ip, entry);
              }
              entry.count++;
              if (entry.count > this.config.max) {
                next(
                  new RateLimitError("Too many requests (fallback)", {
                    retryAfter: 60,
                    fallback: true,
                  }),
                );
              } else {
                next();
              }
              resolve();
            }),
          );
        },
      );
    };
  };

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Requirement: Optimize to 1000 requests per 15 minutes
/** @public */ export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: "Too many API requests, please try again later.",
  statusCode: 429,
});

/**
 * Factory function to create rate limiters with custom configuration
 * Replaces deprecated createRateLimiter from rate-limiter.ts
 */
interface CreateRateLimiterOptions {
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
/** @public */ export const uploadRateLimit = new UploadRateLimiter();

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
