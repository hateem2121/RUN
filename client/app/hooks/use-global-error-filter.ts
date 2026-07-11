import { useEffect } from "react";

/**
 * Checks if an error is an AbortError (fetch cancellation)
 */
export const isAbortError = (reason: unknown): boolean => {
  return (
    // Standard Error objects
    (reason instanceof Error && reason.name === "AbortError") ||
    // DOMException objects
    (reason instanceof DOMException && reason.name === "AbortError") ||
    // Plain objects
    (typeof reason === "object" &&
      reason !== null &&
      (reason as Record<string, unknown>)?.name === "AbortError") ||
    // String-based messages
    (typeof reason === "string" &&
      (reason.includes("abort") ||
        reason.includes("Superseded by new request") ||
        reason.includes("The user aborted a request")))
  );
};

/**
 * Checks if an error is generic third-party extension noise
 */
export const isExtensionNoise = (reason: unknown): boolean => {
  if (!reason || typeof reason !== "object") {
    return false;
  }
  const stack = (reason as { stack?: string }).stack || "";
  return (
    stack.includes("eruda.js") ||
    stack.includes("__replco") ||
    stack.includes("extension") ||
    stack.includes("chrome-extension")
  );
};

/**
 * Global error filtering hook
 * Prevents console noise for known non-critical errors (AbortError, Extensions)
 */
/** @public */ export const useGlobalErrorFilter = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;

      if (isAbortError(reason)) {
        event.preventDefault(); // Prevent console error
        return;
      }

      if (isExtensionNoise(reason)) {
        event.preventDefault(); // Prevent console error
        return;
      }

      // We do NOT log to console.error here anymore to avoid duplication
      // if the browser or Sentry already captures it.
      // Sentry will capture unhandled rejections automatically.
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
};
