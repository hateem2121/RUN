import { QueryErrorResetBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
}

/**
 * A wrapper that combines TanStack Query's reset logic with our UI ErrorBoundary.
 * When the ErrorBoundary's "Try Again" button is clicked, it calls `reset()`
 * which clears the query error state and triggers a refetch.
 */
export function QueryErrorBoundary({ children, componentName = "Data Loading", fallback }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => {
        return (
          <ErrorBoundary onReset={reset} componentName={componentName} fallback={fallback}>
            {children}
          </ErrorBoundary>
        );
      }}
    </QueryErrorResetBoundary>
  );
}
