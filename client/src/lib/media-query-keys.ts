/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MANDATORY CACHE & QUERY KEY STANDARDS (October 2025)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * All media queries/mutations must use MediaQueryKeys and call
 * invalidateMediaQueries after mutations.
 *
 * RULES:
 * 1. ALL queries MUST use imported MediaQueryKeys - NO literal keys
 * 2. ALL mutations MUST call invalidateMediaQueries() in onSuccess/onSettled
 * 3. Use predicate-based invalidation: queryKey[0] === 'apimedia'
 *
 * ⚠️ CODE REVIEW ENFORCEMENT:
 * - Reject PRs with literal query keys like ['/api/media'] or ['media', ...]
 * - Require invalidateMediaQueries() in all mutation onSuccess/onSettled callbacks
 * - Verify all queries import from '@/lib/media-query-keys'
 * - Ensure mutations always force refetch for paginated and single queries
 * - Zero tolerance for phantom records or stale cache entries
 *
 * SUCCESS CRITERIA:
 * - All queries/mutations use MediaQueryKeys (no literal keys)
 * - Mutations trigger invalidateMediaQueries after ALL upload/delete/update
 * - UI syncs instantly, no stale/phantom data in ANY view
 * - DB/API/UI match on every action
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * MediaQueryKeys - Centralized Query Key Management
 *
 * ⚠️ MANDATORY STANDARD: ALL media queries MUST use these imported keys.
 * NO ad-hoc strings or array literals allowed anywhere in the codebase.
 *
 * This ensures perfect cache alignment between database, API, and UI,
 * preventing phantom/stale records and synchronization bugs.
 *
 * USAGE:
 * - Import: import { MediaQueryKeys } from '@/lib/media-query-keys';
 * - Query: queryKey: MediaQueryKeys.paginated
 * - Invalidate: queryClient.invalidateQueries({ queryKey: MediaQueryKeys.all })
 */

export const MediaQueryKeys = {
  // Base keys for broad invalidation
  all: ["/api/media"] as const, // FIXED: Changed from 'apimedia' to valid URL path for queryFn

  // Specific query patterns
  paginated: ["/api/media", "paginated"] as const,
  single: ["/api/media", "single"] as const,
  list: ["/api/media", "list"] as const,
  recent: ["/api/media", "recent"] as const,
  batch: ["/api/media", "batch"] as const,
  variants: ["/api/media", "variants"] as const,
  forPage: ["/api/media", "page"] as const,
  assets: ["/api/media", "assets"] as const,

  // Legacy support (to be phased out)
  legacy: {
    base: ["/api/media"] as const,
  },
} as const;

/**
 * Helper functions for dynamic query keys
 */
export const createMediaQueryKey = {
  paginated: (params?: { page?: number; limit?: number; search?: string; type?: string }) =>
    [...MediaQueryKeys.paginated, params || {}] as const,

  single: (id: number | string) => [...MediaQueryKeys.single, String(id)] as const,

  list: (params?: { limit?: number; offset?: number }) =>
    [...MediaQueryKeys.list, params || {}] as const,

  recent: (limit: number = 50) => [...MediaQueryKeys.recent, String(limit)] as const,

  batch: (ids: (number | string)[]) =>
    [...MediaQueryKeys.batch, ids.map(String).sort().join(",")] as const,

  variants: (id: number | string, options?: Record<string, any>) =>
    [...MediaQueryKeys.variants, String(id), options || {}] as const,

  forPage: (page: string, ids?: (number | string)[]) =>
    [...MediaQueryKeys.forPage, page, ids ? ids.map(String).sort().join(",") : "all"] as const,
};

/**
 * Cache Invalidation Utility
 *
 * ⚠️ MANDATORY: Use this after EVERY media mutation (upload/delete/update)
 *
 * This catches ALL paginated/single/list media cache entries across the entire app,
 * ensuring instant synchronization between UI and database.
 *
 * USAGE:
 * await invalidateMediaQueries(queryClient);
 */
export const invalidateMediaQueries = (queryClient: any) => {
  return queryClient.invalidateQueries({
    queryKey: MediaQueryKeys.all,
    refetchType: "all",
  });
};

/**
 * @deprecated Use invalidateMediaQueries instead
 * Legacy class kept for backward compatibility during transition
 */
export class MediaCacheInvalidator {
  static async invalidateAll(queryClient: any): Promise<void> {
    return invalidateMediaQueries(queryClient);
  }

  static async invalidateItem(queryClient: any, _mediaId?: number | string): Promise<void> {
    return invalidateMediaQueries(queryClient);
  }

  static async invalidatePaginated(queryClient: any): Promise<void> {
    return invalidateMediaQueries(queryClient);
  }

  static async invalidateBatch(queryClient: any): Promise<void> {
    return invalidateMediaQueries(queryClient);
  }
}

// Convenience exports
export const invalidateAllMedia = invalidateMediaQueries;
export const invalidateMediaItem = invalidateMediaQueries;
export const invalidatePaginatedMedia = invalidateMediaQueries;
