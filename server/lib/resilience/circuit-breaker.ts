/**
 * Circuit Breaker Implementation
 * Protects external services (DB, Redis, External APIs) from cascade failures
 *
 * Reference: https://nodeshift.dev/opossum/
 */

import CircuitBreaker from "opossum";
import { logger } from "../monitoring/logger.js";

// Circuit breaker configuration type
interface CircuitBreakerConfig {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  volumeThreshold: number;
  rollingCountTimeout?: number | undefined;
  rollingCountBuckets?: number | undefined;
}

// Default circuit breaker options
const DEFAULT_OPTIONS: CircuitBreakerConfig = {
  timeout: 5000, // 5s timeout for operations
  errorThresholdPercentage: 50, // Open circuit after 50% failures
  resetTimeout: 30000, // Try again after 30s
  volumeThreshold: 10, // Minimum requests before tripping
  rollingCountTimeout: 10000, // Rolling window for failure calculation
  rollingCountBuckets: 10, // Number of buckets in rolling window
};

// Circuit breaker instances
const circuits = new Map<string, CircuitBreaker>();

// Circuit state metrics
interface CircuitMetrics {
  name: string;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  successes: number;
  fallbacks: number;
  timeouts: number;
  lastFailure?: Date;
}

const metricsStore: Map<string, CircuitMetrics> = new Map();

/**
 * Create a circuit breaker for a specific service
 */
export function createCircuit<TResult>(
  name: string,
  fn: (...args: unknown[]) => Promise<TResult>,
  options: Partial<CircuitBreakerConfig> = {},
): CircuitBreaker {
  const existingCircuit = circuits.get(name);
  if (existingCircuit) {
    return existingCircuit;
  }

  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const circuit = new CircuitBreaker(fn, mergedOptions);

  // Initialize metrics
  metricsStore.set(name, {
    name,
    state: "CLOSED",
    failures: 0,
    successes: 0,
    fallbacks: 0,
    timeouts: 0,
  });

  // Event handlers for observability
  circuit.on("success", () => {
    const metrics = metricsStore.get(name);
    if (metrics) {
      metrics.successes++;
      metrics.state = "CLOSED";
    }
  });

  circuit.on("failure", (error: Error) => {
    const metrics = metricsStore.get(name);
    if (metrics) {
      metrics.failures++;
      metrics.lastFailure = new Date();
    }
    logger.warn(`[CircuitBreaker] ${name} failure:`, { error: error.message });
  });

  circuit.on("timeout", () => {
    const metrics = metricsStore.get(name);
    if (metrics) {
      metrics.timeouts++;
    }
    logger.warn(`[CircuitBreaker] ${name} timeout`);
  });

  circuit.on("open", () => {
    const metrics = metricsStore.get(name);
    if (metrics) {
      metrics.state = "OPEN";
    }
    logger.error(`[CircuitBreaker] ${name} OPENED - circuit tripped`);
  });

  circuit.on("halfOpen", () => {
    const metrics = metricsStore.get(name);
    if (metrics) {
      metrics.state = "HALF_OPEN";
    }
    logger.info(`[CircuitBreaker] ${name} HALF_OPEN - testing recovery`);
  });

  circuit.on("close", () => {
    const metrics = metricsStore.get(name);
    if (metrics) {
      metrics.state = "CLOSED";
    }
    logger.info(`[CircuitBreaker] ${name} CLOSED - recovered`);
  });

  circuit.on("fallback", () => {
    const metrics = metricsStore.get(name);
    if (metrics) {
      metrics.fallbacks++;
    }
  });

  circuits.set(name, circuit);
  logger.info(`[CircuitBreaker] Created circuit: ${name}`);

  return circuit;
}

/**
 * Get all circuit metrics for monitoring
 */
export function getCircuitMetrics(): CircuitMetrics[] {
  return Array.from(metricsStore.values());
}

/**
 * Get specific circuit by name
 */
export function getCircuit(name: string): CircuitBreaker | undefined {
  return circuits.get(name);
}

/**
 * Reset a specific circuit (for testing/recovery)
 */
export function resetCircuit(name: string): boolean {
  const circuit = circuits.get(name);
  if (circuit) {
    circuit.close();
    const metrics = metricsStore.get(name);
    if (metrics) {
      metrics.state = "CLOSED";
      metrics.failures = 0;
      metrics.successes = 0;
      metrics.fallbacks = 0;
      metrics.timeouts = 0;
    }
    logger.info(`[CircuitBreaker] ${name} manually reset`);
    return true;
  }
  return false;
}

// Pre-configured options for common services

/**
 * Database Circuit Breaker config
 * Higher timeout for complex queries
 */
export const DB_CIRCUIT_OPTIONS: Partial<CircuitBreakerConfig> = {
  timeout: 10000, // 10s for DB operations
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5,
};

/**
 * Redis Circuit Breaker config
 * Lower timeout as Redis should be fast
 */
export const REDIS_CIRCUIT_OPTIONS: Partial<CircuitBreakerConfig> = {
  timeout: 2000, // 2s for Redis
  errorThresholdPercentage: 60,
  resetTimeout: 15000,
  volumeThreshold: 10,
};

/**
 * External API Circuit Breaker config
 * Standard timeout with higher threshold
 */
export const EXTERNAL_API_CIRCUIT_OPTIONS: Partial<CircuitBreakerConfig> = {
  timeout: 5000,
  errorThresholdPercentage: 40,
  resetTimeout: 60000, // Wait longer before retrying external APIs
  volumeThreshold: 5,
};
