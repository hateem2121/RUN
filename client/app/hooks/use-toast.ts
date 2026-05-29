import type * as React from "react";
import { toast as sonnerToast } from "sonner";

/**
 * EH-102 Remediation: Legacy Toast Wrapper for Sonner
 *
 * This hook preserves the existing shadcn-like API used throughout the codebase
 * but routes all calls to the 'sonner' provider rendered in root.tsx.
 *
 * Success Criteria:
 * - Mutations show visible toasts again
 * - No need to refactor 37+ files
 * - Consistent styling via sonner
 */

export interface ToastProps {
  id?: string | number;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Standalone toast function for use outside of React components (e.g. in queryClient.ts)
 */
export function toast({ title, description, variant, duration, action, ...props }: ToastProps) {
  const options: Record<string, unknown> = {
    description,
    ...props,
  };

  if (duration) options.duration = duration;
  if (action && typeof action === "object" && "label" in action) {
    options.action = action;
  }

  if (variant === "destructive") {
    return sonnerToast.error(title, options);
  }

  // Default to success for 'default' variant or undefined (standard for positive feedback in this app)
  return sonnerToast.success(title, options);
}

/**
 * Hook for use within React components
 */
export function useToast() {
  return {
    toast,
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    toasts: [], // Legacy compat: we don't expose internal sonner state here
  };
}
