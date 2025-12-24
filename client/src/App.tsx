import type React from "react";
import { lazy, Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster as SonnerToaster } from "sonner";
import { Redirect, Route, Switch, useParams } from "wouter";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useConcurrentLocation } from "@/hooks/useConcurrentLocation";
import E2EOverlayTest from "@/pages/e2e-overlay";
import {
  prefetchCriticalHomepageData,
  prefetchSecondaryHomepageData,
  startAutomaticCacheCleanup,
} from "./lib/queryClient";

function RootErrorFallback({ error }: { error: Error }) {
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <h2 className="mb-4 font-bold text-2xl">Something went wrong</h2>
      <pre className="mb-4 max-w-lg overflow-auto rounded bg-gray-100 p-4 text-sm">
        {error.message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="rounded bg-black px-4 py-2 text-white transition-colors hover:bg-neutral-800"
      >
        Reload Page
      </button>
    </div>
  );
}

const FloatingDockHeader = lazy(() => import("@/components/navigation/floating-dock-header"));
const Footer = lazy(() => import("@/components/homepage-v2/Footer"));

import { AccessibilityWrapper } from "@/components/accessibility-wrapper";
import { InquiryDrawer } from "@/components/inquiry/InquiryDrawer";
import SmoothScrollLayout from "@/components/layout/SmoothScrollLayout";
import { MobileOptimizations } from "@/components/mobile-optimizations";
import { ResourceErrorBoundary } from "@/components/resources/ResourceErrorBoundary";
import CustomCursor from "@/components/ui/CustomCursor";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
// import Footer from "@/components/homepage-v2/Footer";
import { InquiryCartProvider } from "@/contexts/InquiryCartContext";
import { BundleUtils } from "@/lib/bundle-optimizer";
// FORENSIC INVESTIGATION - Phase 5: Core Web Vitals tracking
import { performanceTracker } from "@/lib/performance-tracker";
// import FloatingDockHeader from "@/components/navigation/floating-dock-header";
import LazyLoadingUtils from "./lib/lazy-loading-optimizer";
import { useHydratedStore } from "./lib/useHydratedStore";
import { useQuoteStore } from "./stores/useQuoteStore";

// Lazy load all pages for better performance
const Homepage = lazy(() => import("@/pages/homepage"));
const Admin = lazy(() => import("@/pages/admin"));
const ProductShowcase = lazy(() => import("@/components/showcase/ProductShowcase"));

const EnhancedProductDetail = lazy(() => import("@/pages/enhanced-product-detail"));
const Categories = lazy(() => import("@/pages/categories"));
const About = lazy(() => import("@/pages/about"));
const Services = lazy(() => import("@/pages/services"));
const Sustainability = lazy(() => import("@/pages/sustainability"));
const Manufacturing = lazy(() => import("@/pages/manufacturing"));
const Technology = lazy(() => import("@/pages/technology"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Contact = lazy(() => import("@/pages/contact"));
const Certifications = lazy(() => import("@/pages/certifications"));
const Accessories = lazy(() => import("@/pages/accessories"));
const SizeCharts = lazy(() => import("@/pages/size-charts"));
const Fabrics = lazy(() => import("@/pages/fabrics"));
const Fibers = lazy(() => import("@/pages/fibers"));
const Resources = lazy(() => import("@/pages/resources"));
const Analytics = lazy(() => import("@/pages/analytics"));

// Static import for debugging E2E routing fallthrough
import NotFound from "@/pages/not-found";

// const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <p className="text-gray-600 text-sm dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

// Redirect component for category detail pages
// Redirects /categories/:slug to /products?category=:slug
function CategoryRedirect() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  return <Redirect to={`/products?category=${slug}`} />;
}

function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useConcurrentLocation();
  const isAdminPage = location.startsWith("/admin");

  // Don't show navbar on admin pages - simplified for Visual Editor
  if (isAdminPage) {
    return (
      <div className="visual-editor-root">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </div>
    );
  }

  return (
    <AccessibilityWrapper>
      <FloatingDockHeader />
      <main className="pt-32">
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </main>
      {location !== "/" && <Footer />}
    </AccessibilityWrapper>
  );
}

