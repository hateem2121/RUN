import * as Sentry from "@sentry/react";
import type React from "react";
import { useEffect } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { reportClientError } from "../lib/errorReporter";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  useEffect(() => {
    // FOUC Fail-Safe: If we hit the error boundary, ensure the screen is visible
    // so the user can actually SEE the error message.
    document.body.classList.add("css-loaded");
  }, []);

  return (
    <div className="flex min-h-96 w-full flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-900/10">
      <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6"
          aria-hidden="true"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <h2 className="mb-2 font-semibold text-gray-900 text-lg dark:text-white">
        Something went wrong
      </h2>
      <p className="mb-6 max-w-md text-gray-600 text-sm dark:text-gray-400">
        {error.message || "An unexpected error occurred while loading this component."}
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="rounded-md bg-white px-4 py-2 font-medium text-gray-900 text-sm shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-700"
      >
        Try Again
      </button>
    </div>
  );
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  const logError = (error: Error, info: { componentStack?: string | null }) => {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack || "unknown" } },
      tags: { boundary: "global" },
    });

    reportClientError({
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack || undefined,
      level: "error",
      context: { boundary: "global" },
    });
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
      {children}
    </ErrorBoundary>
  );
}
