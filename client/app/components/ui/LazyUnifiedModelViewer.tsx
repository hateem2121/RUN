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
      className={`relative aspect-square h-full w-full items-center justify-center rounded-lg bg-muted/50 ${className || ""}`}
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

function isWebGLSupported(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

// Lazy wrapper that preserves the same API
export function LazyUnifiedModelViewer(
  props: ComponentProps<typeof UnifiedModelViewer> & {
    fallbackImage?: string;
    fallbackVideo?: string;
  },
) {
  const { fallbackImage, fallbackVideo, ...rest } = props;

  // Upfront synchronous WebGL detection: gracefully fallback to 2D image on unsupported devices
  if (typeof window !== "undefined" && !isWebGLSupported()) {
    const imgSrc =
      props.asset?.thumbnailUrl || fallbackImage || "/images/placeholders/product-placeholder.webp";
    return (
      <div
        className={`relative aspect-square h-full w-full overflow-hidden rounded-lg bg-surface-subtle dark:bg-muted ${props.className || ""}`}
      >
        <img src={imgSrc} alt="Product Preview" className="h-full w-full object-cover" />
      </div>
    );
  }

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
