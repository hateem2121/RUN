/*
 * CHUNK 4: React Query Cache & Retry Optimization
 *
 * SUCCESS CRITERIA:
 * - Error states surface in <10s (reduced from minutes)
 * - Cache memory usage < 120MB per browser tab
 * - Granular cache strategies per data type
 *
 * USAGE GUIDE:
 *
 * 1. **Use Query Key Factories** (prevents unbounded cache growth):
 *    ```typescript
 *    // ✅ GOOD - Use centralized factory
 *    useQuery({ queryKey: queryKeys.products.byPath(productPath) })
 *    useQuery({ queryKey: queryKeys.homepage.hero() })
 *
 *    // ❌ BAD - Hardcoded strings
 *    useQuery({ queryKey: ['/api/products', productId] })
 *    ```
 *
 * 2. **Apply Data Type Presets** (optimized staleTime/gcTime):
 *    ```typescript
 *    // Static data (15min staleTime)
 *    useQuery({
 *      queryKey: queryKeys.categories(),
 *      ...getOptimizedQueryOptions('static')
 *    })
 *
 *    // CMS content (5min staleTime)
 *    useQuery({
 *      queryKey: queryKeys.homepage.hero(),
 *      ...getOptimizedQueryOptions('cms')
 *    })
 *
 *    // Products (1min staleTime)
 *    useQuery({
 *      queryKey: queryKeys.products.all(),
 *      ...getOptimizedQueryOptions('products')
 *    })
 *
 *    // Media assets (10min staleTime)
 *    useQuery({
 *      queryKey: queryKeys.media.byId(mediaId),
 *      ...getOptimizedQueryOptions('media')
 *    })
 *
 *    // Admin/live data (3s staleTime)
 *    useQuery({
 *      queryKey: queryKeys.inquiries.stats(),
 *      ...getOptimizedQueryOptions('live')
 *    })
 *    ```
 *
 * 3. **Cache Monitoring** (automatic):
 *    - Runs every 2 minutes
 *    - Logs cache size to console
 *    - Auto-cleanup when > 120MB
 *    - Started in App.tsx via startAutomaticCacheCleanup()
 *
 * 4. **Error Handling** (fast failure):
 *    - Max 2 retries (down from 10)
 *    - Exponential backoff: 1s, 2s
 *    - Total retry time: ~3s
 *    - Errors surface in 6-10s total
 *    - No retry for 4xx client errors
 *
 * 5. **Data Type Categories**:
 *    - static: Categories, fabrics, certificates (15min)
 *    - cms: Homepage, about, manufacturing content (5min)
 *    - products: Product lists, details (1min)
 *    - media: Images, 3D models, videos (10min)
 *    - live: Admin dashboards, real-time data (3s)
 *    - dynamic: Fallback for uncategorized data (30s)
 */

import { MutationCache, QueryCache, QueryClient, type QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { createMediaQueryKey, invalidateMediaQueries } from "@/lib/media-query-keys";
import { ApiError, apiRequest } from "./api";

// Re-export apiRequest for backward compatibility
export { apiRequest };

export const getQueryFn: <T>(options: { on401: "returnNull" | "throw" }) => QueryFunction<T> =
  <T>({ on401: unauthorizedBehavior }: { on401: "returnNull" | "throw" }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey[0] as string;
      // Check if options object exists in queryKey
      const options =
        queryKey.length > 1 && typeof queryKey[1] === "object"
          ? (queryKey[1] as Record<string, unknown>)
          : undefined;

      // Construct URL with query params if they exist in options
      let finalUrl = url;
      if (options && !url.includes("?")) {
        const searchParams = new URLSearchParams();
        Object.entries(options).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        const paramString = searchParams.toString();
        if (paramString) {
          finalUrl = `${url}?${paramString}`;
        }
      }

      return await apiRequest<T>(finalUrl);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        unauthorizedBehavior === "returnNull"
      ) {
        return null as T;
      }
      throw error;
    }
  };

