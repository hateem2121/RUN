import { AppError, BadRequestError, ConflictError, InternalError } from "../errors/AppError.js";
import { logger } from "../lib/smart-logger.js";

interface PostgresError extends Error {
  code?: string;
  detail?: string;
  table?: string;
  constraint?: string;
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
        );

      case "23503": // Foreign key violation
        return new BadRequestError(
          `Referenced resource not found or invalid relationship${
            pgErr.detail ? `: ${pgErr.detail}` : ""
          }`,
        );

      case "23502": // Not null violation
        return new BadRequestError(
          `Missing required field${pgErr.column ? `: ${pgErr.column}` : ""}`,
        );

      case "22P02": // Invalid text representation (UUID format, etc)
        return new BadRequestError("Invalid input format for database field");

      case "40001": // Serialization failure (Deadlock)
        logger.warn(`[${context}] Deadlock detected`, { code: pgErr.code });
        // Can be retried by client or upstream logic
        return new AppError("Database deadlock occurred, please retry", 409, "DB_DEADLOCK");

      case "57014": // Query canceled
        return new AppError("Database query timeout", 504, "DB_TIMEOUT");
    }
  }

  // Fallback for unhandled DB errors
  logger.error(`[${context}] Unhandled Database Error`, pgErr);
  return new InternalError("Database operation failed");
}
