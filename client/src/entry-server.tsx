// import ReactHelmetAsync from "react-helmet-async";
// const { HelmetProvider } = ReactHelmetAsync;
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { type RenderToPipeableStreamOptions, renderToPipeableStream } from "react-dom/server";
// CJS/ESM Interop Fix for react-helmet-async
import * as HelmetAsyncPkg from "react-helmet-async";
const HelmetProvider =
  HelmetAsyncPkg.HelmetProvider ||
  (HelmetAsyncPkg as any).default?.HelmetProvider ||
  (HelmetAsyncPkg as any).default;
import { type BaseLocationHook, Router } from "wouter";
import App from "./App"; // Assumes App handles its own Providers but we might need to wrap it
import { createQueryClient } from "./lib/queryClient";

// Wouter internal types for static location
const staticLocationHook = (path: string): BaseLocationHook => {
  return () => [path, (_to: string, { replace: _replace } = {}) => {}];
};

// Re-export for SSR handler usage
export { createQueryClient } from "./lib/queryClient";

export function render(
  url: string,
  res: any,
  options?: RenderToPipeableStreamOptions,
  queryClient?: any,
) {
  // Use passed queryClient (with prefetched data) or create new one
  const client = queryClient || createQueryClient();
  const helmetContext = {};

  const { pipe, abort } = renderToPipeableStream(
    <React.StrictMode>
      <HelmetProvider context={helmetContext}>
        <QueryClientProvider client={client}>
          {/* 
            App.tsx usually has its own Router/Providers. 
            For SSR with wouter, we need to wrap with a Router providing a hook 
            that returns the static location.
            However, App.tsx likely has a <Switch> or <Router> inside.
            If App.tsx has <Switch>, it implicitly uses the default Router unless wrapped.
          */}
          <Router hook={staticLocationHook(url)}>
            <App />
          </Router>
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>,
    {
      ...options,
      onShellError(error) {
        if (!res.headersSent) {
          res.status(500);
          res.set("Content-Type", "text/html");
          res.send("<h1>Something went wrong</h1><pre>" + (error as any)?.message + "</pre>");
        } else {
          console.error("SSR Entry Shell Error (Headers Sent):", error);
        }
        if (options?.onShellError) options.onShellError(error);
      },
      onAllReady() {
        // Propagate onAllReady to allow data injection in ssr-handler
        if (options?.onAllReady) {
          options.onAllReady();
        }
      },
    },
  );

  return { pipe, abort, queryClient: client, helmetContext };
}
