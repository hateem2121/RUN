/**
 * Circuit Breaker Tests
 * Tests for the circuit breaker pattern implementation
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createCircuit,
  DB_CIRCUIT_OPTIONS,
  getCircuitMetrics,
  REDIS_CIRCUIT_OPTIONS,
  resetCircuit,
} from "../../server/lib/resilience/circuit-breaker";

describe("Circuit Breaker", () => {
  describe("createCircuit", () => {
    it("should create a new circuit breaker", () => {
      const fn = async () => "success";
      const circuit = createCircuit("test-create", fn);

      expect(circuit).toBeDefined();
      expect(circuit.fire).toBeDefined();
    });

    it("should return existing circuit if name already used", () => {
      const fn = async () => "success";
      const circuit1 = createCircuit("test-singleton", fn);
      const circuit2 = createCircuit("test-singleton", fn);

      expect(circuit1).toBe(circuit2);
    });

    it("should execute function successfully", async () => {
      const fn = async (x: number) => x * 2;
      const circuit = createCircuit("test-exec", fn);

      const result = await circuit.fire(5);
      expect(result).toBe(10);
    });
  });

  describe("metrics tracking", () => {
    beforeEach(() => {
      resetCircuit("test-metrics");
    });

    it("should track successful calls", async () => {
      const fn = async () => "ok";
      const circuit = createCircuit("test-metrics", fn);

      await circuit.fire();
      await circuit.fire();
      await circuit.fire();

      const metrics = getCircuitMetrics();
      const testMetric = metrics.find((m) => m.name === "test-metrics");

      expect(testMetric).toBeDefined();
      expect(testMetric?.successes).toBe(3);
      expect(testMetric?.state).toBe("CLOSED");
    });

    it("should track failed calls", async () => {
      const fn = async () => {
        throw new Error("fail");
      };
      const circuit = createCircuit("test-failures", fn, {
        volumeThreshold: 1,
        errorThresholdPercentage: 50,
      });

      try {
        await circuit.fire();
      } catch {
        // Expected
      }

      const metrics = getCircuitMetrics();
      const testMetric = metrics.find((m) => m.name === "test-failures");

      expect(testMetric).toBeDefined();
      expect(testMetric?.failures).toBeGreaterThanOrEqual(1);
    });
  });

  describe("resetCircuit", () => {
    it("should reset circuit state and metrics", async () => {
      const fn = async () => "ok";
      const circuit = createCircuit("test-reset", fn);

      await circuit.fire();
      await circuit.fire();

      let metrics = getCircuitMetrics();
      let testMetric = metrics.find((m) => m.name === "test-reset");
      expect(testMetric?.successes).toBe(2);

      resetCircuit("test-reset");

      metrics = getCircuitMetrics();
      testMetric = metrics.find((m) => m.name === "test-reset");
      expect(testMetric?.successes).toBe(0);
      expect(testMetric?.failures).toBe(0);
      expect(testMetric?.state).toBe("CLOSED");
    });

    it("should return false for non-existent circuit", () => {
      const result = resetCircuit("non-existent-circuit");
      expect(result).toBe(false);
    });
  });

  describe("pre-configured options", () => {
    it("should have correct DB circuit options", () => {
      expect(DB_CIRCUIT_OPTIONS.timeout).toBe(10000);
      expect(DB_CIRCUIT_OPTIONS.volumeThreshold).toBe(5);
    });

    it("should have correct Redis circuit options", () => {
      expect(REDIS_CIRCUIT_OPTIONS.timeout).toBe(2000);
      expect(REDIS_CIRCUIT_OPTIONS.errorThresholdPercentage).toBe(60);
    });
  });
});
