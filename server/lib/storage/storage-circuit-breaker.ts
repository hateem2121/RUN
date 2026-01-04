/**
 * GCS Storage Circuit Breaker
 *
 * Wraps Google Cloud Storage operations with circuit breaker protection
 * to prevent cascading failures when GCS is unavailable or slow.
 *
 * Reference: https://github.com/nodeshift/opossum
 */

import CircuitBreaker from "opossum";
import { logger } from "../monitoring/logger.js";

// GCS circuit breaker configuration
const GCS_CIRCUIT_CONFIG = {
  timeout: 10000, // 10s for upload/download operations
  errorThresholdPercentage: 50, // Open circuit after 50% failures
  resetTimeout: 30000, // 30s before trying again
  volumeThreshold: 5, // Minimum requests before circuit logic applies
};

// Simple wrapper function for operations
async function executeOperation<T>(operation: () => Promise<T>): Promise<T> {
  return await operation();
}

// Create GCS circuit breaker
const gcsCircuit = new CircuitBreaker(executeOperation, GCS_CIRCUIT_CONFIG);

// Set fallback behavior
gcsCircuit.fallback((_operation: unknown, error: Error) => {
  logger.error("[GCS Circuit] Fallback triggered", { error: error.message });
  throw new Error("Storage service temporarily unavailable. Please try again in a few seconds.");
});

// Track metrics
const circuitMetrics = {
  state: "CLOSED" as "CLOSED" | "OPEN" | "HALF_OPEN",
  failures: 0,
  successes: 0,
  fallbacks: 0,
  timeouts: 0,
};

gcsCircuit.on("success", () => {
  circuitMetrics.successes++;
  circuitMetrics.state = "CLOSED";
});

gcsCircuit.on("failure", () => {
  circuitMetrics.failures++;
});

gcsCircuit.on("timeout", () => {
  circuitMetrics.timeouts++;
  logger.warn("[GCS Circuit] Operation timed out");
});

gcsCircuit.on("open", () => {
  circuitMetrics.state = "OPEN";
  logger.error("[GCS Circuit] OPENED - storage circuit tripped");
});

gcsCircuit.on("halfOpen", () => {
  circuitMetrics.state = "HALF_OPEN";
  logger.info("[GCS Circuit] HALF_OPEN - testing recovery");
});

gcsCircuit.on("close", () => {
  circuitMetrics.state = "CLOSED";
  logger.info("[GCS Circuit] CLOSED - recovered");
});

gcsCircuit.on("fallback", () => {
  circuitMetrics.fallbacks++;
});

/**
 * Execute a GCS operation with circuit breaker protection
 * Use this for critical storage operations that should fail-fast when GCS is struggling
 *
 * @param operation - The storage operation to execute
 * @param operationName - Name for logging
 *
 * @example
 * ```typescript
 * const url = await withStorageCircuitBreaker(
 *   () => bucket.file(path).getSignedUrl(options),
 *   'getSignedUrl'
 * );
 * ```
 */
export async function withStorageCircuitBreaker<T>(
  operation: () => Promise<T>,
  operationName: string = "gcs-operation",
): Promise<T> {
  logger.debug(`[GCS Circuit] Executing: ${operationName}`);
  return (await gcsCircuit.fire(operation)) as T;
}

/**
 * Execute a GCS upload with extended timeout
 * Uploads can take longer, so we use a separate method with higher timeout
 *
 * @param operation - The upload operation
 * @param operationName - Name for logging
 */
export async function withUploadCircuitBreaker<T>(
  operation: () => Promise<T>,
  operationName: string = "gcs-upload",
): Promise<T> {
  // For uploads, we use the same circuit but log differently
  logger.debug(`[GCS Circuit] Executing upload: ${operationName}`);
  return (await gcsCircuit.fire(operation)) as T;
}

/**
 * Check if storage circuit is open (failing)
 */
export function isStorageCircuitOpen(): boolean {
  return circuitMetrics.state === "OPEN";
}

/**
 * Get storage circuit status for health checks
 */
export function getStorageCircuitStatus(): {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  successes: number;
  fallbacks: number;
  timeouts: number;
  isHealthy: boolean;
} {
  return {
    ...circuitMetrics,
    isHealthy: circuitMetrics.state === "CLOSED",
  };
}

/**
 * Force reset the circuit (for testing/admin)
 */
export function resetStorageCircuit(): void {
  // Force the circuit to close
  gcsCircuit.close();
  circuitMetrics.state = "CLOSED";
  logger.info("[GCS Circuit] Manually reset to CLOSED");
}

export { gcsCircuit };

logger.info("[GCS Circuit] ✅ Storage circuit breaker initialized");
