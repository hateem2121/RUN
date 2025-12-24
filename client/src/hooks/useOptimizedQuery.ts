import { type UseQueryOptions, useQuery } from "@tanstack/react-query";

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, "queryFn"> {
	queryKey: [string, ...any[]];
	staleTime?: number;
	gcTime?: number;
	refetchOnWindowFocus?: boolean;
	refetchOnMount?: boolean;
}

/**
 * Optimized query hook with performance-focused defaults
 * - Extended stale time for reduced refetching
 * - Disabled window focus refetching for better UX
 * - Intelligent cache management
 */
export function useOptimizedQuery<T = unknown>(
	options: OptimizedQueryOptions<T>,
) {
	return useQuery<T>({
		...options,
		staleTime: options.staleTime ?? 15 * 60 * 1000, // 15 minutes default
		gcTime: options.gcTime ?? 30 * 60 * 1000, // 30 minutes default
		refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
		refetchOnMount: options.refetchOnMount ?? false,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}
