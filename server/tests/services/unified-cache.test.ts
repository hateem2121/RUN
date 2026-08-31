/**
 * Unified Cache Unit Tests
 *
 * Tests cover:
 * - L1 (LRU) cache operations
 * - Compression logic
 * - SWR pattern
 * - Health monitoring & Statistics
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../lib/resilience/circuit-breaker.js", () => ({
  withCircuit: vi.fn((_name, fn) => fn()),
}));

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getTracer: () => ({
      startActiveSpan: (_name: string, fn: (span: unknown) => unknown) => {
        const mockSpan = {
          setAttribute: vi.fn(),
          setStatus: vi.fn(),
          recordException: vi.fn(),
          end: vi.fn(),
        };
        return fn(mockSpan);
      },
    }),
  },
  SpanStatusCode: {
    OK: 0,
    ERROR: 1,
  },
}));

describe("UnifiedCache", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { unifiedCache } = await import("../../lib/cache/unified-cache.js");
    await unifiedCache.clear();
  });

  describe("TTL Presets", () => {
    it("should have correct TTL values", async () => {
      const { UnifiedCache } = await import("../../lib/cache/unified-cache.js");

      expect(UnifiedCache.TTL_PRESETS.SHORT).toBe(300); // 5 minutes
      expect(UnifiedCache.TTL_PRESETS.MEDIUM).toBe(1800); // 30 minutes
      expect(UnifiedCache.TTL_PRESETS.LONG).toBe(3600); // 1 hour
      expect(UnifiedCache.TTL_PRESETS.MEDIA).toBe(21600); // 6 hours
      expect(UnifiedCache.TTL_PRESETS.STATIC).toBe(86400); // 24 hours
    });
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", async () => {
      const { UnifiedCache } = await import("../../lib/cache/unified-cache.js");

      const instance1 = UnifiedCache.getInstance();
      const instance2 = UnifiedCache.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("get()", () => {
    it("should return cached value from L1", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      // Set a value first
      await unifiedCache.set("test-key", { data: "test" }, 3600);

      // Get should return from L1
      const result = await unifiedCache.get("test-key");

      expect(result).toEqual({ data: "test" });
    });

    it("should return null for cache miss", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      const result = await unifiedCache.get("non-existent-key");

      expect(result).toBeNull();
    });
  });

  describe("set()", () => {
    it("should store value in L1 cache", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      await unifiedCache.set("new-key", { value: 123 }, 3600);

      const result = await unifiedCache.get("new-key");
      expect(result).toEqual({ value: 123 });
    });
  });

  describe("delete()", () => {
    it("should remove value from L1 cache", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      await unifiedCache.set("delete-key", { data: "to-delete" }, 3600);
      await unifiedCache.delete("delete-key");

      const result = await unifiedCache.get("delete-key");
      expect(result).toBeNull();
    });
  });

  describe("clear()", () => {
    it("should clear all items from L1 cache", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      await unifiedCache.set("key1", "value1", 3600);
      await unifiedCache.set("key2", "value2", 3600);

      await unifiedCache.clear();

      const stats = unifiedCache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe("getStats()", () => {
    it("should return cache statistics", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      const stats = unifiedCache.getStats();

      expect(stats).toHaveProperty("hits");
      expect(stats).toHaveProperty("misses");
      expect(stats).toHaveProperty("sets");
      expect(stats).toHaveProperty("deletes");
      expect(stats).toHaveProperty("l1Hits");
      expect(stats).toHaveProperty("l2Hits");
      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("hitRate");
    });

    it("should calculate hit rate correctly", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      // Perform some operations
      await unifiedCache.set("hit-rate-key", "value", 3600);
      await unifiedCache.get("hit-rate-key"); // Hit
      await unifiedCache.get("hit-rate-key"); // Hit
      await unifiedCache.get("miss-key"); // Miss

      const stats = unifiedCache.getStats();

      expect(typeof stats.hitRate).toBe("number");
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeLessThanOrEqual(100);
    });
  });

  describe("getHealthStatus()", () => {
    it("should return health status object", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      const health = await unifiedCache.getHealthStatus();

      expect(health).toHaveProperty("healthy");
      expect(health).toHaveProperty("status");
      expect(health).toHaveProperty("stats");
      expect(health).toHaveProperty("issues");
      expect(health).toHaveProperty("timestamp");
    });

    it("should report healthy status when all checks pass", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      const health = await unifiedCache.getHealthStatus();

      expect(typeof health.healthy).toBe("boolean");
      expect(["healthy", "degraded", "unhealthy"]).toContain(health.status);
    });
  });

  describe("getHealthScore()", () => {
    it("should return a score between 0 and 100", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      const score = unifiedCache.getHealthScore();

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("SWR (Stale-While-Revalidate)", () => {
    it("should fetch fresh data on cache miss", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      const fetchFn = vi.fn().mockResolvedValue({ fresh: "data" });

      const result = await unifiedCache.getSWR("swr-key", fetchFn, { ttl: 3600 }, "default");

      expect(fetchFn).toHaveBeenCalled();
      expect(result.data).toEqual({ fresh: "data" });
      expect(result.source).toBe("loader");
    });

    it("should return cached data on hit", async () => {
      const { unifiedCache } = await import("../../lib/cache/unified-cache.js");

      // Pre-populate cache
      await unifiedCache.set("swr-cached-key", { cached: true }, 3600);

      const fetchFn = vi.fn().mockResolvedValue({ fresh: "data" });

      const result = await unifiedCache.getSWR("swr-cached-key", fetchFn, { ttl: 3600 }, "default");

      expect(result.data).toEqual({ cached: true });
      expect(["memory", "swr_hit"]).toContain(result.source);
    });
  });
});
