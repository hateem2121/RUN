import type { AppError } from "../lib/errors.js";
import {
  BadRequestError,
  ConflictError,
  DatabaseDeadlockError,
  DatabaseTimeoutError,
  InternalError,
} from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";

interface PostgresError extends Error {
  code?: string | undefined;
  detail?: string | undefined;
  table?: string | undefined;
  constraint?: string | undefined;
  [key: string]: any;
}

/**
 * Maps raw Database/Drizzle errors to typed AppErrors
 * @param err - The raw error caught from the DB
 * @param context - Optional context string for logging
 */
export function mapDrizzleError(err: unknown, context: string = "Database Operation"): AppError {
  const pgErr = err as PostgresError;

  if (pgErr.code) {
    switch (pgErr.code) {
      case "23505": // Unique violation
        return new ConflictError(
          `Resource already exists${pgErr.detail ? `: ${pgErr.detail}` : ""}`,
          undefined,
        );

      case "23503": // Foreign key violation
        return new BadRequestError(
          `Referenced resource not found or invalid relationship${
            pgErr.detail ? `: ${pgErr.detail}` : ""
          }`,
          undefined,
        );

      case "23502": // Not null violation
        return new BadRequestError(
          `Missing required field${pgErr.column ? `: ${pgErr.column}` : ""}`,
          undefined,
        );

      case "22P02": // Invalid text representation (UUID format, etc)
        return new BadRequestError("Invalid input format for database field", undefined);

      case "40001": // Serialization failure (Deadlock)
        logger.warn(`[${context}] Deadlock detected`, { code: pgErr.code });
        // Can be retried by client or upstream logic
        return new DatabaseDeadlockError("Database deadlock occurred, please retry", undefined);

      case "57014": // Query canceled
        return new DatabaseTimeoutError("Database query timeout", undefined);
    }
  }

  // Fallback for unhandled DB errors
  logger.error(`[${context}] Unhandled Database Error`, pgErr);
  return new InternalError("Database operation failed", undefined);
}
