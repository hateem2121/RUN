import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import { reportWebVitals } from "@/lib/performance";
import { initSentry } from "@/lib/sentry";

initSentry();

// Performance Monitoring (PHASE 2 Integration)
onCLS(reportWebVitals);
onFCP(reportWebVitals);
onINP(reportWebVitals);
onLCP(reportWebVitals);
onTTFB(reportWebVitals);

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
