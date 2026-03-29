import { lazy, Suspense } from "react";
import { ProductsErrorFallback } from "@/components/admin/ProductsErrorFallback";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Typography } from "@/components/ui/typography";

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

export default function AdminIndex() {
  return (
    <ErrorBoundary fallback={<ProductsErrorFallback />}>
      <Suspense fallback={<ModuleLoader />}>
        <ContentDashboard />
      </Suspense>
    </ErrorBoundary>
  );
}
