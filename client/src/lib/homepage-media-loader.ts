/**
 * Homepage Media Loader - Smart batch loading with lazy loading for optimal performance
 * Phase 1 Optimization: Intersection observer + smart batching for 75+ media assets
 */

import type { MediaAsset } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

// Partial media type for batch endpoint responses
type BatchMediaAsset = Pick<MediaAsset, "id" | "filename" | "type" | "mimeType" | "url"> & {
  size: number | null;
  content?: string;
  cached?: boolean;
  prefetch?: boolean;
};

interface MediaBatch {
  data: MediaAsset[];
  totalCount: number;
  hasMore: boolean;
  currentBatch: number;
}

interface LazyMediaLoaderOptions {
  initialBatchSize: number;
  additionalBatchSize: number;
  preloadHeroAssets: boolean;
  enableIntersectionObserver: boolean;
  // NEW: Targeted loading mode
  targetedLoading?: boolean;
  extractedMediaIds?: number[];
}

/**
 * Smart batch media loader with intersection observer support
 */
export function useHomepageMediaLoader(
  heroMediaId?: number,
  processCardMediaIds: number[] = [],
  productMediaIds: number[] = [],
  options: LazyMediaLoaderOptions = {
    initialBatchSize: 20,
    additionalBatchSize: 15,
    preloadHeroAssets: true,
    enableIntersectionObserver: true,
  },
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [allLoadedAssets, setAllLoadedAssets] = useState<MediaAsset[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  // HOOK ORDER FIX: Always use consistent queryKey structure
  const { data: initialBatch, isLoading: isInitialLoading } = useQuery<MediaBatch>({
    queryKey: [
      "/api/media/homepage-loader",
      options.targetedLoading ? "targeted" : "paginated",
      options.targetedLoading ? options.extractedMediaIds : currentPage,
      options.initialBatchSize,
    ],
    queryFn: async (): Promise<MediaBatch> => {
      // TARGETED LOADING MODE: Load only referenced media IDs
      if (options.targetedLoading && options.extractedMediaIds?.length) {
        // PHASE 1A+1B: Use enhanced batch content endpoint with inlining
        const response = await fetch(
          `/api/media/batch/content?ids=${options.extractedMediaIds.join(",")}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load targeted media assets");
        }

        const result = await response.json();

        // PHASE 1A+1B: Enhanced batch response with content inlining
        // Backend returns { success: true, data: [...] } - data is the array directly
        const responseData = Array.isArray(result.data) ? result.data : [];

        const batchAssets: BatchMediaAsset[] = responseData
          .filter((r: { id?: number }) => r.id) // Filter out null entries
          .map(
            (r: {
              id: number;
              url?: string;
              mimeType?: string;
              content?: string;
            }): BatchMediaAsset => ({
              id: r.id,
              filename: `asset-${r.id}`,
              mimeType: r.mimeType || "application/octet-stream",
              type: r.mimeType?.startsWith("image/") ? "image" : "unknown",
              size: null,
              url: r.content
                ? `data:${r.mimeType};base64,${r.content}`
                : r.url || `/api/media/${r.id}/content`,
              content: r.content,
              cached: true,
              prefetch: true,
            }),
          );

        // Convert to MediaAsset with minimal required fields for rendering
        const assets: MediaAsset[] = batchAssets.map((b) => ({
          ...b,
          originalName: b.filename,
          fileSize: b.size,
          thumbnailUrl: null,
          thumbnailFilename: null,
          thumbnailStoragePath: null,
          imageVariants: null,
          storagePath: `/media/${b.id}`,
          bucketName: "default",
          width: null,
          height: null,
          caption: null,
          altText: null,
          blurhash: null,
          processing: false,
          processingProgress: null,
          processingError: null,
          metadata: {},
          tags: null,
          isPublic: true,
          isActive: true,
          folderId: null,
          downloadCount: 0,
          lastAccessedAt: null,
          deletedAt: null,
          uploadedAt: null,
          updatedAt: null,
          createdAt: null,
        }));

        return {
          data: assets,
          totalCount: assets.length,
          hasMore: false, // No pagination in targeted mode
          currentBatch: 1,
        };
      }

      // LEGACY PAGINATED MODE: Load with priority hints
      const priorityIds = new Set<number>();

      if (heroMediaId && options.preloadHeroAssets) {
        priorityIds.add(heroMediaId);
      }

      // Add first few process card and product media IDs as priority
      processCardMediaIds.slice(0, 4).forEach((id) => priorityIds.add(id));
      productMediaIds.slice(0, 6).forEach((id) => priorityIds.add(id));

      // Request with priority hint
      const priorityParam = Array.from(priorityIds).join(",");
      const url = `/api/media?page=${currentPage}&limit=${options.initialBatchSize}${priorityParam ? `&priority=${priorityParam}` : ""}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to load media batch");
      }

      const result = await response.json();

      return {
        data: Array.isArray(result.data) ? result.data : [],
        totalCount: result.totalCount || 0,
        hasMore: result.hasMore !== false,
        currentBatch: currentPage,
      };
    },
    // Only fetch when we have media IDs in targeted mode
    enabled:
      !options.targetedLoading ||
      (options.extractedMediaIds && options.extractedMediaIds.length > 0),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Load additional batches when needed
  const loadMoreAssets = useCallback(async () => {
    if (isLoadingMore || hasReachedEnd || !initialBatch?.hasMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const response = await fetch(
        `/api/media?page=${nextPage}&limit=${options.additionalBatchSize}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load more media assets");
      }

      const result = await response.json();
      const newAssets = Array.isArray(result.data) ? result.data : [];

      if (newAssets.length === 0) {
        setHasReachedEnd(true);
      } else {
        setAllLoadedAssets((prev) => [...prev, ...newAssets]);
        setCurrentPage(nextPage);

        // Check if we've reached the end
        if (!result.hasMore || newAssets.length < options.additionalBatchSize) {
          setHasReachedEnd(true);
        }
      }
    } catch (_error) {
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    currentPage,
    isLoadingMore,
    hasReachedEnd,
    initialBatch?.hasMore,
    options.additionalBatchSize,
  ]);

  // Combine initial batch with additionally loaded assets
  const allAssets = [...(initialBatch?.data || []), ...allLoadedAssets];

  // Initialize with first batch
  useEffect(() => {
    if (initialBatch?.data && allLoadedAssets.length === 0) {
      // Assets are managed in initialBatch, no need to duplicate in allLoadedAssets
    }
  }, [initialBatch?.data, allLoadedAssets.length]);

  return {
    assets: allAssets,
    isInitialLoading,
    isLoadingMore,
    hasMore: !hasReachedEnd && initialBatch?.hasMore !== false,
    totalCount: initialBatch?.totalCount || 0,
    loadMoreAssets,

    // Helper functions
    getAssetById: (id: number) => allAssets.find((asset) => asset.id === id),
    getAssetsByIds: (ids: number[]) =>
      ids.map((id) => allAssets.find((asset) => asset.id === id)).filter(Boolean) as MediaAsset[],

    // Stats for monitoring
    loadedCount: allAssets.length,
    currentBatch: currentPage,
  };
}

/**
 * Intersection Observer hook for lazy loading sections
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {},
) {
  const [targetRef, setTargetRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!targetRef || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        rootMargin: "100px", // Load 100px before the element becomes visible
        threshold: 0.1,
        ...options,
      },
    );

    observer.observe(targetRef);

    return () => {
      observer.disconnect();
    };
  }, [targetRef, callback, options]);

  return setTargetRef;
}

/**
 * Create optimized media URL with lazy loading hints
 */
export function getOptimizedMediaUrl(
  asset: MediaAsset | null | undefined,
  lazy = false,
): string | null {
  if (!asset) return null;

  // Use existing proxy URL
  const baseUrl = `/api/media/${asset.id}/content`;

  // Add lazy loading hints for videos
  if (lazy && asset.type === "video") {
    return `${baseUrl}?lazy=true&preload=none`;
  }

  // Add thumbnail hint for large images when lazy loading
  if (lazy && asset.type === "image" && asset.size && asset.size > 2 * 1024 * 1024) {
    // > 2MB
    return `${baseUrl}?lazy=true&quality=80`;
  }

  return baseUrl;
}

/**
 * Prioritize assets for loading order
 */
export function prioritizeAssets(
  assets: MediaAsset[],
  heroMediaId?: number,
  criticalMediaIds: number[] = [],
): MediaAsset[] {
  const priorityMap = new Map<number, number>();

  // Highest priority: Hero media
  if (heroMediaId) {
    priorityMap.set(heroMediaId, 1);
  }

  // High priority: Critical media (process cards, featured products)
  criticalMediaIds.forEach((id, index) => {
    priorityMap.set(id, 2 + index * 0.1);
  });

  return [...assets].sort((a, b) => {
    const priorityA = priorityMap.get(a.id) || 999;
    const priorityB = priorityMap.get(b.id) || 999;

    // Lower number = higher priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Secondary sort: Videos after images for faster initial load
    if (a.type !== b.type) {
      if (a.type === "image" && b.type === "video") return -1;
      if (a.type === "video" && b.type === "image") return 1;
    }

    // Tertiary sort: Smaller files first
    return (a.size || 0) - (b.size || 0);
  });
}
