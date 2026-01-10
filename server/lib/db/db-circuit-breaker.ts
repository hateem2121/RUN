import { logger } from "../monitoring/logger.js";

/**
 * 🔒 Database Circuit Breaker - Phase 1 Performance Optimization
 *
 * Prevents cascading failures by detecting database issues and failing fast
 * Based on AppStorageService circuit breaker pattern with database-specific error handling
 */

// Circuit breaker states
export const CircuitState = {
  CLOSED: "CLOSED", // Normal operation
  OPEN: "OPEN", // Blocking requests
  HALF_OPEN: "HALF_OPEN", // Testing if database recovered
} as const;

export type CircuitState = (typeof CircuitState)[keyof typeof CircuitState];

interface CircuitBreakerMetrics {
  queries: {
    count: number;
    totalDuration: number;
    retries: number;
    failures: number;
  };
  circuitBreaker: {
    stateChanges: number;
    lastStateChange: Date | null;
    totalFailures: number;
    totalSuccesses: number;
  };
}

export class DatabaseCircuitBreaker {
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  // Circuit breaker configuration
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private readonly FAILURE_THRESHOLD = 5; // Open circuit after 5 failures
  private readonly SUCCESS_THRESHOLD = 2; // Close circuit after 2 successes
  private readonly TIMEOUT_DURATION = 30000; // 30 seconds before trying again
  private readonly HALF_OPEN_MAX_REQUESTS = 3; // Max concurrent requests in HALF_OPEN state
  private halfOpenRequestCount = 0;

  // Performance metrics tracking
  private metrics: CircuitBreakerMetrics = {
    queries: { count: 0, totalDuration: 0, retries: 0, failures: 0 },
    circuitBreaker: {
      stateChanges: 0,
      lastStateChange: null,
      totalFailures: 0,
      totalSuccesses: 0,
    },
  };

  constructor() {
    logger.info(
      `DatabaseCircuitBreaker initialized with retry logic (max ${this.MAX_RETRIES} attempts) and circuit breaker`,
    );
  }

  /**
   * Execute a database query with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    options?: { isIdempotent?: boolean },
  ): Promise<T> {
    // Check circuit breaker before attempting operation
    this.canProceedWithRequest(operationName);

    const isIdempotent = options?.isIdempotent ?? true;
    const isHalfOpen = this.circuitState === CircuitState.HALF_OPEN;
    let lastError: Error | null = null;
    let retryCount = 0;

    try {
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          // PERFORMANCE INSTRUMENTATION: Measure total operation time (TLS connection + query execution)
          // Neon HTTP driver creates new connection per query internally - cannot separate timing
          const operationStartTime = Date.now();
          const result = await operation();
          const operationDuration = Date.now() - operationStartTime;

          // Structured logging for performance analysis
          logger.info(`[DbCircuitBreaker] ${operationName}`, {
            durationMs: operationDuration,
            attempt,
            isRetry: retryCount > 0,
            timestamp: new Date().toISOString(),
          });

          // Track query metrics for aggregation
          this.metrics.queries.count++;
          this.metrics.queries.totalDuration += operationDuration;

          // Track retry metrics if retries occurred
          if (retryCount > 0) {
            this.trackRetries(operationName, retryCount);
          }

          // Record success for circuit breaker
          this.recordSuccess(operationName);

          return result;
        } catch (error) {
          lastError = error as Error;
          const isTransientError = this.isTransientError(error);

          // In HALF_OPEN state, fail immediately without retries to protect the system
          if (isHalfOpen) {
            if (retryCount > 0) {
              this.trackRetries(operationName, retryCount);
            }
            this.recordFailure(operationName, error as Error);
            throw error;
          }

          // NON-IDEMPOTENT SAFETY: Never retry non-idempotent operations (writes)
          if (!isIdempotent) {
            logger.warn(
              `🛑 ${operationName} failed, not retrying (non-idempotent): ${(error as Error).message}`,
            );
            this.recordFailure(operationName, error as Error);
            throw error;
          }

          if (attempt === this.MAX_RETRIES || !isTransientError) {
            if (retryCount > 0) {
              this.trackRetries(operationName, retryCount);
            }
            // Record failure for circuit breaker on final attempt or non-transient error
            this.recordFailure(operationName, error as Error);
            throw error;
          }

          retryCount++;
          const delay = this.INITIAL_RETRY_DELAY * 2 ** (attempt - 1);
          logger.warn(
            `⚠️ ${operationName} failed (attempt ${attempt}/${this.MAX_RETRIES}), retrying in ${delay}ms: ${(error as Error).message}`,
          );

          await this.sleep(delay);
        }
      }

      // Should never reach here, but just in case
      if (lastError) {
        if (retryCount > 0) {
          this.trackRetries(operationName, retryCount);
        }
        this.recordFailure(operationName, lastError);
        throw lastError;
      }

      throw new Error("Unexpected: No error recorded but retries exhausted");
    } finally {
      // Decrement HALF_OPEN request counter on completion (success or failure)
      if (isHalfOpen && this.halfOpenRequestCount > 0) {
        this.halfOpenRequestCount--;
      }
    }
  }

  /**
   * Check if error is a client error (4xx) - should NOT trigger circuit breaker
   */
  private isClientError(error: unknown): boolean {
    const errorMessage =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message.toLowerCase()
        : "";
    const errorCode =
      error && typeof error === "object" && "code" in error ? error.code : undefined;

    // Database-specific client errors that don't indicate health issues
    return (
      errorMessage.includes("unique constraint") ||
      errorMessage.includes("foreign key") ||
      errorMessage.includes("not null constraint") ||
      errorMessage.includes("invalid input syntax") ||
      errorMessage.includes("syntax error") ||
      errorCode === "23505" || // unique_violation
      errorCode === "23503" || // foreign_key_violation
      errorCode === "23502" || // not_null_violation
      errorCode === "22P02" || // invalid_text_representation
      errorCode === "42601" // syntax_error
    );
  }

