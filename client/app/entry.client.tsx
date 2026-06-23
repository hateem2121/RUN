import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { initErrorReporter } from "@/lib/errorReporter.js";

// PC-603 RESOLVED: Web Vitals registration is handled exclusively in root.tsx
// via reportWebVitals() from @/lib/web-vitals (called in Layout useEffect).
// Removed duplicate onCLS/onFCP/onINP/onLCP/onTTFB registration here.

initErrorReporter();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
    {
      onCaughtError: (error) => {
        console.error("Caught error during hydration:", error);
        // Sentry removed
      },
      onUncaughtError: (error) => {
        console.error("Uncaught error during hydration:", error);
        // Sentry removed
      },
    },
  );
});
