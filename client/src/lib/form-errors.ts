/**
 * Maps backend Zod/Express error responses to React Hook Form errors.
 * Handles nested dot-notation fields (e.g. "address.zip").
 */

// Generic interface for React Hook Form setError function
type SetErrorFn = (name: string, error: { type: string; message: string }) => void;

export function mapServerErrorsToForm(
  error: unknown,
  setError: SetErrorFn,
  fallbackMessage: string = "Validation failed. Please check your inputs.",
): string {
  // 1. Check if it's our standard API Error with details
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as any).status === 422 &&
    "details" in (error as any)
  ) {
    const details = (error as any).details as Record<string, string[]>;
    let hasDeployedErrors = false;

    Object.entries(details).forEach(([fieldPath, messages]) => {
      if (messages && messages.length > 0 && messages[0]) {
        // Map "address.zip" -> "address.zip" (RHF handles dot notation natively)
        setError(fieldPath, {
          type: "server",
          message: messages[0], // Type assertion safe due to check
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
