import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FormErrorDisplay - Consistent error message display for forms
 *
 * Features:
 * - Displays single or multiple error messages
 * - Accessible with ARIA attributes
 * - Consistent styling with design system
 * - Optional icon display
 *
 * @example
 * // Single error
 * <FormErrorDisplay error="Email is required" />
 *
 * // Multiple errors from field
 * <FormErrorDisplay errors={state.fieldErrors?.email} />
 *
 * // Form-level error
 * <FormErrorDisplay error={state.error} variant="form" />
 */

export interface FormErrorDisplayProps {
  /** Single error message */
  error?: string | undefined;
  /** Array of error messages (typical for field validation) */
  errors?: string[] | undefined;
  /** Display variant */
  variant?: "field" | "form";
  /** Additional CSS classes */
  className?: string | undefined;
  /** Show icon (default: true for form variant) */
  showIcon?: boolean;
  /** Field name for accessibility (generates id) */
  fieldName?: string;
}

export function FormErrorDisplay({
  error,
  errors,
  variant = "field",
  className,
  showIcon,
  fieldName,
}: FormErrorDisplayProps) {
  // Normalize errors to array
  const errorMessages: string[] = [];
  if (error) errorMessages.push(error);
  if (errors) errorMessages.push(...errors);

  if (errorMessages.length === 0) {
    return null;
  }

  const id = fieldName ? `${fieldName}-error` : undefined;
  const shouldShowIcon = showIcon ?? variant === "form";

  if (variant === "form") {
    return (
      <div
        id={id}
        role="alert"
        aria-live="polite"
        className={cn(
          "flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive",
          className,
        )}
      >
        {shouldShowIcon && (
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
        )}
        <div className="flex-1">
          {errorMessages.length === 1 ? (
            <p>{errorMessages[0]}</p>
          ) : (
            <ul className="list-inside list-disc space-y-1">
              {errorMessages.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // Field variant - compact inline display
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={cn("text-sm text-destructive", className)}
    >
      {errorMessages.length === 1 ? (
        <p className="flex items-center gap-1">
          {shouldShowIcon && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
          {errorMessages[0]}
        </p>
      ) : (
        <ul className="space-y-0.5">
          {errorMessages.map((msg, idx) => (
            <li key={idx} className="flex items-center gap-1">
              {shouldShowIcon && <AlertCircle className="h-3 w-3" aria-hidden="true" />}
              {msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Wrapper for displaying field errors with proper ARIA binding
 */
export interface FieldErrorProps {
  /** Field name (used for generating error id) */
  name: string;
  /** Error messages from form state */
  errors?: string[] | undefined;
  /** Additional CSS classes */
  className?: string | undefined;
}

export function FieldError({ name, errors, className }: FieldErrorProps) {
  if (!errors?.length) return null;

  return (
    <FormErrorDisplay errors={errors} variant="field" fieldName={name} className={className} />
  );
}
