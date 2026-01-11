/**
 * Standard form pattern with React 19 useActionState
 *
 * Provides consistent form handling with:
 * - Server action integration
 * - Pending state management
 * - Field-level error handling
 * - Form-level error messages
 */

import React from "react";

export interface FormState<T = unknown> {
  success: boolean;
  errors?: Record<string, string[]>;
  data?: T;
  message?: string;
}

const INITIAL_STATE: FormState = { success: false };

/**
 * Custom hook for form actions with useActionState
 *
 * @example
 * const { state, formAction, isPending, hasError, getError } = useFormAction(submitContact);
 *
 * return (
 *   <form action={formAction}>
 *     <input name="email" />
 *     {hasError("email") && <span>{getError("email")}</span>}
 *     <button disabled={isPending}>Submit</button>
 *   </form>
 * );
 */
export function useFormAction<T>(
  action: (prevState: FormState<T>, formData: FormData) => Promise<FormState<T>>,
  initialState: FormState<T> = INITIAL_STATE as FormState<T>
) {
  const [state, formAction, isPending] = React.useActionState(action, initialState);

  const hasError = React.useCallback(
    (field: string): boolean => {
      return !!state.errors?.[field]?.length;
    },
    [state.errors]
  );

  const getError = React.useCallback(
    (field: string): string | undefined => {
      return state.errors?.[field]?.[0];
    },
    [state.errors]
  );

  const getAllErrors = React.useCallback(
    (field: string): string[] => {
      return state.errors?.[field] || [];
    },
    [state.errors]
  );

  const hasAnyErrors = React.useMemo(() => {
    return Object.keys(state.errors || {}).length > 0;
  }, [state.errors]);

  return {
    /** Current form state */
    state,
    /** Form action to pass to form's action prop */
    formAction,
    /** Whether form submission is in progress */
    isPending,
    /** Check if a specific field has errors */
    hasError,
    /** Get the first error message for a field */
    getError,
    /** Get all error messages for a field */
    getAllErrors,
    /** Whether any field has errors */
    hasAnyErrors,
  };
}

/**
 * Helper to create a server action response
 */
export function createFormResponse<T>(
  success: boolean,
  options?: {
    data?: T;
    errors?: Record<string, string[]>;
    message?: string;
  }
): FormState<T> {
  return {
    success,
    ...options,
  };
}

/**
 * Helper to create validation error response from Zod or API errors
 */
export function createValidationErrors<T>(
  errors: Record<string, string[]>,
  message = "Please fix the errors below"
): FormState<T> {
  return {
    success: false,
    errors,
    message,
  };
}

/**
 * Helper to create success response
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string
): FormState<T> {
  const response: FormState<T> = { success: true };
  if (data !== undefined) response.data = data;
  if (message !== undefined) response.message = message;
  return response;
}
