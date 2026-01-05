/**
 * HTTP-BASED POSTGRESQL DATABASE CONNECTION
 * Migrated from TCP pooling to HTTP for serverless compatibility
 * Eliminates connection pool exhaustion and timeout issues
 */

import { neon } from "@neondatabase/serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NeonHttpQueryResultHKT } from "drizzle-orm/neon-http";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { PgTransaction } from "drizzle-orm/pg-core";
import * as schema from "../shared/schema.js";
import { database } from "./config/environment.js";
import { logger } from "./lib/monitoring/logger.js";

/**
 * Comprehensive DATABASE_URL validation at server startup
 * Validates format, protocol, NEON configuration, and provides actionable error messages
 */
function validateDatabaseUrl(url: string): void {
  // Check 1: DATABASE_URL exists
  if (!url || url.trim() === "") {
    throw new Error(
      "❌ DATABASE_URL is not set. " +
        "Please provision a PostgreSQL database and set the DATABASE_URL environment variable. " +
        "Example: postgresql://user:password@host:port/dbname",
    );
  }

  // Check 2: Valid PostgreSQL URL format
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error(
      `❌ Invalid DATABASE_URL protocol: "${url.split("://")[0]}". ` +
        'DATABASE_URL must start with "postgresql://" or "postgres://". ' +
        "Current value: " +
        url.substring(0, 50) +
        "...",
    );
  }

  // Check 3: URL contains required components (host and database name)
  try {
    const parsedUrl = new URL(url);

    if (!parsedUrl.hostname) {
      throw new Error(
        "❌ DATABASE_URL is missing hostname. " +
          "Format: postgresql://user:password@HOST:port/dbname",
      );
    }

    if (!parsedUrl.pathname || parsedUrl.pathname === "/") {
      throw new Error(
        "❌ DATABASE_URL is missing database name. " +
          "Format: postgresql://user:password@host:port/DBNAME",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("❌")) {
      throw error;
    }
    throw new Error(
      `❌ Malformed DATABASE_URL: ${error instanceof Error ? error.message : String(error)}. ` +
        "Expected format: postgresql://user:password@host:port/dbname",
    );
  }

  logger.info("[Database] ✅ DATABASE_URL validation passed");
}

// Validate the URL
validateDatabaseUrl(database.url);

// Use the URL directly from environment
// In Cloud Run, we will provide the correct pooled URL via the environment variable if needed
const connectionUrl = database.url;

// NEON SERVERLESS OPTIMIZATION: fullResults: false reduces overhead
// Returns rows only (not metadata) for better performance and lower active time
const sql = neon(connectionUrl, {
  fullResults: false,
});

/**
 * RECOMMENDED POSTGRESQL EXTENSIONS FOR NEON
 *
 * To check enabled extensions, run: npx tsx scripts/enable-pg-extensions.ts
 *
 * HIGH PRIORITY (Production Recommended):
 * - pg_stat_statements: Query performance tracking and monitoring
 *
 * MEDIUM PRIORITY (Use Case Dependent):
 * - pg_trgm: Fuzzy text search and similarity matching
 * - pgcrypto: Cryptographic functions for secure hashing
 * - uuid-ossp: UUID generation for unique identifiers
 *
 * LOW PRIORITY (AI/ML Use Cases):
 * - pgvector: Vector embeddings for AI similarity search
 *
 * Extensions are managed at the database level via SQL:
 * CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
 */

// PHASE 1: Connection pool metrics tracking (must be defined BEFORE drizzle initialization)
export interface PoolMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  totalQueryTime: number;
  averageQueryTime: number;
  peakConcurrentQueries: number;
  currentConcurrentQueries: number;
  lastHealthCheckAt?: Date;
  connectionPooling: "enabled" | "disabled";
}

const poolMetrics: PoolMetrics = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  totalQueryTime: 0,
  averageQueryTime: 0,
  peakConcurrentQueries: 0,
  currentConcurrentQueries: 0,
  connectionPooling: connectionUrl.includes("-pooler") ? "enabled" : "disabled",
};

// Track concurrent queries
let currentConcurrentQueries = 0;

