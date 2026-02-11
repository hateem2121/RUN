/**
 * Maps backend Zod/Express error responses to React Hook Form errors.
 * Handles nested dot-notation fields (e.g. "address.zip").
 */

// Generic interface for React Hook Form setError function
type SetErrorFn = (name: string, error: { type: string; message: string }) => void;

interface ValidationError {
  status: 422;
  details: Record<string, string[]>;
}

function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as Record<string, unknown>).status === 422 &&
    "details" in error &&
    typeof (error as Record<string, unknown>).details === "object"
  );
}

export function mapServerErrorsToForm(
  error: unknown,
  setError: SetErrorFn,
  fallbackMessage: string = "Validation failed. Please check your inputs.",
): string {
  // 1. Check if it's our standard API Error with details
  if (isValidationError(error)) {
    const details = error.details;
    let hasDeployedErrors = false;

    Object.entries(details).forEach(([fieldPath, messages]) => {
      if (messages && messages.length > 0 && messages[0]) {
        // Map "address.zip" -> "address.zip" (RHF handles dot notation natively)
        setError(fieldPath, {
          type: "server",
          message: messages[0],
        });
        hasDeployedErrors = true;
      }
    });

    if (hasDeployedErrors) {
      return fallbackMessage;
    }
  }

  // 2. Fallback for other errors
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
