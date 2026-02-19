import { EventEmitter } from "events";
import { logger } from "./monitoring/logger.js";

type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time in ms before trying to close (HALF_OPEN)
  requestTimeout?: number; // Optional request timeout
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitBreakerState = "CLOSED";
  private failureCount = 0;
  private nextAttempt = Date.now();
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly requestTimeout: number;

  constructor(options: CircuitBreakerOptions) {
    super();
    this.failureThreshold = options.failureThreshold;
    this.resetTimeout = options.resetTimeout;
    this.requestTimeout = options.requestTimeout || 10000;
  }

  public async fire<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() > this.nextAttempt) {
        this.state = "HALF_OPEN";
        logger.info("[CircuitBreaker] Entering HALF_OPEN state, testing service...");
      } else {
        const timeLeft = Math.ceil((this.nextAttempt - Date.now()) / 1000);
        throw new Error(`Circuit is OPEN. Service unavailable. Retry in ${timeLeft}s`);
      }
    }

    try {
      const result = await this.executeAction(action);
      return this.success(result);
    } catch (error) {
      return this.failure(error);
    }
  }

  private async executeAction<T>(action: () => Promise<T>): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`CircuitBreaker: Request timed out after ${this.requestTimeout}ms`));
      }, this.requestTimeout);
    });

    try {
      const result = await Promise.race([action(), timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  private success<T>(result: T): T {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      logger.info("[CircuitBreaker] Service recovered, circuit CLOSED");
      this.emit("close");
    }
    return result;
  }

  private failure(error: any): never {
    this.failureCount++;

    // Log appropriate error level
    if (this.state === "HALF_OPEN" || this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.error(
        `[CircuitBreaker] Threshold reached. Circuit OPENed for ${this.resetTimeout}ms`,
        {
          error: error.message,
        },
      );
      this.emit("open");
    } else {
      logger.warn(
        `[CircuitBreaker] Failure recorded (${this.failureCount}/${this.failureThreshold})`,
        {
          error: error.message,
        },
      );
    }

    throw error;
  }

  public getState(): CircuitBreakerState {
    return this.state;
  }
}