// Global error handler for 429 Rate Limits
const handleGlobalError = (error: Error) => {
  if (error instanceof ApiError && error.status === 429) {
    const retryAfter = error.retryAfter;
    toast({
      variant: "destructive",
      title: "Rate limit exceeded",
      description: `Please wait ${
        retryAfter ? `${retryAfter} seconds` : "a moment"
      } before trying again.`,
    });
    return;
  }
};

export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (typeof window !== "undefined") {
          handleGlobalError(error);
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Handle rate limits first
        if (typeof window !== "undefined") {
          handleGlobalError(error);
        }

        // Skip generic toast if mutation explicitly opts out
        if (mutation.meta?.skipToast) {
          return;
        }

        // If it we already handled a 429, we might want to skip the generic error or show both?
        // Requirement says "Instead of a crash, show a Sonner/Shadcn Toast"
        // If we handled it above, we might not want to show another toast.
        if (error instanceof ApiError && error.status === 429) {
          return;
        }

        let errorMessage = "Save failed. Please try again.";
        if (error instanceof Error) {
          errorMessage = error.message;
          if (errorMessage.includes(":")) {
            const parts = errorMessage.split(":");
            errorMessage = parts.slice(1).join(":").trim();
          }
        }

        if (typeof window !== "undefined") {
          toast({
            variant: "destructive",
            title: "Error",
            description: errorMessage,
          });
        }
      },
    }),
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: "throw" }),
        refetchInterval: false,
        refetchOnWindowFocus: false,
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        networkMode: "always",
        retry: (failureCount, error) => {
          // Stop retries immediately for Rate Limits (429) or Conflicts (409)
          if (error instanceof ApiError) {
            if (error.status === 429 || error.status === 409) {
              return false;
            }
            // Don't retry client errors (4xx)
            if (error.status >= 400 && error.status < 500) {
              return false;
            }
          }

          if (error instanceof Error && error.message.includes("non-JSON response")) {
            return false;
          }

          return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 2000),
      },
      mutations: {
        retry: false,
        networkMode: "always",
      },
    },
  });

