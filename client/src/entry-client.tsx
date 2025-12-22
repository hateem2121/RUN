import React from "react";
import { hydrateRoot } from "react-dom/client";
console.log("[Entry] Client Entry Point Executing...");
import { HelmetProvider } from "react-helmet-async";
import { QueryClientProvider, HydrationBoundary } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import { createQueryClient } from "./lib/queryClient";
import { initSentry } from "./lib/sentry";
import "./index.css";

initSentry();

const queryClient = createQueryClient();

// Get Dehydrated state from server if available
// @ts-ignore
const dehydratedState = window.__REACT_QUERY_STATE__;

hydrateRoot(
  document.getElementById("root")!,
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <App />
        </HydrationBoundary>
        <DevtoolsWrapper />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
);

function DevtoolsWrapper() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || !import.meta.env.DEV) return null;

  return <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />;
}
