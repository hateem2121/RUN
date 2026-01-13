/**
 * Database Connection Module
 * Handles Neon serverless HTTP connection setup
 */

import { type NeonQueryFunction, neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "../../../shared/schema.js";
import { database } from "../../config/environment.js";
import { logger } from "../monitoring/logger.js";

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
    sql = (() => Promise.resolve([])) as any;
  }
} else {
  sql = neon(database.url, {
    fullResults: false,
    fetchOptions: {
      cache: "no-store",
      keepalive: true,
    },
  });
}

export { sql };

/**
 * Standard Drizzle HTTP Database Instance
 */
export const db: NeonHttpDatabase<typeof schema> = drizzle(sql, {
  schema,
  casing: "snake_case",
  logger: process.env.NODE_ENV === "development",
});

export type Database = typeof db;

/**
 * Check database connectivity
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

export const closeDatabaseConnection = async () => {};