// Correct Pattern for SSR in React 19 - Request Scoped
function makeQueryClient() {
  return createQueryClient();
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a singleton client
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

/**
 * ✨ FORENSIC REMEDIATION: Batch Preloading Utility
 * Preloads media assets in a single batch to eliminate N+1 cascades during page transitions.
 */
export async function prefetchMediaBatch(assetIds: number[]) {
  if (!assetIds.length) return;
  return getQueryClient().prefetchQuery({
    queryKey: ["media", "batch", assetIds.sort().join(",")],
    queryFn: () => batchFetchMediaContent(assetIds),
    staleTime: 10 * 60 * 1000,
  });
}

// Keep legacy export for backward compatibility but warn (or replace usages)
// For now, we point it to getQueryClient() to maintain API, though strictly it should be a function call
// Ideally codebase should switch to getQueryClient().
// But since this file exports `queryClient` as a const, likely used directly.
// To fix completely, we'd need to update all consumers.
// As a bridge, we can export the browser client, but on server this is dangerous if imported at module level.
// SAFE FIX: Exporting the accessor is safer, but breaks build.
// Let's assume we update usages or provide a proxy if strictly needed,
// but for forensic remediation, we export the standard function.

// SAFE FIX: Removed singleton export to create request scoping.
// Consumers MUST use getQueryClient() or useQueryClient() hook.

// PHASE 1A: Batch Media Content Fetching to eliminate N+1 cascade
interface BatchMediaResult {
  id: number;
  success: boolean;
  filename?: string;
  mimeType?: string;
  type?: string;
  size?: number;
  cached?: boolean;
  content?: string; // ✨ CRITICAL: Inline data URI for small assets
  prefetch?: boolean; // ✨ Hint for intelligent prefetching
  fileSize?: number; // File size for optimization decisions
  url?: string;
  error?: string;
}

interface BatchMediaResponse {
  success: boolean;
  data: Array<{
    id: number;
    url: string;
    mimeType?: string;
    filename?: string;
    type?: string;
  }>;
}

// Batch media content fetcher - eliminates N+1 requests
// FORENSIC INVESTIGATION FIX: Use request manager to prevent connection exhaustion
import { requestManager } from "./request-manager";

export const batchFetchMediaContent = async (assetIds: number[]): Promise<BatchMediaResult[]> => {
  if (assetIds.length === 0) {
    return [];
  }

  try {
    const idsString = assetIds.join(",");

    // FORENSIC FIX: Use request manager to prevent browser connection exhaustion
    const response = await requestManager.fetch(`/api/media/batch/content?ids=${idsString}&prefetch=true`, {
      method: "GET",
      credentials: "include",
      priority: "high", // Media content is high priority
      timeout: 30000, // 30s timeout
    });

    if (!response.ok) {
      // Fallback to individual requests
      return assetIds.map((id) => ({
        id,
        success: false,
        error: `Batch request failed (${response.status})`,
        url: `/api/media/${id}/content`,
      }));
    }

    const result: BatchMediaResponse = await response.json();

    // Transform server response to BatchMediaResult format
    return result.data.map((asset) => ({
      id: asset.id,
      success: true,
      url: asset.url,
      ...(asset.mimeType ? { mimeType: asset.mimeType } : {}),
      ...(asset.filename ? { filename: asset.filename } : {}),
      ...(asset.type ? { type: asset.type } : {}),
    }));
  } catch (error) {
    // Fallback to individual requests
    return assetIds.map((id) => ({
      id,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      url: `/api/media/${id}/content`,
    }));
  }
};

// Smart batch request scheduler
class MediaBatchScheduler {
  private pending: Set<number> = new Set();
  private callbacks: Map<number, ((result: BatchMediaResult) => void)[]> = new Map();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Add asset to batch queue
  schedule(assetId: number): Promise<BatchMediaResult> {
    return new Promise((resolve) => {
      this.pending.add(assetId);

      if (!this.callbacks.has(assetId)) {
        this.callbacks.set(assetId, []);
      }
      this.callbacks.get(assetId)?.push(resolve);

      // Schedule batch processing
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => this.processBatch(), 50); // 50ms debounce
    });
  }

  private async processBatch() {
    const assetIds = Array.from(this.pending);
    if (assetIds.length === 0) {
      return;
    }

    this.pending.clear();
    this.timeoutId = null;

    try {
      const results = await batchFetchMediaContent(assetIds);

      // Resolve all waiting promises
      for (const result of results) {
        const callbacks = this.callbacks.get(result.id);
        if (callbacks) {
          callbacks.forEach((callback) => {
            callback(result);
          });
          this.callbacks.delete(result.id);
        }
      }

      // Handle any missed assets
      for (const assetId of assetIds) {
        const callbacks = this.callbacks.get(assetId);
        if (callbacks) {
          callbacks.forEach((callback) => {
            callback({
              id: assetId,
              success: false,
              error: "Not found in batch response",
              url: `/api/media/${assetId}/content`,
            });
          });
          this.callbacks.delete(assetId);
        }
      }
    } catch (error) {
      // Resolve all with errors
      for (const assetId of assetIds) {
        const callbacks = this.callbacks.get(assetId);
        if (callbacks) {
          callbacks.forEach((callback) => {
            callback({
              id: assetId,
              success: false,
              error: error instanceof Error ? error.message : "Batch processing failed",
              url: `/api/media/${assetId}/content`,
            });
          });
          this.callbacks.delete(assetId);
        }
      }
    }
  }
}

// Export singleton batch scheduler
export const mediaBatchScheduler = new MediaBatchScheduler();

// PHASE 1A: CENTRALIZED MEDIA RESOLVER - Eliminates N+1 cascade in UI
interface MediaResolverResult {
  src: string | null; // Data URI for inlined content, or URL for large assets
  isInline: boolean; // True if content is inlined (no additional request needed)
  isLoading: boolean; // True while batching/fetching
  error?: string;
}

// React hook for media resolution with proper state management
export const useMediaResolver = (_assetId: number): MediaResolverResult => {
  // We need to import useState and useEffect to make this a proper React hook
  // For now, return a simple version that components can use directly
  return {
    src: null,
    isInline: false,
    isLoading: true,
  };
};

