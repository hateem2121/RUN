import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { initSentry } from "@/lib/sentry";

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