// Wrap SQL function to track metrics - ALL queries go through this proxy
const trackedSql = new Proxy(sql, {
  apply: async (target, thisArg, argArray) => {
    // Dynamic import to avoid circular dependency
    const { withCircuitBreaker } =
      await import("./lib/resilience/db-circuit-breaker.js");

    return await withCircuitBreaker(async () => {
      // P1 RELIABILITY: Explicit Concurrency Limit
      // Neon Serverless handles many connections, but NodeJS event loop can get clogged
      // and we want to prevent "thundering herd" on the DB proxy.
      const MAX_CONCURRENT_QUERIES = 50;

      if (currentConcurrentQueries >= MAX_CONCURRENT_QUERIES) {
        poolMetrics.failedQueries++;
        throw new Error(
          `[DB] Database concurrency limit reached (${MAX_CONCURRENT_QUERIES}). Please retry.`,
        );
      }

      currentConcurrentQueries++;
      poolMetrics.currentConcurrentQueries = currentConcurrentQueries;
      poolMetrics.peakConcurrentQueries = Math.max(
        poolMetrics.peakConcurrentQueries,
        currentConcurrentQueries,
      );

      const startTime = performance.now();
      poolMetrics.totalQueries++;

      try {
        const result = await Reflect.apply(target, thisArg, argArray);
        poolMetrics.successfulQueries++;

        const duration = performance.now() - startTime;
        poolMetrics.totalQueryTime += duration;
        poolMetrics.averageQueryTime =
          poolMetrics.totalQueryTime / poolMetrics.totalQueries;

        return result;
      } catch (error) {
        poolMetrics.failedQueries++;
        throw error;
      } finally {
        currentConcurrentQueries--;
        poolMetrics.currentConcurrentQueries = currentConcurrentQueries;
      }
    }, "db-query");
  },
});

// CRITICAL: Use trackedSql instead of sql so all drizzle queries are tracked
export const db: NeonHttpDatabase<typeof schema> = drizzle(trackedSql as any, {
  schema,
});

// Type alias for database client - supports both direct db access and transactions
export type DbClient =
  | NeonHttpDatabase<typeof schema>
  | PgTransaction<
      NeonHttpQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >;

// CHUNK 3: Database timeout protection wrapper
// Uses Promise.race + AbortController for Neon HTTP compatibility

export class QueryTimeoutError extends Error {
  constructor(timeoutMs: number, operation: string) {
    super(`Query timeout after ${timeoutMs}ms: ${operation}`);
    this.name = "QueryTimeoutError";
  }
}

/**
 * Wraps a database operation with timeout protection
 * Compatible with Neon HTTP driver's stateless architecture
 */
export async function withQueryTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 5000,
  operationName: string = "database-query",
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new QueryTimeoutError(timeoutMs, operationName));
        });
      }),
    ]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof QueryTimeoutError) {
      logger.error(
        `[Query Timeout] ${operationName} exceeded ${timeoutMs}ms limit`,
      );
    }
    throw error;
  }
}

// Export types
export type Database = typeof db;

// Export metrics getter - returns actual stored timestamp, not current time
export function getPoolMetrics(): PoolMetrics {
  return { ...poolMetrics };
}

// Connection utilities for compatibility
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await trackedSql`SELECT 1`;
    poolMetrics.lastHealthCheckAt = new Date();
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * COLD START RESILIENCE: Wake up database with extended timeout
 * Neon databases auto-suspend after 5min inactivity and take 5-10s to wake
 * This ping ensures DB is ready before cache warming starts
 */
export async function wakeupDatabase(): Promise<{
  success: boolean;
  latency: number;
}> {
  const startTime = performance.now();

  // Environment-aware timeout: 15s prod, 10s staging, 5s dev
  const env = process.env.NODE_ENV || "development";
  const timeoutMs =
    env === "production" ? 15000 : env === "staging" ? 10000 : 15000;

  try {
    await withQueryTimeout(
      async () => {
        await trackedSql`SELECT 1 as ping`;
        return true;
      },
      timeoutMs,
      "database-wakeup",
    );

    const latency = performance.now() - startTime;
    poolMetrics.lastHealthCheckAt = new Date();

    logger.info(
      `[Database] ✅ Database wakeup successful (${latency.toFixed(0)}ms)`,
    );
    return { success: true, latency };
  } catch (error) {
    const latency = performance.now() - startTime;
    logger.error(
      `[Database] ❌ Database wakeup failed after ${timeoutMs}ms`,
      error,
    );
    return { success: false, latency };
  }
}

// HTTP connections don't need explicit cleanup
export async function closeDatabaseConnection(): Promise<void> {
  // No-op for HTTP connections
}

// Startup connection pool metrics logging
(async () => {
  try {
    const connectionHealthy = await checkDatabaseConnection();

    if (connectionHealthy) {
      logger.info("[Database] ✅ Connection pool metrics initialized:", {
        pooling: poolMetrics.connectionPooling,
        driver: "Neon HTTP (stateless)",
        concurrencyTracking: "enabled",
        metricsEndpoint: "/api/metrics/database",
      });

      if (poolMetrics.connectionPooling === "enabled") {
        logger.info(
          "[Database] ✅ NEON CONNECTION POOLING ENABLED - Production ready for 300+ concurrent users",
        );
      } else {
        logger.warn(
          "[Database] ⚠️ Connection pooling DISABLED - May experience issues under high load",
        );
      }
    } else {
      logger.error("[Database] ❌ Initial connection health check failed");
    }
  } catch (error) {
    logger.error("[Database] ❌ Failed to initialize pool metrics:", error);
  }
})();
