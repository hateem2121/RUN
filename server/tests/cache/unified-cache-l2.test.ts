/**
 * Tests for UnifiedCache L2 short-circuiting in development/test environments.
 *
 * Verifies:
 * 1. In development/test mode (without FORCE_L2_CACHE), L2 provider is dummyCache
 *    and operations do not execute DB queries against cache_entries.
 * 2. When FORCE_L2_CACHE="true", L2 provider is postgresCache.
 * 3. In production mode, L2 provider is postgresCache.
 * 4. L1 memory cache handles operations quickly and correctly without L2 egress.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockReturnThis(),
  };
  return { mockDb };
});

vi.mock("../../db.js", () => ({
  db: mockDb,
}));

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

import { PostgresCacheProvider, postgresCache } from "../../lib/cache/postgres-cache-provider.js";
import { DummyCacheProvider, dummyCache, UnifiedCache } from "../../lib/cache/unified-cache.js";

describe("UnifiedCache L2 Configuration & Short-Circuit", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalForceL2 = process.env.FORCE_L2_CACHE;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalForceL2 !== undefined) {
      process.env.FORCE_L2_CACHE = originalForceL2;
    } else {
      delete process.env.FORCE_L2_CACHE;
    }
    UnifiedCache._resetInstanceForTesting();
  });

  describe("Development / Test Mode (Default: No FORCE_L2_CACHE)", () => {
    it("should configure L2 as dummyCache in development mode", () => {
      process.env.NODE_ENV = "development";
      delete process.env.FORCE_L2_CACHE;

      UnifiedCache._resetInstanceForTesting();
      const cache = UnifiedCache.getInstance();

      expect(cache.isL2Enabled()).toBe(false);
      expect(cache.getL2Provider()).toBe(dummyCache);
      expect(cache.getL2Provider() instanceof DummyCacheProvider).toBe(true);
    });

    it("should configure L2 as dummyCache in test mode", () => {
      process.env.NODE_ENV = "test";
      delete process.env.FORCE_L2_CACHE;

      UnifiedCache._resetInstanceForTesting();
      const cache = UnifiedCache.getInstance();

      expect(cache.isL2Enabled()).toBe(false);
      expect(cache.getL2Provider()).toBe(dummyCache);
      expect(cache.getL2Provider() instanceof DummyCacheProvider).toBe(true);
    });

    it("should not execute DB queries against cache_entries on cache miss", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.FORCE_L2_CACHE;

      UnifiedCache._resetInstanceForTesting();
      const cache = UnifiedCache.getInstance();

      const result = await cache.get("non-existent-dev-key");

      expect(result).toBeNull();
      expect(mockDb.select).not.toHaveBeenCalled();
      expect(mockDb.from).not.toHaveBeenCalled();
    });

    it("should not execute DB queries against cache_entries on cache set", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.FORCE_L2_CACHE;

      UnifiedCache._resetInstanceForTesting();
      const cache = UnifiedCache.getInstance();

      await cache.set("dev-item-key", { name: "test-product", price: 50 }, 300);

      // Verify stored and retrieved from L1 memory
      const cached = await cache.get<{ name: string; price: number }>("dev-item-key");
      expect(cached).toEqual({ name: "test-product", price: 50 });

      // DB insert should never be invoked
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it("should not execute DB queries against cache_entries on delete or clearPattern", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.FORCE_L2_CACHE;

      UnifiedCache._resetInstanceForTesting();
      const cache = UnifiedCache.getInstance();

      await cache.set("test:entity:1", { id: 1 }, 300);
      await cache.delete("test:entity:1");
      expect(await cache.get("test:entity:1")).toBeNull();

      await cache.set("test:entity:2", { id: 2 }, 300);
      await cache.clearPattern("test:entity:*");
      expect(await cache.get("test:entity:2")).toBeNull();

      // DB delete should never be invoked
      expect(mockDb.delete).not.toHaveBeenCalled();
    });
  });

  describe("FORCE_L2_CACHE Override", () => {
    it("should configure L2 as postgresCache when FORCE_L2_CACHE is 'true' in development", () => {
      process.env.NODE_ENV = "development";
      process.env.FORCE_L2_CACHE = "true";

      UnifiedCache._resetInstanceForTesting();
      const cache = UnifiedCache.getInstance();

      expect(cache.isL2Enabled()).toBe(true);
      expect(cache.getL2Provider()).toBe(postgresCache);
      expect(cache.getL2Provider() instanceof PostgresCacheProvider).toBe(true);
    });

    it("should configure L2 as postgresCache when FORCE_L2_CACHE is 'true' in test", () => {
      process.env.NODE_ENV = "test";
      process.env.FORCE_L2_CACHE = "true";

      UnifiedCache._resetInstanceForTesting();
      const cache = UnifiedCache.getInstance();

      expect(cache.isL2Enabled()).toBe(true);
      expect(cache.getL2Provider()).toBe(postgresCache);
      expect(cache.getL2Provider() instanceof PostgresCacheProvider).toBe(true);
    });
  });

  describe("Production Mode", () => {
    it("should configure L2 as postgresCache in production mode", () => {
      process.env.NODE_ENV = "production";
      delete process.env.FORCE_L2_CACHE;

      UnifiedCache._resetInstanceForTesting();
      const cache = UnifiedCache.getInstance();

      expect(cache.isL2Enabled()).toBe(true);
      expect(cache.getL2Provider()).toBe(postgresCache);
      expect(cache.getL2Provider() instanceof PostgresCacheProvider).toBe(true);
    });
  });

  describe("L1 Memory Cache Performance & Correctness", () => {
    it("should handle operations quickly and correctly without L2 egress", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.FORCE_L2_CACHE;

      UnifiedCache._resetInstanceForTesting();
      const cache = UnifiedCache.getInstance();

      const startTime = performance.now();
      for (let i = 0; i < 50; i++) {
        await cache.set(`perf:item:${i}`, { id: i, name: `item-${i}` }, 300);
      }

      for (let i = 0; i < 50; i++) {
        const item = await cache.get<{ id: number; name: string }>(`perf:item:${i}`);
        expect(item).toEqual({ id: i, name: `item-${i}` });
      }
      const duration = performance.now() - startTime;

      // 100 cache operations in memory must complete rapidly (< 100ms)
      expect(duration).toBeLessThan(100);

      const stats = cache.getStats();
      expect(stats.l1Hits).toBe(50);
      expect(stats.l2Hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(mockDb.select).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });
});
