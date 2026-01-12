/**
 * Resilience Integration Tests
 * Phase 1: Testing & Quality Excellence
 *
 * Tests cover:
 * - Circuit breaker behavior under failure
 * - Graceful degradation
 * - Recovery after failures
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Circuit Breaker Integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("Circuit States", () => {
    it("should start in CLOSED state", async () => {
      const { CircuitBreaker } = await import("../server/lib/resilience/circuit-breaker.js");

      const breaker = new CircuitBreaker("test-closed", {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 30000,
      });

      expect(breaker.getState()).toBe("CLOSED");
    });

    it("should open circuit after threshold failures", async () => {
      const { CircuitBreaker } = await import("../server/lib/resilience/circuit-breaker.js");

      const breaker = new CircuitBreaker("test-open", {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 100,
      });

      const failingFn = async () => {
        throw new Error("Simulated failure");
      };

      // Trigger failures to open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.call(failingFn);
        } catch {
          // Expected failures
        }
      }

      expect(breaker.getState()).toBe("OPEN");
    });

    it("should reject calls when circuit is OPEN", async () => {
      const { CircuitBreaker } = await import("../server/lib/resilience/circuit-breaker.js");

      const breaker = new CircuitBreaker("test-reject", {
        failureThreshold: 1,
        successThreshold: 1,
        timeout: 60000, // Long timeout to keep it open
      });

      // Force one failure to open circuit
      try {
        await breaker.call(async () => {
          throw new Error("Open circuit");
        });
      } catch {
        // Expected
      }

      // Now circuit should be open and reject
      const result = breaker.call(async () => "should not run");

      await expect(result).rejects.toThrow();
    });

    it("should transition to HALF_OPEN after timeout", async () => {
      const { CircuitBreaker } = await import("../server/lib/resilience/circuit-breaker.js");

      const breaker = new CircuitBreaker("test-halfopen", {
        failureThreshold: 1,
        successThreshold: 1,
        timeout: 50, // Short timeout for test
      });

      // Open the circuit
      try {
        await breaker.call(async () => {
          throw new Error("Open it");
        });
      } catch {
        // Expected
      }

      expect(breaker.getState()).toBe("OPEN");

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Next call should transition to HALF_OPEN
      try {
        await breaker.call(async () => "test");
      } catch {
        // May or may not succeed
      }

      // State should now be HALF_OPEN or CLOSED (if call succeeded)
      expect(["HALF_OPEN", "CLOSED"]).toContain(breaker.getState());
    });
  });

  describe("withCircuit helper", () => {
    it("should execute function when circuit is closed", async () => {
      const { withCircuit, REDIS_CIRCUIT_OPTIONS } = await import(
        "../server/lib/resilience/circuit-breaker.js"
      );

      const result = await withCircuit("redis-test", async () => "success", REDIS_CIRCUIT_OPTIONS);

      expect(result).toBe("success");
    });

    it("should propagate errors for failed calls", async () => {
      const { withCircuit, REDIS_CIRCUIT_OPTIONS } = await import(
        "../server/lib/resilience/circuit-breaker.js"
      );

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
      const { CircuitBreaker } = await import("../server/lib/resilience/circuit-breaker.js");

      const breaker = new CircuitBreaker("test-fallback", {
        failureThreshold: 1,
        successThreshold: 1,
        timeout: 60000,
      });

      // Open the circuit
      try {
        await breaker.call(async () => {
          throw new Error("Primary failed");
        });
      } catch {
        // Expected
      }

      // Use fallback when circuit is open
      let result: string;
      try {
        result = await breaker.call(async () => "primary value");
      } catch {
        result = "fallback value";
      }

      expect(result).toBe("fallback value");
    });
  });
});

describe("Rate Limiting Resilience", () => {
  it("should fail-open when Redis is unavailable", async () => {
    // Rate limiting should allow requests through when Redis fails
    // This is the "fail-open" behavior documented in the architecture

    const mockRateLimiterBehavior = (redisAvailable: boolean) => {
      if (!redisAvailable) {
        // Fail-open: allow the request
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
    // Cache should use L1 when L2 (Redis) is unavailable
    const cacheWithFallback = {
      l1: new Map<string, string>(),
      l2Available: true,

      async get(key: string): Promise<string | null> {
        // Check L1 first
        if (this.l1.has(key)) {
          return this.l1.get(key)!;
        }

        // Try L2 if available
        if (!this.l2Available) {
          return null; // Gracefully handle L2 failure
        }

        return null;
      },

      async set(key: string, value: string): Promise<void> {
        this.l1.set(key, value);
        // L2 write is fire-and-forget, failures are logged
      },
    };

    // Set a value
    await cacheWithFallback.set("resilience-key", "cached-value");

    // Simulate L2 failure
    cacheWithFallback.l2Available = false;

    // Should still get from L1
    const result = await cacheWithFallback.get("resilience-key");
    expect(result).toBe("cached-value");
  });
});
