import type { ComponentProps } from "react";
import { lazy, Suspense } from "react";

// Lazy-load the actual UnifiedModelViewer component
const UnifiedModelViewer = lazy(() =>
  import("./UnifiedModelViewer").then((m) => ({ default: m.UnifiedModelViewer })),
);

// Loading fallback component
function ModelViewerSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted/50">
      <div className="space-y-2 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-surface-emphasis border-t-blue-600" />
        <p className="text-sm text-text-disabled dark:text-muted-foreground">
          Loading 3D viewer...
        </p>
      </div>
    </div>
  );
}

// Lazy wrapper that preserves the same API
export function LazyUnifiedModelViewer(props: ComponentProps<typeof UnifiedModelViewer>) {
  return (
    <Suspense fallback={<ModelViewerSkeleton />}>
      <UnifiedModelViewer {...props} />
    </Suspense>
  );
}