  /**
   * Check if error is transient and should be retried
   */
  private isTransientError(error: unknown): boolean {
    const errorMessage =
      error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message.toLowerCase()
        : "";
    const errorCode =
      error && typeof error === "object" && "code" in error ? error.code : undefined;

    // Retry on network errors, timeouts, and temporary database issues
    return (
      errorMessage.includes("network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("econnreset") ||
      errorMessage.includes("econnrefused") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("deadlock") ||
      errorMessage.includes("lock timeout") ||
      errorMessage.includes("too many connections") ||
      errorCode === "ECONNRESET" ||
      errorCode === "ECONNREFUSED" ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "08006" || // connection_failure
      errorCode === "08001" || // sqlclient_unable_to_establish_sqlconnection
      errorCode === "40P01" || // deadlock_detected
      errorCode === "55P03" // lock_not_available
    );
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if circuit breaker allows request
   */
  private canProceedWithRequest(operationName: string): void {
    if (this.circuitState === CircuitState.OPEN) {
      const now = Date.now();
      const timeSinceLastFailure = this.lastFailureTime ? now - this.lastFailureTime : Infinity;

      if (timeSinceLastFailure >= this.TIMEOUT_DURATION) {
        // Move to HALF_OPEN state to test if database recovered
        this.circuitState = CircuitState.HALF_OPEN;
        this.halfOpenRequestCount = 0;
        this.metrics.circuitBreaker.stateChanges++;
        this.metrics.circuitBreaker.lastStateChange = new Date();
        logger.warn(
          `🔄 Circuit breaker moved to HALF_OPEN state for ${operationName} (testing database recovery)`,
        );
      } else {
        const remainingTime = Math.ceil((this.TIMEOUT_DURATION - timeSinceLastFailure) / 1000);
        throw new Error(`Circuit breaker OPEN: Database unavailable. Retry in ${remainingTime}s`);
      }
    }

    if (this.circuitState === CircuitState.HALF_OPEN) {
      if (this.halfOpenRequestCount >= this.HALF_OPEN_MAX_REQUESTS) {
        throw new Error(
          `Circuit breaker HALF_OPEN: Too many concurrent requests during database recovery`,
        );
      }
      this.halfOpenRequestCount++;
    }
  }

  /**
   * Record successful operation
   */
  private recordSuccess(_operationName: string): void {
    this.metrics.circuitBreaker.totalSuccesses++;

    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.successCount++;
      logger.info(
        `✅ Circuit breaker: Success ${this.successCount}/${this.SUCCESS_THRESHOLD} in HALF_OPEN state`,
      );

      if (this.successCount >= this.SUCCESS_THRESHOLD) {
        this.circuitState = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.halfOpenRequestCount = 0;
        this.metrics.circuitBreaker.stateChanges++;
        this.metrics.circuitBreaker.lastStateChange = new Date();
        logger.info(`✅ Circuit breaker CLOSED: Database service recovered`);
      }
    } else if (this.circuitState === CircuitState.CLOSED) {
      // Reset failure count on success
      if (this.failureCount > 0) {
        this.failureCount = 0;
      }
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(operationName: string, error: Error): void {
    // Skip circuit breaker logic for client errors - these don't indicate database health issues
    if (this.isClientError(error)) {
      logger.debug(`[Circuit Breaker] Skipping client error - not a database health issue`);
      return;
    }

    this.lastFailureTime = Date.now();
    // Track every failure, not just state transitions
    this.metrics.circuitBreaker.totalFailures++;

    if (this.circuitState === CircuitState.HALF_OPEN) {
      // Failure during recovery - go back to OPEN
      this.circuitState = CircuitState.OPEN;
      this.successCount = 0;
      this.halfOpenRequestCount = 0;
      this.metrics.circuitBreaker.stateChanges++;
      this.metrics.circuitBreaker.lastStateChange = new Date();
      logger.error(
        `❌ Circuit breaker moved to OPEN: Database recovery failed for ${operationName}`,
      );
    } else if (this.circuitState === CircuitState.CLOSED) {
      this.failureCount++;
      logger.warn(
        `⚠️ Circuit breaker: Failure ${this.failureCount}/${this.FAILURE_THRESHOLD} for ${operationName}`,
      );

      if (this.failureCount >= this.FAILURE_THRESHOLD) {
        this.circuitState = CircuitState.OPEN;
        this.metrics.circuitBreaker.stateChanges++;
        this.metrics.circuitBreaker.lastStateChange = new Date();
        logger.error(
          `🚨 Circuit breaker OPEN: Database unavailable after ${this.FAILURE_THRESHOLD} failures`,
        );
      }
    }
  }

  /**
   * Track retries for metrics
   */
  private trackRetries(operationName: string, retryCount: number): void {
    this.metrics.queries.retries += retryCount;
    logger.debug(`📊 [Metrics] ${operationName} required ${retryCount} retries`);
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      queries: { ...this.metrics.queries },
      circuitBreaker: { ...this.metrics.circuitBreaker },
    };
  }

  /**
   * Get current circuit state
   */
  getState(): string {
    return this.circuitState;
  }
}

// Export singleton instance
export const dbCircuitBreaker = new DatabaseCircuitBreaker();
