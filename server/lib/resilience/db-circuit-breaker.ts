/**
 * Database Circuit Breaker Integration
 * Wraps database operations with circuit breaker protection
 *
 * Reference: https://martinfowler.com/bliki/CircuitBreaker.html
 */

import CircuitBreaker from "opossum";
import { logger } from "../monitoring/logger.js";

// Helper to enforce timeouts
async function withQueryTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  operationName: string,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation '${operationName}' timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([operation(), timeoutPromise]);
}

// Database circuit breaker configuration
const DB_CIRCUIT_CONFIG = {
  timeout: 10000, // 10s for DB operations
  errorThresholdPercentage: 50,
  resetTimeout: 30000, // 30s before trying again
  volumeThreshold: 5,
};

// Simple wrapper function for operations
async function executeOperation<T>(operation: () => Promise<T>): Promise<T> {
  return await operation();
}

// Create database circuit breaker
const dbCircuit = new CircuitBreaker(executeOperation, DB_CIRCUIT_CONFIG);

// Set fallback behavior
dbCircuit.fallback((_operation: unknown, error: Error) => {
  logger.error("[DB Circuit] Fallback triggered", { error: error.message });
  throw new Error("Database temporarily unavailable. Please try again in a few seconds.");
});

// Track metrics
const circuitMetrics = {
  state: "CLOSED" as "CLOSED" | "OPEN" | "HALF_OPEN",
  failures: 0,
  successes: 0,
  fallbacks: 0,
};

dbCircuit.on("success", () => {
  circuitMetrics.successes++;
  circuitMetrics.state = "CLOSED";
});

dbCircuit.on("failure", () => {
  circuitMetrics.failures++;
});

dbCircuit.on("open", () => {
  circuitMetrics.state = "OPEN";
  logger.error("[DB Circuit] OPENED - database circuit tripped");
});

dbCircuit.on("halfOpen", () => {
  circuitMetrics.state = "HALF_OPEN";
  logger.info("[DB Circuit] HALF_OPEN - testing recovery");
});

dbCircuit.on("close", () => {
  circuitMetrics.state = "CLOSED";
  logger.info("[DB Circuit] CLOSED - recovered");
});

dbCircuit.on("fallback", () => {
  circuitMetrics.fallbacks++;
});

/**
 * Execute a database operation with circuit breaker protection
 * Use this for critical operations that should fail-fast when DB is struggling
 *
 * @param operation - The database operation to execute
 * @param operationName - Name for logging
 * @param timeoutMs - Query timeout in milliseconds (default 5000)
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  operationName: string = "db-operation",
  timeoutMs: number = 5000,
): Promise<T> {
  return (await dbCircuit.fire(async () => {
    return await withQueryTimeout(operation, timeoutMs, operationName);
  })) as T;
}

/**
 * Check if database circuit is open (failing)
 */
export function isDatabaseCircuitOpen(): boolean {
  return circuitMetrics.state === "OPEN";
}

/**
 * Get database circuit status for health checks
 */
export function getDatabaseCircuitStatus(): {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  successes: number;
  fallbacks: number;
} {
  return { ...circuitMetrics };
}

export { dbCircuit };
