import { Redis } from "ioredis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter, RateLimiter, UploadRateLimiter } from "../rateLimiter";

vi.mock("ioredis", () => {
  const MockRedis = vi.fn(() => ({
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  }));
  return { Redis: MockRedis };
});

vi.mock("../lib/monitoring/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("RateLimiter Middleware", () => {
  let req: Record<string, unknown>;
  let res: {
    setHeader: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENABLE_RATE_LIMIT_IN_TESTS = "true";
    req = { ip: "127.0.0.1", headers: {} };
    res = {
      setHeader: vi.fn(),
      set: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    process.env.UPSTASH_REDIS_REST_URL = "test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test";
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  describe("RateLimiter (Redis-based)", () => {
    it("uses Redis if available", async () => {
      const mockRedis = {
        incr: vi.fn().mockResolvedValue(1),
        expire: vi.fn().mockResolvedValue(1),
      };

      const limiter = new RateLimiter(
        {
          windowMs: 60000,
          max: 5,
          message: "Too many requests",
          statusCode: 429,
        },
        mockRedis as unknown as Redis,
      );

      await limiter.middleware()(req, res, next);

      expect(mockRedis.incr).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it("blocks request if limit exceeded (Redis)", async () => {
      const mockRedis = {
        incr: vi.fn().mockResolvedValue(6),
        ttl: vi.fn().mockResolvedValue(30),
      };

      const limiter = new RateLimiter(
        {
          windowMs: 60000,
          max: 5,
          message: "Limit hit",
          statusCode: 429,
        },
        mockRedis as unknown as Redis,
      );

      await limiter.middleware()(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Limit hit" }));
    });
  });

  describe("RateLimiter (Memory Fallback)", () => {
    it("falls back to memory if Redis fails during request", async () => {
      const mockRedis = {
        incr: vi.fn().mockRejectedValue(new Error("Redis failed")),
      };

      const limiter = new RateLimiter({
        windowMs: 60000,
        max: 2,
        message: "Memory limit",
        statusCode: 429,
      }, mockRedis as unknown as Redis);

      const middleware = limiter.middleware();

      await middleware(req, res, next); // 1 (Redis fails, falls back to memory, count=1)
      await middleware(req, res, next); // 2 (Redis fails, memory count=2)
      await middleware(req, res, next); // 3 (Should fail in memory)

      expect(next).toHaveBeenCalledTimes(3);
      expect(next).toHaveBeenLastCalledWith(expect.objectContaining({ message: "Too many requests (fallback)" }));
      limiter.destroy();
    });
  });

  describe("createRateLimiter factory", () => {
    it("creates a middleware correctly", async () => {
      const middleware = createRateLimiter({ windowMs: 1000, max: 10 });
      expect(typeof middleware).toBe("function");
    });
  });

  describe("UploadRateLimiter", () => {
    it("limits upload requests using memory", async () => {
      const limiter = new UploadRateLimiter(2, 60000);
      const middleware = limiter.middleware;

      middleware(req, res, next); // 1
      middleware(req, res, next); // 2
      middleware(req, res, next); // 3 (Should fail)

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Too many upload requests" }),
      );
      limiter.destroy();
    });
  });
});
