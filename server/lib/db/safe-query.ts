/**
 * Safe Query Wrapper
 * Functional safety layer around Drizzle promises
 */

import { err, ok, type Result } from "neverthrow";
import { DatabaseError } from "../errors.js";
import { logger } from "../monitoring/logger.js";

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
