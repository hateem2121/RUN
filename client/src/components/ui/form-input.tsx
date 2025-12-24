import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Reusable form input component with consistent styling.
 * Integrates with react-hook-form via forwardRef.
 *
 * @example
 * <FormInput
 *   label="Email"
 *   error={errors.email?.message}
 *   {...register("email")}
 * />
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div>
      <label className="mb-1 block font-medium text-slate-700 text-sm">
        {label}
        <input
          ref={ref}
          className={cn(
            "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-ring",
            error && "border-red-500",
            className,
          )}
          {...props}
        />
      </label>
      {error && <p className="mt-1 text-red-500 text-xs">{error}</p>}
    </div>
  ),
);
FormInput.displayName = "FormInput";
