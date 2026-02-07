import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useState } from "react";
import { HelmetProvider } from "react-helmet-async";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "react-router";
import FloatingDockHeader from "@/components/navigation/floating-dock-header";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/shared/theme-provider";
import BackToTop from "@/components/ui/back-to-top";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { getQueryClient } from "@/lib/queryClient";
import "@/index.css";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";

// Load CSP nonce from server context
export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: "/fonts/NeueStance-Regular.ttf",
    as: "font",
    type: "font/ttf",
    crossOrigin: "anonymous",
  },
];

import { dehydrate, QueryClient } from "@tanstack/react-query";
import { MediaQueryKeys } from "@/lib/media-query-keys";

export async function loader({ context }: LoaderFunctionArgs) {
  const { cspNonce } = context as { cspNonce: string };
  const queryClient = new QueryClient();
  const baseUrl = "http://127.0.0.1:5002";

  try {
    // Prefetch navigation items
    await queryClient.prefetchQuery({
      queryKey: ["/api/navigation-items"],
      queryFn: () => fetch(`${baseUrl}/api/navigation-items`).then((res) => res.json()),
    });

    // Prefetch media items
    await queryClient.prefetchQuery({
      queryKey: MediaQueryKeys.list,
      queryFn: () => fetch(`${baseUrl}/api/media`).then((res) => res.json()), // Fallback to list if specific endpoint not found
    });
  } catch (error) {
    console.error("Failed to prefetch data in root loader:", error);
  }

  return { cspNonce, dehydratedState: dehydrate(queryClient) };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData<typeof loader>();
  const nonce = loaderData?.cspNonce;

  // Create a client for the root (singleton on client, new on server per request)
  // using useState allows us to keep the client stable across re-renders
  const [queryClient] = useState(() => getQueryClient());

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Theme script MUST be first to prevent FOUC - applies .dark before CSS loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = 'theme';
                  var activeTheme = localStorage.getItem(storageKey);
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  
                  if (!activeTheme) {
                    activeTheme = 'dark'; // Default to dark instead of system
                  }
                  
                  if (activeTheme === 'system') {
                    activeTheme = systemTheme;
                  }
                  
                  document.documentElement.classList.add(activeTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">
            <HelmetProvider>
              <QueryClientProvider client={queryClient}>
                <HydrationBoundary state={loaderData?.dehydratedState}>
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
                  >
                    Skip to main content
                  </a>
                  <FloatingDockHeader />
                  {children}
                  <Footer />
                  <BackToTop />
                  <OfflineIndicator />
                </HydrationBoundary>
              </QueryClientProvider>
            </HelmetProvider>
          </MotionConfig>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function HydrateFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="animate-pulse text-muted-foreground text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

import { ApiError } from "@/lib/api";

export function ErrorBoundary() {
  const error = useRouteError();
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (error instanceof ApiError) {
    // RFC 7807 Error Handling
    message = error.title || "Error";
    details = error.detail || error.message || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