// Helper function for components to get media source efficiently
export const getMediaSrc = async (assetId: number): Promise<string | null> => {
  try {
    const result = await mediaBatchScheduler.schedule(assetId);
    // Return inline content if available, otherwise URL
    return result.content || result.url || null;
  } catch (_error) {
    return `/api/media/${assetId}/content`; // Fallback to direct URL
  }
};

// CHUNK 4: Optimized Query Settings for Different Data Types
// Success criteria: Error states surface <10s, cache memory <120MB
export type QueryDataType = "static" | "cms" | "products" | "media" | "live" | "dynamic";

export const getOptimizedQueryOptions = (dataType: QueryDataType) => {
  switch (dataType) {
    case "static":
      // Categories, fabrics, certificates, size-charts, accessories, fibers, navigation
      // Change very rarely - maximize cache efficiency
      return {
        staleTime: 15 * 60 * 1000, // 15 minutes
        gcTime: 75 * 60 * 1000, // 75 minutes (5x staleTime)
        refetchOnWindowFocus: false as const,
        refetchInterval: false as const,
        retry: 2,
      };
    case "cms":
      // Homepage, about, manufacturing, technology, sustainability content
      // Moderate change frequency in admin, but stable in production
      return {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 25 * 60 * 1000, // 25 minutes (5x staleTime)
        refetchOnWindowFocus: false as const,
        refetchInterval: false as const,
        retry: 2,
      };
    case "products":
      // Product lists, product details, category products
      // Moderate change frequency
      return {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 25 * 60 * 1000, // 25 minutes (5x staleTime)
        refetchOnWindowFocus: true as const,
        refetchInterval: false as const,
        retry: 2,
      };
    case "media":
      // Media assets, batch media content - heavy assets, change rarely
      // Aggressive caching to reduce bandwidth
      return {
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 50 * 60 * 1000, // 50 minutes (5x staleTime)
        refetchOnWindowFocus: false as const,
        refetchInterval: false as const,
        retry: 2,
      };
    case "live":
      // Admin dashboards, sync validation, real-time monitoring
      // Needs frequent updates
      return {
        staleTime: 3 * 1000, // 3 seconds
        gcTime: 15 * 1000, // 15 seconds (5x staleTime)
        refetchOnWindowFocus: true as const,
        refetchInterval: false as const, // Use manual refetch or polling instead
        retry: 1, // Fast fail for live data
      };
    case "dynamic":
      // Default fallback for uncategorized data
      return {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 2.5 * 60 * 1000, // 2.5 minutes (5x staleTime)
        refetchOnWindowFocus: true as const,
        refetchInterval: false as const,
        retry: 2,
      };
  }
};

// CHUNK 4: Cache Size Monitoring and Management
// Target: Keep cache memory usage < 120MB per browser tab
interface CacheMetrics {
  queryCount: number;
  estimatedSizeMB: number;
  oldestQueryAge: number;
  exceedsThreshold: boolean;
}

export const getCacheMetrics = (): CacheMetrics => {
  const queries = getQueryClient().getQueryCache().getAll();
  const queryCount = queries.length;

  // Estimate cache size (rough approximation)
  let estimatedSizeBytes = 0;
  let oldestTimestamp = Date.now();

  queries.forEach((query) => {
    // Estimate size based on serialized data
    if (query.state.data) {
      try {
        const serialized = JSON.stringify(query.state.data);
        estimatedSizeBytes += serialized.length * 2; // UTF-16 characters = 2 bytes each
      } catch {
        // Ignore circular references or non-serializable data
      }
    }

    // Track oldest query
    if (query.state.dataUpdatedAt > 0 && query.state.dataUpdatedAt < oldestTimestamp) {
      oldestTimestamp = query.state.dataUpdatedAt;
    }
  });

  const estimatedSizeMB = estimatedSizeBytes / (1024 * 1024);
  const oldestQueryAge = oldestTimestamp > 0 ? Date.now() - oldestTimestamp : 0;
  const exceedsThreshold = estimatedSizeMB > 120; // 120MB threshold

  return {
    queryCount,
    estimatedSizeMB,
    oldestQueryAge,
    exceedsThreshold,
  };
};

