import type { ComponentProps } from 'react';
import { lazy, Suspense } from 'react';

// Lazy-load the actual UnifiedModelViewer component
const UnifiedModelViewer = lazy(() => import('./UnifiedModelViewer'));

// Loading fallback component
function ModelViewerSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading 3D viewer...</p>
      </div>
    </div>
  );
}

// Lazy wrapper that preserves the same API
export function LazyUnifiedModelViewer(
  props: ComponentProps<typeof UnifiedModelViewer>
) {
  return (
    <Suspense fallback={<ModelViewerSkeleton />}>
      <UnifiedModelViewer {...props} />
    </Suspense>
  );
}
