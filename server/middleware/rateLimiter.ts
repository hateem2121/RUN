import type { NextFunction, Request, Response } from "express";

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

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Cleanup every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
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
    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || "unknown";
      const now = Date.now();
      let entry = this.store.get(key);

      if (!entry || entry.resetTime < now) {
        entry = {
          count: 0,
          resetTime: now + this.config.windowMs,
        };
        this.store.set(key, entry);
      }

      entry.count++;

      // Set standard headers
      const remaining = Math.max(0, this.config.max - entry.count);
      const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);

      res.setHeader("RateLimit-Limit", this.config.max.toString());
      res.setHeader("RateLimit-Remaining", remaining.toString());
      res.setHeader("RateLimit-Reset", resetInSeconds.toString());

      if (entry.count > this.config.max) {
        res.setHeader("Retry-After", resetInSeconds.toString());
        res.status(this.config.statusCode).json({
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

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Requirement: Optimize to 1000 requests per 15 minutes
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: "Too many API requests, please try again later.",
  statusCode: 429,
});
