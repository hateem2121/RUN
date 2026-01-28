/**
 * HTTP-BASED POSTGRESQL DATABASE CONNECTION
 * Simplified implementation using standard Neon Serverless driver patterns
 */

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NeonHttpQueryResultHKT } from "drizzle-orm/neon-http";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { err, ok, type Result } from "neverthrow";
import * as schema from "../shared/schema.js";
import { database } from "./config/environment.js";
import { DatabaseError } from "./lib/errors.js";
import { logger } from "./lib/monitoring/logger.js";

// Validate connection string presence
if (!database.url && process.env.NODE_ENV !== "test") {
  throw new Error("PROD_ERROR: DATABASE_URL is required but missing.");
}

const isTestMode = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
const enableRealDb = process.env.TEST_REAL_DB === "true";

let sql: NeonQueryFunction<boolean, boolean>;

const metrics = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  totalQueryTimeMs: 0,
  peakConcurrentQueries: 0,
  currentConcurrentQueries: 0,
  lastHealthCheckAt: new Date(),
  connectionPooling: database.url.includes("-pooler") ? "enabled" : "disabled",
};

if (isTestMode && !enableRealDb) {
  logger.info("[Database] Test mode - skipping real DB connection (Mock Mode)");

  if (process.env.TEST_MOCK_ERROR === "true") {
    logger.info("[Database] Mock Error Mode Enabled");
    sql = (() => Promise.reject(new Error("Mock Database Error"))) as any;
  } else {
    // Create a no-op SQL function for tests
    // Return empty array to simulate empty result set
    sql = (() => Promise.resolve([])) as any;
  }
} else {
  // Use standard Neon HTTP driver
  // Removing custom fetchOptions to rely on defaults
  sql = neon(database.url, {
    fullResults: false,
  });
}

// Wrap SQL function to track metrics (for both real and mock modes)
const internalSql = sql;
// Metrics wrapper temporarily removed due to incompatibility with Neon serverless driver in this environment
// TODO: Re-implement metrics wrapping compatible with NeonQueryFunction signature
 
/**
 * Standard Drizzle HTTP Database Instance
 * No custom proxies or circuit breakers - relying on platform resilience
 */

/**
 * Standard Drizzle HTTP Database Instance
 * No custom proxies or circuit breakers - relying on platform resilience
 */
export const db: NeonHttpDatabase<typeof schema> = drizzle(sql, {
  schema,
  casing: "snake_case",
  logger: process.env.NODE_ENV === "development", // Built-in query logging in dev
});

// Type alias for database client - supports both direct db access and transactions
export type DbClient =
  | NeonHttpDatabase<typeof schema>
  | PgTransaction<NeonHttpQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

export type Database = typeof db;

/**
 * Check database connectivity
 * Useful for healthchecks and startup verification
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    metrics.lastHealthCheckAt = new Date(); // Update health check time
    return true;
  } catch (error) {
    logger.error("[Database] Health check failed:", error);
    return false;
  }
}

/**
 * Wakeup function for "Cold Start" resilience
 * Retains simple retry logic for serverless wakeups
 */
