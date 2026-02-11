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
  } catch (error: unknown) {
    // Check for unique constraint violation (Postgres error 23505)
    // We use a safe check for the 'code' property
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === "23505"
    ) {
      const pgError = error as { constraint?: string; detail?: string };
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
