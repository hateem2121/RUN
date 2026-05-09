import { err, type Result } from "neverthrow";
import { db } from "../../db.js";
import { type AppError, DatabaseError } from "../errors.js";

/**
 * Executes a database transaction and returns a Result object.
 * Automatically handles rollbacks if the callback returns an error Result.
 *
 * @param callback - Function to execute within the transaction
 * @returns A Result containing the callback's success value or an AppError
 */
export async function transactionalResult<T, E extends AppError>(
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<Result<T, E>>,
): Promise<Result<T, E | AppError>> {
  try {
    return await db.transaction(async (tx) => {
      const result = await callback(tx);
      if (result.isErr()) {
        // Throwing within db.transaction triggers a rollback
        throw result.error;
      }
      return result;
    });
  } catch (error) {
    // If it's already an AppError (from our throw above), return it directly
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      typeof (error as Record<string, unknown>).name === "string"
    ) {
      const errName = (error as Record<string, unknown>).name;
      if (
        [
          "DatabaseError",
          "NotFoundError",
          "ValidationError",
          "InternalError",
          "UnauthorizedError",
          "ForbiddenError",
        ].includes(errName as string)
      ) {
        return err(error as E);
      }
    }

    // Otherwise wrap unknown errors
    return err(new DatabaseError("Transaction failed", { cause: error }));
  }
}
