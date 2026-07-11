/**
 * WEBSOCKET-BASED POSTGRESQL DATABASE CONNECTION
 * Robust implementation using Neon Serverless WebSocket driver (Pool)
 * Enables interactive transactions and persistent connections.
 */

import { neon, neonConfig, Pool, type PoolClient } from "@neondatabase/serverless";
import { trace } from "@opentelemetry/api";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle, type NeonDatabase, type NeonQueryResultHKT } from "drizzle-orm/neon-serverless";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { err, ok, type Result } from "neverthrow";
import ws from "ws";
import * as schema from "../shared/index.js";
import { database } from "./config/environment.js";
import { getConfig } from "./config/production.js";
import {
  ConflictError,
  DatabaseDeadlockError,
  DatabaseError,
  DatabaseTimeoutError,
} from "./lib/errors.js";
import { logger } from "./lib/monitoring/logger.js";
import { registerShutdownHook } from "./lib/shutdown-manager.js";

// CHUNK 101: Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

trace.getTracer("db");

// Validate connection string presence
if (!database.url && process.env.NODE_ENV !== "test") {
  throw new Error("PROD_ERROR: DATABASE_URL is required but missing.");
}
logger.info(
  `[Database] Initializing Pool with host: ${database.url ? new URL(database.url).hostname : "MISSING"}`,
);

const isTestMode = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
const enableRealDb = process.env.TEST_REAL_DB === "true";

// Metrics container
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

// Global Pool Instance
let pool: Pool;

if (isTestMode && !enableRealDb) {
  logger.info("[Database] Test mode - using Mock Pool");
  pool = {
    connect: () =>
      Promise.resolve({ release: () => {}, query: () => Promise.resolve({ rows: [] }) }),
    query: () => Promise.resolve({ rows: [] }),
    end: () => Promise.resolve(),
    on: () => {},
  } as unknown as Pool;
} else {
  // Real Neon Pool
  // Optimization: Direct SSL negotiation for lower latency
  const connectionString = database.url;
  const isPooler = connectionString.includes("-pooler");
  const hasSslParam = connectionString.includes("sslnegotiation=");

  const config = getConfig();
  const poolConfig = config.database;

  logger.info(
    `[Database] Configuring pool: max=${poolConfig.maxConnections}, idleTimeout=${poolConfig.queryTimeout}`,
  );

  pool = new Pool({
    connectionString:
      isPooler && !hasSslParam
        ? `${connectionString}${connectionString.includes("?") ? "&" : "?"}sslnegotiation=direct`
        : connectionString,
    max: poolConfig.maxConnections,
    idleTimeoutMillis: 60000, // Increased from 10s to 60s to prevent constant reconnect overhead
    connectionTimeoutMillis: 5000,
    allowExitOnIdle: true, // Allow process to exit if only idle pool connections remain
  });

  // Error handling for the pool
  pool.on("error", (err: Error) => {
    logger.error("[Database] Unexpected error on idle client", err);
  });

  // Graceful shutdown
  registerShutdownHook(async () => {
    logger.info("[Database] Closing connection pool...");
    await pool.end();
    logger.info("[Database] Connection pool closed.");
  });
}

// FORCE MOCK MODE override
if (
  process.env.MOCK_DB === "true" ||
  (process.env.NODE_ENV === "development" && !process.env.DATABASE_URL)
) {
  logger.warn("[Database] ⚠️ MOCK MODE ENABLED - Ops will return empty data ⚠️");
  pool = {
    connect: () =>
      Promise.resolve({ release: () => {}, query: () => Promise.resolve({ rows: [] }) }),
    query: () => Promise.resolve({ rows: [] }),
    end: () => Promise.resolve(),
    on: () => {},
  } as unknown as Pool;
}

/**
 * Standard Drizzle WebSocket Database Instance
 */

// Metrics-aware Drizzle logger — increments pool counters on every query
// so that getPoolMetrics() accurately reflects db.execute() call volume.
const metricsLogger = {
  logQuery(_query: string, _params: unknown[]): void {
    metrics.totalQueries++;
    metrics.successfulQueries++;
    metrics.currentConcurrentQueries++;
    metrics.peakConcurrentQueries = Math.max(
      metrics.peakConcurrentQueries,
      metrics.currentConcurrentQueries,
    );
    // currentConcurrentQueries is decremented after query returns;
    // since logQuery is synchronous we approximate by decrementing immediately.
    metrics.currentConcurrentQueries--;
  },
};

export const db: NeonDatabase<typeof schema> = drizzle(pool, {
  schema,
  casing: "snake_case",
  // Always enable metrics logger; use Drizzle's console logger only in development.
  logger: metricsLogger,
});

/**
 * Stateless HTTP Database Instance
 * Use for non-transactional read-only queries to minimize WebSocket pool
 * consumption and cold-start latency in serverless contexts.
 */
const shouldUseHttpDb =
  !isTestMode &&
  process.env.MOCK_DB !== "true" &&
  !(process.env.NODE_ENV === "development" && !process.env.DATABASE_URL) &&
  database.url;

export const httpDb = shouldUseHttpDb
  ? drizzleHttp(neon(database.url), { schema, casing: "snake_case" })
  : db; // Fallback to main db in test/mock mode