export async function wakeupDatabase(
  retries = 3,
  delay = 1000,
): Promise<{ success: boolean; latency: number }> {
  const startTime = performance.now();

  for (let i = 0; i < retries; i++) {
    try {
      await sql`SELECT 1`;
      const latency = performance.now() - startTime;
      return { success: true, latency };
    } catch (error) {
      if (i === retries - 1) {
        logger.error(`[Database] Wakeup failed after ${retries} attempts`, error);
        return { success: false, latency: performance.now() - startTime };
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return { success: false, latency: 0 };
}

// Export metrics
export const getPoolMetrics = () => ({
  totalQueries: metrics.totalQueries,
  successfulQueries: metrics.successfulQueries,
  failedQueries: metrics.failedQueries,
  averageQueryTime:
    metrics.successfulQueries > 0
      ? Math.round(metrics.totalQueryTimeMs / metrics.successfulQueries)
      : 0,
  peakConcurrentQueries: metrics.peakConcurrentQueries,
  currentConcurrentQueries: metrics.currentConcurrentQueries,
  lastHealthCheckAt: metrics.lastHealthCheckAt,
  connectionPooling: metrics.connectionPooling,
});

export const closeDatabaseConnection = async () => {}; // No-op for HTTP

/**
 * Safe Database Query Wrapper
 * Puts a functional safety layer around Drizzle promises
 */
export async function safeQuery<T>(promise: Promise<T>): Promise<Result<T, DatabaseError>> {
  try {
    const data = await promise;
    return ok(data);
  } catch (error: any) {
    // Check for unique constraint violation (Postgres error 23505)
    if (error?.code === "23505") {
      // We might want a ConflictError, but for now wrap in DatabaseError with details
      return err(
        new DatabaseError("Duplicate entry violates unique constraint", {
          code: "23505",
          constraint: error.constraint,
          detail: error.detail,
        }),
      );
    }

    logger.error("[Database] Query failed:", error);
    return err(
      new DatabaseError("Database operation failed", {
        originalError: error instanceof Error ? error.message : String(error),
      }),
    );
  }
}

// Import additional error types for transaction support
import { ConflictError, DatabaseDeadlockError, DatabaseTimeoutError } from "./lib/errors.js";

/**
 * Safe Transaction Wrapper
 * Executes a callback within a database transaction with automatic rollback on error.
 *
 * Features:
 * - Automatic rollback on any error
 * - Proper error classification (deadlock, timeout, constraint violations)
 * - Type-safe Result return type
 *
 * @example
 * ```typescript
 * const result = await safeTransaction(async (tx) => {
 *   const user = await tx.insert(users).values({ name: "John" }).returning();
 *   await tx.insert(profiles).values({ userId: user[0].id, bio: "" });
 *   return user[0];
 * });
 *
 * if (result.isOk()) {
 *   console.log("User created:", result.value);
 * } else {
 *   console.error("Transaction failed:", result.error);
 * }
 * ```
 */
export async function safeTransaction<T>(
  callback: (tx: DbClient) => Promise<T>,
): Promise<
  Result<T, DatabaseError | ConflictError | DatabaseDeadlockError | DatabaseTimeoutError>
> {
  try {
    const result = await db.transaction(async (tx) => {
      return await callback(tx);
    });
    return ok(result);
  } catch (error: any) {
    const pgCode = error?.code;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Unique constraint violation (23505)
    if (pgCode === "23505") {
      return err(
        new ConflictError("Resource already exists", {
          code: pgCode,
          constraint: error.constraint,
          detail: error.detail,
        }),
      );
    }

    // Foreign key violation (23503)
    if (pgCode === "23503") {
      return err(
        new ConflictError("Referenced resource does not exist", {
          code: pgCode,
          constraint: error.constraint,
          detail: error.detail,
        }),
      );
    }

    // Deadlock detected (40P01)
    if (pgCode === "40P01") {
      logger.warn("[Database] Deadlock detected in transaction:", {
        error: errorMessage,
      });
      return err(
        new DatabaseDeadlockError("Transaction deadlock, please retry", {
          code: pgCode,
        }),
      );
    }

    // Serialization failure (40001) - also retryable
    if (pgCode === "40001") {
      logger.warn("[Database] Serialization failure in transaction:", {
        error: errorMessage,
      });
      return err(
        new DatabaseDeadlockError("Concurrent transaction conflict, please retry", {
          code: pgCode,
        }),
      );
    }

    // Query timeout
    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("canceling statement") ||
      pgCode === "57014"
    ) {
      return err(
        new DatabaseTimeoutError("Transaction timed out", {
          code: pgCode || "TIMEOUT",
        }),
      );
    }

    // Generic database error
    logger.error("[Database] Transaction failed:", error);
    return err(
      new DatabaseError("Transaction failed", {
        code: pgCode,
        originalError: errorMessage,
      }),
    );
  }
}
