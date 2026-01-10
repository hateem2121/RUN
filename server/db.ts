/**
 * HTTP-BASED POSTGRESQL DATABASE CONNECTION
 * Simplified implementation using standard Neon Serverless driver patterns
 */

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NeonHttpQueryResultHKT } from "drizzle-orm/neon-http";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { PgTransaction } from "drizzle-orm/pg-core";
import * as schema from "../shared/schema.js";
import { database } from "./config/environment.js";
import { err, ok, type Result } from "neverthrow";
import { DatabaseError } from "./lib/errors.js";
import { logger } from "./lib/monitoring/logger.js";


// Validate connection string presence
if (!database.url && process.env.NODE_ENV !== "test") {
  throw new Error("PROD_ERROR: DATABASE_URL is required but missing.");
}

const isTestMode = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
const enableRealDb = process.env.TEST_REAL_DB === "true";

let sql: NeonQueryFunction<boolean, boolean>;

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
  // fullResults: false is optimal for Drizzle performance
  sql = neon(database.url, {
    fullResults: false,
    fetchOptions: {
      // Standard fetch options for reliability
      cache: "no-store",
      keepalive: true,
    },
  });
}

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

// Export a stripped-down metrics object for compatibility with existing monitoring calls
// until those are fully refactored
export const getPoolMetrics = () => ({
  totalQueries: 0, // Deprecated
  successfulQueries: 0,
  failedQueries: 0,
  averageQueryTime: 0,
  peakConcurrentQueries: 0,
  currentConcurrentQueries: 0,
  lastHealthCheckAt: new Date(),
  connectionPooling: database.url.includes("-pooler") ? "enabled" : "disabled",
});

export const closeDatabaseConnection = async () => {}; // No-op for HTTP

/**
 * Safe Database Query Wrapper
 * Puts a functional safety layer around Drizzle promises
 */
export async function safeQuery<T>(
  promise: Promise<T>,
): Promise<Result<T, DatabaseError>> {
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

