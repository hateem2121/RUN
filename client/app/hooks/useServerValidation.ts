import { useEffect } from "react";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { ApiError } from "../lib/api";

interface UseServerValidationProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  error: unknown;
  onClientError?: (error: ApiError) => void;
}

/**
 * Automatically maps RFC 9457 "invalid-params" to React Hook Form errors.
 * 
 * @example
 * useServerValidation({
 *   form,
 *   error: actionError, // from useActionState or try/catch
 * });
 */
export function useServerValidation<T extends FieldValues>({
  form,
  error,
  onClientError
}: UseServerValidationProps<T>) {
  const { setError } = form;

  useEffect(() => {
    if (!error) return;

    if (error instanceof ApiError) {
      if (error.invalidParams) {
        Object.entries(error.invalidParams).forEach(([field, messages]) => {
          // Cast field to Path<T> assuming server field names match client form fields
          // We take the first message as the primary error
          if (messages && messages.length > 0) {
              setError(field as Path<T>, {
                  type: "server",
                  message: messages[0] || "Invalid value"
              });
          }
        });
      }
      
      // Optional callback for non-validation API errors (e.g. 401, 500)
      if (onClientError) {
        onClientError(error);
      }
    }
  }, [error, setError, onClientError]);
}
