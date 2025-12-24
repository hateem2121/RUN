import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminLoadingState = React.memo(function AdminLoadingState() {
	return (
		<div className="space-y-6">
			{/* Header Skeleton */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-32" />
			</div>

			{/* Table/Grid Skeleton */}
			<div className="space-y-3">
				<div className="flex gap-3">
					<Skeleton className="h-10 flex-1" />
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-32" />
				</div>

				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-16 w-full" />
				))}
			</div>

			{/* Pagination Skeleton */}
			<div className="flex justify-between items-center">
				<Skeleton className="h-6 w-32" />
				<div className="flex gap-2">
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
					<Skeleton className="h-8 w-8" />
				</div>
			</div>
		</div>
	);
});

export const AdminCardSkeleton = React.memo(function AdminCardSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
				<div key={i} className="border rounded-lg p-4 space-y-3">
					<Skeleton className="h-40 w-full" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
					<div className="flex justify-between">
						<Skeleton className="h-8 w-20" />
						<Skeleton className="h-8 w-20" />
					</div>
				</div>
			))}
		</div>
	);
});