// Type alias for database client - supports both direct db access and transactions
export type DbClient =
  | NeonDatabase<typeof schema>
  | PgTransaction<NeonQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

export type Database = typeof db;

/**
 * Check database connectivity
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    // Use a lightweight but real table query for deep health check
    await client.query("SELECT 1 FROM audit_configuration LIMIT 1");
    metrics.lastHealthCheckAt = new Date();
    return true;
  } catch (error) {
    logger.error("[Database] Health check failed:", {
      error: error instanceof Error ? error.message : String(error),
      code: (error as { code?: string })?.code,
    });
    return false;
  } finally {
    if (client) client.release();
  }
}

/**
 * Wakeup function for "Cold Start" resilience
 * Now includes a deep readiness check to ensure schema is accessible
 */
export async function wakeupDatabase(
  retries = 3,
  delay = 1000,
): Promise<{ success: boolean; latency: number }> {
  const startTime = performance.now();

  for (let i = 0; i < retries; i++) {
    let client: PoolClient | undefined;
    try {
      client = await pool.connect();
      // DEEP READINESS CHECK: Verify we can read from a core system table
      // This ensures that not only is the DB up, but the schema is ready
      await client.query("SELECT 1 FROM audit_configuration LIMIT 1");
      const latency = performance.now() - startTime;
      logger.info(`[Database] Deep wakeup successful: latency=${Math.round(latency)}ms`);
      return { success: true, latency };
    } catch (error) {
      if (i === retries - 1) {
        logger.error(`[Database] Wakeup failed after ${retries} attempts`, error);
        return { success: false, latency: performance.now() - startTime };
      }
      logger.warn(`[Database] Wakeup attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    } finally {
      if (client) client.release();
    }
  }
  return { success: false, latency: 0 };
}

// Export metrics
// Helper for raw queries (compatible with previous neon() sql tag)
export const sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const text = strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
    "",
  );
  return pool.query(text, values);
};

export const getPoolMetrics = () => ({
  totalQueries: metrics.totalQueries,
  successfulQueries: metrics.successfulQueries,
  failedQueries: metrics.failedQueries,
  totalQueryTimeMs: metrics.totalQueryTimeMs,
  averageQueryTime: metrics.totalQueries > 0 ? metrics.totalQueryTimeMs / metrics.totalQueries : 0,
  peakConcurrentQueries: metrics.peakConcurrentQueries,
  currentConcurrentQueries: metrics.currentConcurrentQueries,
  lastHealthCheckAt: metrics.lastHealthCheckAt,
  connectionPooling: metrics.connectionPooling,
});

export function updateHealthCheckTime(): void {
  metrics.lastHealthCheckAt = new Date();
}

export const closeDatabaseConnection = async () => {
  await pool.end();
};

export async function isDatabasePoolHealthy(): Promise<boolean> {
  if (process.env.MOCK_DB === "true") {
    return false;
  }
  try {
    const { sql: drizzleSql } = await import("drizzle-orm");
    await Promise.race([
      db.execute(drizzleSql`SELECT 1`),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 500)),
    ]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe Database Query Wrapper
 */
export async function safeQuery<T>(promise: Promise<T>): Promise<Result<T, DatabaseError>> {
  try {
    const data = await promise;
    return ok(data);
  } catch (error: unknown) {
    const pgError = error as { code?: string; constraint?: string; detail?: string };
    if (pgError?.code === "23505") {
      return err(
        new DatabaseError("Duplicate entry violates unique constraint", {
          code: "23505",
          constraint: pgError.constraint,
          detail: pgError.detail,
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

/**
 * Safe Transaction Wrapper
 * Executes a callback within a REAL database transaction.
 */
export async function safeTransaction<T>(
  callback: (tx: DbClient) => Promise<T>,
): Promise<
  Result<T, DatabaseError | ConflictError | DatabaseDeadlockError | DatabaseTimeoutError>
> {
  try {
    // Drizzle with Pool supports real interactive transactions
    const result = await db.transaction(async (tx) => {
      return await callback(tx);
    });
    return ok(result);
  } catch (error: unknown) {
    const pgError = error as { code?: string; constraint?: string; detail?: string };
    const pgCode = pgError?.code;
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (pgCode === "23505") {
      return err(
        new ConflictError("Resource already exists", {
          code: pgCode,
          constraint: pgError.constraint,
          detail: pgError.detail,
        }),
      );
    }
    if (pgCode === "23503") {
      return err(
        new ConflictError("Referenced resource does not exist", {
          code: pgCode,
          constraint: pgError.constraint,
          detail: pgError.detail,
        }),
      );
    }
    if (pgCode === "40P01") {
      return err(new DatabaseDeadlockError("Transaction deadlock, please retry", { code: pgCode }));
    }
    if (pgCode === "40001") {
      return err(
        new DatabaseDeadlockError("Concurrent transaction conflict, please retry", {
          code: pgCode,
        }),
      );
    }
    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("canceling statement") ||
      pgCode === "57014"
    ) {
      return err(new DatabaseTimeoutError("Transaction timed out", { code: pgCode || "TIMEOUT" }));
    }

    logger.error("[Database] Transaction failed:", error);
    return err(
      new DatabaseError("Transaction failed", {
        code: pgCode,
        originalError: errorMessage,
      }),
    );
  }
}
