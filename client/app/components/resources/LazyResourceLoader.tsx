import type React from "react";
import { lazy, Suspense } from "react";
import { ResourceSkeleton } from "./ResourceSkeleton";

interface LazyResourceLoaderProps {
  loader: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>;
  fallbackColumns?: 1 | 2 | 3 | 4;
}

export function LazyResourceLoader({ loader, fallbackColumns = 3 }: LazyResourceLoaderProps) {
  const Component = lazy(loader);

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <ResourceSkeleton count={6} columns={fallbackColumns} />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}
