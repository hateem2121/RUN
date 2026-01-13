/**
 * Safe Transaction Wrapper
 * Executes callbacks within database transactions with automatic rollback
 */

import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NeonHttpQueryResultHKT } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { err, ok, type Result } from "neverthrow";
import * as schema from "../../../shared/schema.js";
import {
  ConflictError,
  DatabaseDeadlockError,
  DatabaseError,
  DatabaseTimeoutError,
} from "../errors.js";
import { logger } from "../monitoring/logger.js";
import { db } from "./connection.js";

// Type alias for database client - supports both direct db access and transactions
export type DbClient =
  | NeonHttpDatabase<typeof schema>
  | PgTransaction<NeonHttpQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

/**
 * Safe Transaction Wrapper
 * Executes a callback within a database transaction with automatic rollback on error.
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

    // Serialization failure (40001)
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
