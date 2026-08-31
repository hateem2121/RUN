import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { initErrorReporter } from "@/lib/error-reporter.js";

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
  if (typeof window !== "undefined") {
    (window as unknown as { __hydrated?: boolean }).__hydrated = true;
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    }
  }
});