// Route preloading utility
const preloadRoute = (routeImport: () => Promise<any>) => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => routeImport().catch(() => {}));
  } else {
    setTimeout(() => routeImport().catch(() => {}), 100);
  }
};

function Router() {
  // Performance Optimization: Week 3 - Enhanced preloading and monitoring
  useEffect(() => {
    // CHUNK 4: Start automatic cache cleanup (2min interval, 120MB threshold)
    startAutomaticCacheCleanup();
    performanceTracker.getHealthStatus(); // Initialize tracker

    // Performance optimization: Prefetch critical homepage data immediately
    prefetchCriticalHomepageData();

    // Preload most likely user navigation paths
    preloadRoute(() => import("@/pages/products-new"));
    preloadRoute(() => import("@/pages/about"));
    preloadRoute(() => import("@/pages/categories"));
    preloadRoute(() => import("@/pages/contact"));

    // Week 3: Initialize performance monitoring and lazy loading
    LazyLoadingUtils.preloadCriticalResources().catch(() => {});
    LazyLoadingUtils.setupLazyImages();

    // Prefetch secondary data after a short delay to avoid blocking critical resources
    setTimeout(() => {
      prefetchSecondaryHomepageData();

      // Week 3: Log bundle analysis in development
      try {
        if ((import.meta as any).env?.MODE === "development") {
          setTimeout(() => {
            BundleUtils.logBundleReport();
            // Removed debug console statement for production
          }, 2000);
        }
      } catch (_e) {
        // Fallback if import.meta.env is not available
      }
    }, 500);

    // Cleanup on unmount
    return () => {
      LazyLoadingUtils.cleanup();
      performanceTracker.cleanup(); // FORENSIC: Cleanup performance observer
    };
  }, []);

  return (
    <Switch>
      {/* E2E Test Route - Explicit Static Render (Moved to top for priority) */}
      <Route path="/e2e-overlay" component={E2EOverlayTest} />

      <Route path="/" component={Homepage} />
      <Route path="/products" component={ProductShowcase} />
      {/* Legacy /products/:slug route removed - now handled by hierarchical URLs */}
      <Route path="/categories" component={Categories} />
      {/* Category redirect - redirects to /products?category=:slug for unified catalog */}
      <Route path="/categories/:slug" component={CategoryRedirect} />
      {/* Enhanced product routes with Style 1 integration - most specific to least specific */}
      <Route
        path="/categories/:category/:subcategory/:subsubcategory/:product"
        component={EnhancedProductDetail}
      />
      <Route path="/categories/:category/:subcategory/:product" component={EnhancedProductDetail} />
      <Route path="/categories/:category/:product" component={EnhancedProductDetail} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/sustainability" component={Sustainability} />
      <Route path="/manufacturing" component={Manufacturing} />
      <Route path="/technology" component={Technology} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/contact" component={Contact} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/resources">
        {() => (
          <ResourceErrorBoundary>
            <Resources />
          </ResourceErrorBoundary>
        )}
      </Route>
      <Route path="/resources/certifications">
        {() => (
          <ResourceErrorBoundary>
            <Certifications />
          </ResourceErrorBoundary>
        )}
      </Route>
      <Route path="/resources/accessories">
        {() => (
          <ResourceErrorBoundary>
            <Accessories />
          </ResourceErrorBoundary>
        )}
      </Route>
      <Route path="/resources/size-charts">
        {() => (
          <ResourceErrorBoundary>
            <SizeCharts />
          </ResourceErrorBoundary>
        )}
      </Route>
      <Route path="/resources/fabrics">
        {() => (
          <ResourceErrorBoundary>
            <Fabrics />
          </ResourceErrorBoundary>
        )}
      </Route>
      <Route path="/resources/fibers">
        {() => (
          <ResourceErrorBoundary>
            <Fibers />
          </ResourceErrorBoundary>
        )}
      </Route>
      <Route path="/admin" component={Admin} />
      <Route path="/admin/products" component={Admin} />
      <Route path="/admin/categories" component={Admin} />
      <Route path="/admin/media" component={Admin} />
      <Route path="/admin/fabrics" component={Admin} />
      <Route path="/admin/fibers" component={Admin} />
      <Route path="/admin/certificates" component={Admin} />
      <Route path="/admin/size-charts" component={Admin} />
      <Route path="/admin/accessories" component={Admin} />
      <Route path="/admin/navigation" component={Admin} />
      <Route path="/admin/contact" component={Admin} />
      <Route path="/admin/homepage" component={Admin} />
      <Route path="/admin/about" component={Admin} />
      <Route path="/admin/sustainability" component={Admin} />
      <Route path="/admin/manufacturing" component={Admin} />
      <Route path="/admin/technology" component={Admin} />
      <Route path="/admin/storage-optimization" component={Admin} />
      <Route path="/admin/test-runner" component={Admin} />
      <Route path="/admin/inquiries" component={Admin} />
      <Route path="/admin/footer" component={Admin} />
      <Route path="/admin/footer" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function QuoteOverlay() {
  // SSR-safe: Returns undefined until hydrated to prevent mismatch with localStorage state
  const items = useHydratedStore(useQuoteStore, (state) => state.items);
  const isDrawerOpen = useHydratedStore(useQuoteStore, (state) => state.isDrawerOpen);
  const openDrawer = useQuoteStore((state) => state.openDrawer);
  const closeDrawer = useQuoteStore((state) => state.closeDrawer);

  // Don't render until hydrated to ensure SSR/client parity
  if (items === undefined) return null;

  const count = items.length;

  if (count === 0 && !isDrawerOpen) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={openDrawer}
        className="group fixed right-6 bottom-6 z-dock flex items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-2xl transition-transform hover:scale-105 hover:bg-blue-700 active:scale-95"
      >
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-red-500 font-bold text-white text-xs">
            {count}
          </span>
        </div>
      </button>

      {/* Drawer */}
      <InquiryDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </>
  );
}

function App() {
  // Use location hook to determine if we are on the test route
  // We cannot use useConcurrentLocation inside App because it might depend on context not present,
  // but let's assume it works or use wouter's useLocation if available.
  // Actually, App wraps everything in InquiryCartProvider, TooltipProvider...
  // We can use useLocation from wouter just fine.
  const [location] = useConcurrentLocation();
  const isE2E = location === "/e2e-overlay";

  // COMPREHENSIVE GLOBAL ABORTERROR HANDLER - FINAL SOLUTION
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;

      // CRITICAL FIX: Comprehensive AbortError detection covering ALL formats
      const isAbortError =
        // Standard Error objects
        (reason instanceof Error && reason.name === "AbortError") ||
        // DOMException objects (the format from user's error log)
        (reason instanceof DOMException && reason.name === "AbortError") ||
        // Plain objects with AbortError properties
        (typeof reason === "object" && reason?.name === "AbortError") ||
        // String-based abort messages
        (typeof reason === "string" && reason.includes("abort")) ||
        (typeof reason === "string" && reason.includes("Superseded by new request")) ||
        (typeof reason === "string" && reason.includes("The user aborted a request"));

      if (isAbortError) {
        // Removed debug console statement for production
        event.preventDefault(); // CRITICAL: Prevent this from reaching devtools
        return;
      }

      // Check if error originates from Replit devtools (but isn't an AbortError)
      const isExternalToolError =
        reason?.stack?.includes("eruda.js") ||
        reason?.stack?.includes("__replco") ||
        reason?.stack?.includes("extension") ||
        reason?.stack?.includes("chrome-extension");

      if (isExternalToolError && !isAbortError) {
        // Error logging disabled for production
        event.preventDefault();
        return;
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  // Isolate E2E Route from Layout/Suspense complexities
  if (isE2E) {
    return <E2EOverlayTest />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <InquiryCartProvider>
        <TooltipProvider>
          <MobileOptimizations />
          <CustomCursor />
          <PerformanceMonitor />
          <QuoteOverlay /> {/* NEW: Quote System Overlay */}
          <Toaster />
          <SonnerToaster />
          <Layout>
            <SmoothScrollLayout>
              <ErrorBoundary FallbackComponent={RootErrorFallback}>
                <Router />
              </ErrorBoundary>
            </SmoothScrollLayout>
          </Layout>
        </TooltipProvider>
      </InquiryCartProvider>
    </ThemeProvider>
  );
}

export default App;