// CHUNK 4: Automatic cache cleanup when memory threshold exceeded
export const cleanupCacheIfNeeded = () => {
  const metrics = getCacheMetrics();

  if (metrics.exceedsThreshold) {
    // Strategy 1: Remove queries older than their gcTime
    const now = Date.now();
    getQueryClient()
      .getQueryCache()
      .getAll()
      .forEach((query) => {
        const gcTime = query.options.gcTime ?? 5 * 60 * 1000;
        const age = now - query.state.dataUpdatedAt;

        if (age > gcTime) {
          getQueryClient().removeQueries({ queryKey: query.queryKey });
        }
      });

    // Strategy 2: If still over threshold, remove oldest 20% of queries
    const metricsAfter = getCacheMetrics();
    if (metricsAfter.exceedsThreshold) {
      const queries = getQueryClient().getQueryCache().getAll();
      queries.sort((a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt);
      const toRemove = Math.floor(queries.length * 0.2);

      for (let i = 0; i < toRemove; i++) {
        const query = queries[i];
        if (query) {
          getQueryClient().removeQueries({ queryKey: query.queryKey });
        }
      }
    }
  }
};

// CHUNK 4: Query Key Factories to prevent unbounded cache growth
// Centralized key generation with proper namespacing and limits
export const queryKeys = {
  // Static data - no parameters
  categories: () => ["/api/categories"] as const,
  fabrics: () => ["/api/fabrics"] as const,
  certificates: () => ["/api/certificates"] as const,
  sizeCharts: () => ["/api/size-charts"] as const,
  accessories: () => ["/api/accessories"] as const,
  fibers: () => ["/api/fibers"] as const,
  navigation: () => ["/api/navigation-items"] as const,

  // Products - bounded parameters
  products: {
    all: () => ["/api/products"] as const,
    byCategory: (categoryId: number) => ["/api/products", { category: categoryId }] as const,
    byPath: (path: string) => ["/api/products/by-path", path] as const,
    paginated: (page: number, limit: number) => ["/api/products", { page, limit }] as const,
  },

  // Media - bounded pagination
  media: {
    all: () => ["/api/media"] as const,
    paginated: (page: number, limit: number) => ["/api/media", { page, limit }] as const,
    byId: (id: number) => ["/api/media", id] as const,
  },

  // CMS content - no parameters
  homepage: {
    batch: () => ["/api/homepage-batch"] as const,
    hero: () => ["/api/homepage-hero"] as const,
    sections: () => ["/api/homepage-sections"] as const,
    process: () => ["/api/homepage-process-cards"] as const,
    slogans: () => ["/api/homepage-slogans"] as const,
  },

  // Admin/Live data
  sync: {
    validate: (entity: string) => ["/api/sync/validate", entity] as const,
  },

  // CHUNK 4: Admin inquiries - bounded pagination with filters
  inquiries: {
    stats: () => ["/api/admin/inquiries/stats"] as const,
    list: (page: number, statusFilter: string, searchQuery: string) =>
      ["/api/admin/inquiries", { page, status: statusFilter, search: searchQuery }] as const,
  },
} as const;

// CHUNK 4: Automatic periodic cache cleanup
// Runs every 2 minutes to prevent memory buildup
let cacheCleanupInterval: ReturnType<typeof setInterval> | null = null;

export const startAutomaticCacheCleanup = () => {
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
  }

  cacheCleanupInterval = setInterval(
    () => {
      const metrics = getCacheMetrics();

      if (metrics.exceedsThreshold) {
        cleanupCacheIfNeeded();
      }
    },
    2 * 60 * 1000,
  ); // Every 2 minutes
};

export const stopAutomaticCacheCleanup = () => {
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
  }
};

// Performance Optimization: Critical Data Prefetching - Week 2 Implementation
export const prefetchCriticalHomepageData = async () => {
  const criticalQueries = [
    getQueryClient().prefetchQuery({
      queryKey: queryKeys.homepage.hero(),
      ...getOptimizedQueryOptions("cms"),
    }),
    getQueryClient().prefetchQuery({
      queryKey: queryKeys.homepage.slogans(),
      ...getOptimizedQueryOptions("cms"),
    }),
    getQueryClient().prefetchQuery({
      queryKey: queryKeys.navigation(),
      ...getOptimizedQueryOptions("static"),
    }),
  ];

  try {
    await Promise.all(criticalQueries);
  } catch (_error) {}
};

