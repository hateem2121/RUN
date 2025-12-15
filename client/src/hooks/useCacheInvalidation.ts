/**
 * EVENT-DRIVEN CACHE INVALIDATION HOOK (DISABLED FOR PERFORMANCE)
 * 
 * PERFORMANCE OPTIMIZATION: This hook has been disabled to eliminate unnecessary polling.
 * React Query's built-in cache management (staleTime, cacheTime) and mutation invalidation
 * are sufficient for keeping data fresh without constant backend polling.
 * 
 * Previous behavior: Polled backend every 5 seconds for cache invalidation events.
 * Current behavior: No-op hook to maintain API compatibility.
 */
export function useCacheInvalidationListener(_pattern: string) {
  // No-op - cache invalidation is handled by React Query's built-in mechanisms
  // and manual invalidation in mutation callbacks
}
