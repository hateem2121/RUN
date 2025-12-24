import { lazy, Suspense } from "react";
import { ResourceSkeleton } from "./ResourceSkeleton";

interface LazyResourceLoaderProps {
	loader: () => Promise<{ default: React.ComponentType<any> }>;
	fallbackColumns?: 1 | 2 | 3 | 4;
}

export function LazyResourceLoader({
	loader,
	fallbackColumns = 3,
}: LazyResourceLoaderProps) {
	const Component = lazy(loader);

	return (
		<Suspense
			fallback={
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<ResourceSkeleton count={6} columns={fallbackColumns} />
				</div>
			}
		>
			<Component />
		</Suspense>
	);
}
