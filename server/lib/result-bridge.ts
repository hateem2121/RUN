import { err, fromPromise, ok, type Result } from "neverthrow";
import { AppError, InternalError } from "../errors/AppError.js";
import { logger } from "./smart-logger.js";

/**
 * Wraps a Promise-based database operation into a ResultAsync.
 * Catches exceptions and converts them to AppError.
 */
export async function dbResult<T>(
  operation: () => Promise<T>,
  context: string = "dbResult"
): Promise<Result<T, AppError>> {
  return fromPromise(operation(), (e: any) => {
    logger.error(`[${context}] Operation failed`, { error: e });
    if (e instanceof AppError) return e;
    return new InternalError(`Database operation failed in ${context}`);
  });
}

/**
 * Safe executor that catches ANY exception and converts it to AppError
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  errorMessage: string = "Operation failed"
): Promise<Result<T, AppError>> {
  try {
    const data = await operation();
    return ok(data);
  } catch (e) {
    if (e instanceof AppError) return err(e);

    logger.error(errorMessage, { originalError: e });
    return err(new AppError(errorMessage, 500, "INTERNAL_ERROR", false));
  }
}
