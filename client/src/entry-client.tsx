import "./wdyr";

import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { Router } from "wouter";
import App from "./App";
import { createQueryClient } from "./lib/queryClient";
import { sanitizeExtensionAttributes } from "./lib/dom-sanitizer";
import { initSentry } from "./lib/sentry";
import "./index.css";

// P1: Remove browser extension DOM attributes before hydration to prevent React 19 mismatches
sanitizeExtensionAttributes();

initSentry();

const queryClient = createQueryClient();

// Get Dehydrated state from server if available
// @ts-expect-error
const dehydratedState = window.__REACT_QUERY_STATE__;

hydrateRoot(
  document.getElementById("root")!,
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          {/**
           * HYDRATION FIX: Strict Router Parity.
           * Server uses <Router hook={staticLocationHook}>.
           * Client MUST use <Router> to ensure identical component tree depth.
           */}
          <Router>
            <App />
          </Router>
        </HydrationBoundary>
        <DevtoolsWrapper />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
  {
    onCaughtError: (error, errorInfo) => {
      // Sentry or other logging logic here
    },
    onUncaughtError: (error, errorInfo) => {
      // Final telemetry ping or fatal error logging
    },
    onRecoverableError: (error, errorInfo) => {},
  },
);

function DevtoolsWrapper() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || !import.meta.env.DEV) return null;

  return <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />;
}
