import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { initSentry } from "@/lib/sentry";

// PC-603 RESOLVED: Web Vitals registration is handled exclusively in root.tsx
// via reportWebVitals() from @/lib/web-vitals (called in Layout useEffect).
// Removed duplicate onCLS/onFCP/onINP/onLCP/onTTFB registration here.

initSentry();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
    {
      onCaughtError: (error, errorInfo) => {
        console.error("Caught error during hydration:", error);
        // Report to Sentry if available (initSentry handles this, but explicit context is useful)
        import("@sentry/react").then((Sentry) => {
          Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
          });
        });
      },
      onUncaughtError: (error, errorInfo) => {
        console.error("Uncaught error during hydration:", error);
        import("@sentry/react").then((Sentry) => {
          Sentry.captureException(error, {
            level: "fatal",
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
          });
        });
      },
    },
  );
});
