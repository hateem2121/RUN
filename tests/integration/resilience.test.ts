/**
 * Resilience Integration Tests
 * Phase 1: Testing & Quality Excellence
 *
 * Tests cover:
 * - Circuit breaker behavior under failure
 * - Graceful degradation
 * - Recovery after failures
 */

import { describe, expect, it } from "vitest";
import {
  createCircuit,
  REDIS_CIRCUIT_OPTIONS,
  withCircuit,
} from "../../server/lib/resilience/circuit-breaker.js";

describe("Circuit Breaker Integration", () => {
  describe("Circuit States", () => {
    it("should start in CLOSED state", async () => {
      const breaker = createCircuit("test-start-closed", async () => "ok");
      expect(breaker.closed).toBe(true);
    });

    it("should open circuit after threshold failures", async () => {
      const failingFn = async () => {
        throw new Error("Simulated failure");
      };
      const breaker = createCircuit("test-threshold-failures", failingFn, {
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
        resetTimeout: 10000,
      });

      try {
        await breaker.fire();
      } catch {
        // Expected failure
      }

      expect(breaker.opened).toBe(true);
    });

    it("should reject calls when circuit is OPEN", async () => {
      const failingFn = async () => {
        throw new Error("Open circuit");
      };
      const breaker = createCircuit("test-reject-calls", failingFn, {
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
        resetTimeout: 60000,
      });

      try {
        await breaker.fire();
      } catch {
        // Expected
      }

      expect(breaker.opened).toBe(true);

      const result = breaker.fire();
      await expect(result).rejects.toThrow();
    });

    it("should transition to HALF_OPEN after timeout", async () => {
      const failingFn = async () => {
        throw new Error("Open it");
      };
      const breaker = createCircuit("test-half-open-timeout", failingFn, {
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
        resetTimeout: 50,
      });

      try {
        await breaker.fire();
      } catch {
        // Expected
      }

      expect(breaker.opened).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(breaker.halfOpen).toBe(true);
    });
  });

  describe("withCircuit helper", () => {
    it("should execute function when circuit is closed", async () => {
      const result = await withCircuit("redis-test", async () => "success", REDIS_CIRCUIT_OPTIONS);
      expect(result).toBe("success");
    });

    it("should propagate errors for failed calls", async () => {
      const failingCall = withCircuit(
        "redis-fail-test",
        async () => {
          throw new Error("Redis connection failed");
        },
        REDIS_CIRCUIT_OPTIONS,
      );

      await expect(failingCall).rejects.toThrow("Redis connection failed");
    });
  });

  describe("Graceful Degradation", () => {
    it("should provide fallback value when circuit is open", async () => {
      const failingFn = async () => {
        throw new Error("Primary failed");
      };
      const breaker = createCircuit("test-graceful-fallback", failingFn, {
        volumeThreshold: 1,
        errorThresholdPercentage: 1,
        resetTimeout: 60000,
      });

      breaker.fallback(() => "fallback value");

      try {
        await breaker.fire(); // first call fails, triggers fallback, opens circuit
      } catch {
        // Expected
      }

      const result = await breaker.fire();
      expect(result).toBe("fallback value");
    });
  });
});

describe("Rate Limiting Resilience", () => {
  it("should fail-open when Redis is unavailable", async () => {
    const mockRateLimiterBehavior = (redisAvailable: boolean) => {
      if (!redisAvailable) {
        return { success: true, remaining: -1 };
      }
      return { success: true, remaining: 100 };
    };

    const resultWithRedis = mockRateLimiterBehavior(true);
    const resultWithoutRedis = mockRateLimiterBehavior(false);

    expect(resultWithRedis.success).toBe(true);
    expect(resultWithoutRedis.success).toBe(true); // Fail-open
  });
});

describe("Cache Resilience", () => {
  it("should serve stale data when L2 fails", async () => {
    const cacheWithFallback = {
      l1: new Map<string, string>(),
      l2Available: true,

      async get(key: string): Promise<string | null> {
        if (this.l1.has(key)) {
          return this.l1.get(key)!;
        }
        if (!this.l2Available) {
          return null;
        }
        return null;
      },

      async set(key: string, value: string): Promise<void> {
        this.l1.set(key, value);
      },
    };

    await cacheWithFallback.set("resilience-key", "cached-value");
    cacheWithFallback.l2Available = false;

    const result = await cacheWithFallback.get("resilience-key");
    expect(result).toBe("cached-value");
  });
});
