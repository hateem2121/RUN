import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
// @ts-expect-error
import "@fontsource-variable/inter";
import interWoff2 from "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url";
// @ts-expect-error - fontside-effect import
import "@fontsource/material-symbols-outlined";
import { HelmetProvider } from "react-helmet-async";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import { Toaster } from "sonner";
import { FloatingDockHeader } from "@/components/navigation/floating-dock-header";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { BackToTop } from "@/components/ui/back-to-top";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { getQueryClient } from "@/lib/queryClient";
import "@/index.css";
import { useEffect } from "react";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "react-router";
import { SkipLink } from "@/components/ui/skip-link";
import { reportWebVitals } from "@/lib/web-vitals";
import { ScrollProvider } from "./hooks/use-scroll";

// Load CSP nonce from server context
export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: interWoff2,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
];

export const meta: MetaFunction = () => {
  return [
    { name: "theme-color", content: "#000000" },
    { name: "mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
  ];
};

import { API_ROUTES } from "@run-remix/shared";
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { MediaQueryKeys } from "@/lib/media-query-keys";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const { cspNonce } = context as unknown as { cspNonce: string };
  const queryClient = new QueryClient();

  // Use protocol and host from request to build a dynamic base URL
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    // Prefetch navigation items
    await queryClient.prefetchQuery({
      queryKey: [API_ROUTES.CONTENT.NAVIGATION],
      queryFn: () => fetch(`${baseUrl}${API_ROUTES.CONTENT.NAVIGATION}`).then((res) => res.json()),
    });

    // Prefetch media items - Scoped to admin to reduce initial load
    if (url.pathname.startsWith("/admin")) {
      await queryClient.prefetchQuery({
        queryKey: MediaQueryKeys.list,
        queryFn: () => fetch(`${baseUrl}${API_ROUTES.MEDIA.ROOT}`).then((res) => res.json()),
      });
    }

    // Prefetch homepage batch data (Critical for Hero LCP)
    await queryClient.prefetchQuery({
      queryKey: ["homepage", "batch"],
      queryFn: () =>
        fetch(`${baseUrl}${API_ROUTES.CONTENT.HOMEPAGE_BATCH}`).then((res) => res.json()),
    });
  } catch (error) {
    console.error("[RootLoader] Error prefetching data:", error);
  }

  const ENV = {
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    SENTRY_RELEASE: process.env.SENTRY_RELEASE || process.env.GIT_SHA || "dev",
  };

  return { cspNonce, dehydratedState: dehydrate(queryClient), ENV };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useRouteLoaderData<typeof loader>("root");
  const nonce = loaderData?.cspNonce;

  // Create a client for the root (singleton on client, new on server per request)
  // using useState allows us to keep the client stable across re-renders
  const [queryClient] = useState(() => getQueryClient());

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    reportWebVitals();
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Theme script MUST be first to prevent FOUC - applies .dark before CSS loads */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          // biome-ignore lint/security/noDangerouslySetInnerHtml: hardcoded theme-init script, no user input
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = 'theme';
                  var theme = localStorage.getItem(storageKey);
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var resolvedTheme = theme === 'dark' || (theme !== 'light' && supportDarkMode) ? 'dark' : 'light';
                  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
                  document.documentElement.setAttribute('data-theme', resolvedTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <Meta />
        <Links />
        {/* Inject window.ENV for client-side configuration */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          // biome-ignore lint/security/noDangerouslySetInnerHtml: safe injection of server-side environment parameters
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(loaderData?.ENV || {})};`,
          }}
        />
      </head>

      <body suppressHydrationWarning>
        <ThemeProvider>
          <HelmetProvider>
            <QueryClientProvider client={queryClient}>
              <HydrationBoundary state={loaderData?.dehydratedState}>
                <ScrollProvider>
                  <SkipLink targetId="main-content" />
                  <FloatingDockHeader />
                  {children}
                  {mounted && (
                    <Toaster position="bottom-right" richColors expand={true} theme="system" />
                  )}
                  <BackToTop />
                  <OfflineIndicator />
                </ScrollProvider>
              </HydrationBoundary>
            </QueryClientProvider>
          </HelmetProvider>
        </ThemeProvider>
        <ScrollRestoration nonce={nonce} />
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
    message = error.title || "Error";
    details = error.detail || error.message || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <html lang="en">
      <head>
        <title>{`${message} | RUN`}</title>
        <Meta />
        <Links />
      </head>
      <body className="bg-background text-foreground antialiased">
        <main
          id="main-content"
          className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
        >
          <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-6">
            <AlertCircle size={48} />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl mb-4">{message}</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">{details}</p>

          {stack && (
            <div className="w-full max-w-2xl mb-8 p-4 bg-muted rounded-lg text-left overflow-auto max-h-60 border">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {stack}
              </pre>
            </div>
          )}

          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Return to Safety
          </a>
        </main>
        <Scripts />
      </body>
    </html>
  );
}

import { AlertCircle } from "lucide-react";
