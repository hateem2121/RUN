import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
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
import { FloatingDockHeader } from "@/components/navigation/floating-dock-header";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { BackToTop } from "@/components/ui/back-to-top";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { Toaster } from "@/components/ui/toaster";
import { getQueryClient } from "@/lib/queryClient";
import "@/index.css";
import { useEffect } from "react";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "react-router";
import { reportWebVitals } from "@/lib/web-vitals";
import { ScrollProvider } from "./hooks/use-scroll";
import { SkipLink } from "@/components/ui/skip-link";

// Load CSP nonce from server context
export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: "/fonts/NeueStance-Bold.ttf",
    as: "font",
    type: "font/ttf",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    href: "/fonts/NeueStance-Regular.ttf",
    as: "font",
    type: "font/ttf",
    crossOrigin: "anonymous",
  },
  {
    rel: "preconnect",
    href: "https://fonts.googleapis.com",
  },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap",
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
  const { cspNonce } = context as { cspNonce: string };
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

  return { cspNonce, dehydratedState: dehydrate(queryClient) };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData<typeof loader>();
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
                  {mounted && <Toaster />}
                  <BackToTop />
                  <OfflineIndicator />
                </ScrollProvider>
              </HydrationBoundary>
            </QueryClientProvider>
          </HelmetProvider>
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
    <main id="main-content" className="container mx-auto p-4 pt-16">
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
