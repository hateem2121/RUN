import type { ComponentProps } from "react";
import { lazy, Suspense } from "react";
import { ModelViewerErrorBoundary } from "./ModelViewerErrorBoundary";

// Lazy-load the actual UnifiedModelViewer component
const UnifiedModelViewer = lazy(() =>
  import("./UnifiedModelViewerCore").then((m) => ({ default: m.UnifiedModelViewer })),
);

// Loading fallback component
function ModelViewerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full min-h-96 items-center justify-center rounded-lg bg-muted/50 ${className || ""}`}
    >
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
export function LazyUnifiedModelViewer(
  props: ComponentProps<typeof UnifiedModelViewer> & {
    fallbackImage?: string;
    fallbackVideo?: string;
  },
) {
  const { fallbackImage, fallbackVideo, ...rest } = props;
  return (
    <ModelViewerErrorBoundary
      asset={props.asset}
      fallbackImage={fallbackImage}
      fallbackVideo={fallbackVideo}
    >
      <Suspense fallback={<ModelViewerSkeleton className={props.className || ""} />}>
        <UnifiedModelViewer {...rest} />
      </Suspense>
    </ModelViewerErrorBoundary>
  );
}
