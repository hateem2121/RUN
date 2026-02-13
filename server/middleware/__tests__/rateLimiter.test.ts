import { Redis } from "@upstash/redis";
import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRateLimiter, createRateLimiter, RateLimiter } from "../rateLimiter.js";

// Mock dependnecies
vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: vi.fn(),
  },
}));

vi.mock("../lib/monitoring/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("RateLimiter Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      ip: "127.0.0.1",
      headers: {},
    };
    res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("In-Memory Strategy (Default Fallback)", () => {
    it("should allow requests within limit", async () => {
      // Force memory mode by ensuring Redis throws or returns null
      vi.mocked(Redis.fromEnv).mockImplementation(() => {
        throw new Error("No Redis");
      });

      const limiter = new RateLimiter({
        windowMs: 1000,
        max: 2,
        message: "Too many",
        statusCode: 429,
      });

      const middleware = limiter.middleware();

      // Request 1
      await middleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Remaining", "1");

      // Request 2
      await middleware(req as Request, res as Response, next);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Remaining", "0");
    });

    it("should block requests exceeding limit", async () => {
      vi.mocked(Redis.fromEnv).mockImplementation(() => {
        throw new Error("No Redis");
      });
      const limiter = new RateLimiter({
        windowMs: 1000,
        max: 1,
        message: "Too many",
        statusCode: 429,
      });
      const middleware = limiter.middleware();

      await middleware(req as Request, res as Response, next); // 1st OK
      await middleware(req as Request, res as Response, next); // 2nd Blocked

      // The middleware calls next(error) when blocked
      expect(next).toHaveBeenLastCalledWith(expect.any(Error));
      const errorArg = vi.mocked(next).mock.calls[1][0] as any;
      expect(errorArg.statusCode).toBe(429);
      expect(errorArg.message).toBe("Too many");
    });

    it("should reset after windowMs", async () => {
      vi.mocked(Redis.fromEnv).mockImplementation(() => {
        throw new Error("No Redis");
      });
      const limiter = new RateLimiter({
        windowMs: 1000,
        max: 1,
        message: "Too many",
        statusCode: 429,
      });
      const middleware = limiter.middleware();

      await middleware(req as Request, res as Response, next); // 1 OK

      // Advance time
      vi.advanceTimersByTime(1100);

      await middleware(req as Request, res as Response, next); // 2 OK (reset)

      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Remaining", "0");
      expect(next).toHaveBeenCalledTimes(2);
    });
  });

  describe("Redis Strategy", () => {
    let mockRedis: any;

    beforeEach(() => {
      mockRedis = {
        incr: vi.fn(),
        expire: vi.fn(),
        ttl: vi.fn(),
      };
      vi.mocked(Redis.fromEnv).mockReturnValue(mockRedis);
      process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
    });

    afterEach(() => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it("should use Redis when available", async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const limiter = new RateLimiter({ windowMs: 1000, max: 10, message: "", statusCode: 429 });
      const middleware = limiter.middleware();

      await middleware(req as Request, res as Response, next);

      expect(mockRedis.incr).toHaveBeenCalledWith("ratelimit:127.0.0.1");
      expect(next).toHaveBeenCalled();
    });

    it("should fallback to memory if Redis fails during request", async () => {
      mockRedis.incr.mockRejectedValue(new Error("Redis connection lost"));

      const limiter = new RateLimiter({ windowMs: 1000, max: 10, message: "", statusCode: 429 });
      const middleware = limiter.middleware();

      await middleware(req as Request, res as Response, next);

      // Should log error but succeed via fallback
      expect(next).toHaveBeenCalled();
    });
  });
});