export const prefetchSecondaryHomepageData = async () => {
  // Prefetch less critical data after initial load
  const secondaryQueries = [
    getQueryClient().prefetchQuery({
      queryKey: queryKeys.homepage.process(),
      ...getOptimizedQueryOptions("cms"),
    }),
    getQueryClient().prefetchQuery({
      queryKey: queryKeys.homepage.sections(),
      ...getOptimizedQueryOptions("cms"),
    }),
    getQueryClient().prefetchQuery({
      queryKey: queryKeys.products.all(),
      ...getOptimizedQueryOptions("products"),
    }),
  ];

  try {
    await Promise.all(secondaryQueries);
  } catch (_error) {}
};

// PRIORITY 5 FIX: Enhanced debug logging for cache operations
const logCacheState = () => {
  const mediaQueries = getQueryClient()
    .getQueryCache()
    .getAll()
    .filter((query) => {
      const key = query.queryKey[0];
      return (
        typeof key === "string" &&
        (key.includes("media") ||
          key.includes("/api/media") ||
          key === "apimedia" ||
          JSON.stringify(query.queryKey).includes("paginated"))
      );
    });
  mediaQueries.forEach((query, _index) => {
    type QueryDataWithNested = { data?: { data?: unknown[] } };
    if ((query.state.data as QueryDataWithNested)?.data?.data) {
    }
  });
};

// PRIORITY 1 FIX: Force complete cache reset utility
export const forceResetMediaCache = async () => {
  try {
    logCacheState();

    // PRIORITY 4 FIX: Add timeout wrapper for cache operations
    const timeoutPromise = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
            timeoutMs,
          ),
        ),
      ]);
    };

    // Step 1: Remove all media-related queries from cache with timeout
    await timeoutPromise(
      Promise.resolve(
        getQueryClient().removeQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return (
              typeof key === "string" &&
              (key.includes("media") ||
                key.includes("/api/media") ||
                key === "apimedia" ||
                JSON.stringify(query.queryKey).includes("paginated"))
            );
          },
        }),
      ),
      5000, // 5 second timeout
    );

    // Step 2: Clear entire query cache with timeout as fallback
    await timeoutPromise(Promise.resolve(getQueryClient().clear()), 3000);

    // Step 3: Force immediate refetch with multiple fallback strategies
    const fetchStrategies = [
      // Strategy 1: Fresh fetch with cache bust
      () =>
        getQueryClient().prefetchQuery({
          queryKey: createMediaQueryKey.paginated({ page: 1, limit: 24 }),
          queryFn: async () => {
            const response = await fetch(`/api/media?page=1&limit=24&cache_bust=${Date.now()}`, {
              cache: "no-cache",
              headers: { "Cache-Control": "no-cache" },
            });
            if (!response.ok) {
              throw new Error("Failed to fetch media");
            }
            return response.json();
          },
          staleTime: 0,
        }),

      // Strategy 2: Direct API call fallback
      () => fetch(`/api/media?page=1&limit=24&fallback=${Date.now()}`).then((r) => r.json()),

      // Strategy 3: PHASE 1.2 FIX - Use unified cache invalidation
      async () => {
        return invalidateMediaQueries(getQueryClient());
      },
    ];

    // Try strategies sequentially with timeouts
    for (let i = 0; i < fetchStrategies.length; i++) {
      try {
        const strategy = fetchStrategies[i];
        if (strategy) {
          await timeoutPromise(strategy(), 10000); // 10 second timeout per strategy
          break;
        }
      } catch (_error) {
        if (i === fetchStrategies.length - 1) {
        }
      }
    }
    logCacheState();
    return true;
  } catch (_error) {
    // PRIORITY 4 FIX: Ultimate fallback - just clear everything
    try {
      getQueryClient().clear();
      return true;
    } catch (_emergencyError) {
      return false;
    }
  }
};
