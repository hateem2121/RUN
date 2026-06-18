import { lazy, Suspense } from "react";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";
import { ProductsErrorFallback } from "@/components/admin/ProductsErrorFallback";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";
import { ErrorBoundary as InlineErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Typography } from "@/components/ui/typography";

export { AdminErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };

// Lazy load Content Dashboard (Stitch Design)
const ContentDashboard = lazy(() =>
  import("@/components/admin/dashboard/ContentDashboard").then((m) => ({
    default: m.ContentDashboard,
  })),
);

// Loading component
function ModuleLoader() {
  return (
    <div className="h-loading-center flex items-center justify-center">
      <div className="text-center">
        <div className="border-muted border-t-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4" />
        <Typography.P className="text-muted-foreground text-sm">Loading module...</Typography.P>
      </div>
    </div>
  );
}

export function Component() {
  return (
    <InlineErrorBoundary fallback={<ProductsErrorFallback />}>
      <Suspense fallback={<ModuleLoader />}>
        <ContentDashboard />
      </Suspense>
    </InlineErrorBoundary>
  );
}
