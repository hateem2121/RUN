import type { NextFunction, Request, Response } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skip?: (req: Request) => boolean; // Allow skipping rate limit for certain requests
}

/**
 * Simple rate limiter for upload endpoints to prevent abuse
 */
export class UploadRateLimiter {
  private store: RateLimitStore = {};
  private maxRequests: number;
  private windowMs: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxRequests: number = 50, windowMs: number = 5 * 60 * 1000) {
    // 50 requests per 5 minutes
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private getClientKey(req: Request): string {
    // Use IP address as key, could be enhanced with user ID for authenticated users
    const forwarded = req.headers["x-forwarded-for"] as string;
    const ip = forwarded ? forwarded.split(",")[0] : req.connection.remoteAddress;
    return `upload_${ip}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key] && this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.getClientKey(req);
    const now = Date.now();

    if (!this.store[key] || this.store[key].resetTime < now) {
      // Reset window
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return next();
    }

    if (this.store[key].count >= this.maxRequests) {
      const resetIn = Math.ceil((this.store[key].resetTime - now) / 1000);
      res.set({
        "X-RateLimit-Limit": this.maxRequests.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": resetIn.toString(),
      });

      res.status(429).json({
        success: false,
        error: "Too many upload requests",
        message: `Rate limit exceeded. Try again in ${Math.ceil(resetIn / 60)} minutes.`,
        retryAfter: resetIn,
      });
      return;
    }

    this.store[key].count++;
    res.set({
      "X-RateLimit-Limit": this.maxRequests.toString(),
      "X-RateLimit-Remaining": (this.maxRequests - this.store[key].count).toString(),
      "X-RateLimit-Reset": Math.ceil((this.store[key].resetTime - now) / 1000).toString(),
    });

    next();
  };

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Generic rate limiter class for any endpoint
 * Phase 1, Block 1D: Rate limiting for expensive endpoints
 */
export class GenericRateLimiter {
  private store: RateLimitStore = {};
  private maxRequests: number;
  private windowMs: number;
  private message: string;
  private keyPrefix: string;
  private skipFn?: (req: Request) => boolean;
  private cleanupInterval: NodeJS.Timeout;

  constructor(options: RateLimitOptions) {
    this.maxRequests = options.max;
    this.windowMs = options.windowMs;
    this.message = options.message || "Too many requests, please try again later";
    this.keyPrefix = options.keyPrefix || "rl";
    this.skipFn = options.skip;

    // Cleanup expired entries periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, Math.min(this.windowMs, 5 * 60 * 1000)); // Cleanup at most every 5 minutes
  }

  private getClientKey(req: Request): string {
    // Use IP address as key
    const forwarded = req.headers["x-forwarded-for"] as string;
    const ip = forwarded ? forwarded.split(",")[0] : req.connection.remoteAddress;
    return `${this.keyPrefix}_${ip}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key] && this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    // Check if we should skip rate limiting for this request
    if (this.skipFn && this.skipFn(req)) {
      return next();
    }

    const key = this.getClientKey(req);
    const now = Date.now();

    let entry = this.store[key];

    // Create new entry if not exists or window expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.store[key] = entry;
      return next();
    }

    if (entry.count >= this.maxRequests) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      res.set({
        "X-RateLimit-Limit": this.maxRequests.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": resetIn.toString(),
      });

      res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message: this.message,
        retryAfter: resetIn,
      });
      return;
    }

    entry.count++;
    this.store[key] = entry; // Save updated entry back to store
    res.set({
      "X-RateLimit-Limit": this.maxRequests.toString(),
      "X-RateLimit-Remaining": (this.maxRequests - entry.count).toString(),
      "X-RateLimit-Reset": Math.ceil((entry.resetTime - now) / 1000).toString(),
    });

    next();
  };

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Factory function to create rate limiters
 * Phase 1, Block 1D: Prevent Neon DB exhaustion
 *
 * @param options - Rate limit configuration
 * @returns Express middleware function
 */
export function createRateLimiter(options: RateLimitOptions) {
  const limiter = new GenericRateLimiter(options);
  return limiter.middleware;
}

// Export singleton instance
export const uploadRateLimit = new UploadRateLimiter();
