/**
 * Frontend Optimized Media Hooks
 * React hooks for optimized media loading
 */

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createMediaQueryKey } from "@/lib/media-query-keys";

interface MediaVariant {
  width: number;
  url: string;
  size: string;
  format: string;
  optimized: boolean;
}

interface MediaOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpg" | "png";
  priority?: boolean;
}

interface OptimizedMediaUrls {
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  original: string;
}

interface UseOptimizedMediaResult {
  urls: OptimizedMediaUrls | null;
  srcSet: string | undefined;
  loading: boolean;
  error: boolean;
  variants: MediaVariant[];
  loadTime: number;
}

export function useOptimizedMedia(
  mediaId: number,
  options: MediaOptimizationOptions = {},
): UseOptimizedMediaResult {
  const [loadTime, setLoadTime] = useState(0);

  const {
    data: mediaData,
    isLoading,
    error,
  } = useQuery({
    queryKey: createMediaQueryKey.variants(mediaId, options),
    enabled: mediaId > 0 && mediaId < 1000000000000, // Only query for valid database IDs
    queryFn: async () => {
      const startTime = performance.now();

      // Skip the CDN fetch and use batch media system directly

      // Skip optimistic entries (timestamp-based IDs > 1000000000000)
      if (mediaId > 1000000000000) {
        throw new Error("Optimistic entry - no URL available yet");
      }

      // Use batch system directly - it's already optimized and working
      const { getMediaSrc } = await import("@/lib/queryClient");
      const batchedUrl = await getMediaSrc(mediaId);

      const endTime = performance.now();
      setLoadTime(endTime - startTime);

      return {
        variants: [
          {
            width: 800,
            url: batchedUrl || `/api/media/${mediaId}/content`,
            size: "800w",
            format: "jpg",
            optimized: false,
          },
        ],
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const urls = mediaData?.variants ? generateOptimizedUrls(mediaData.variants) : null;
  const srcSet = mediaData?.variants ? generateSrcSet(mediaData.variants) : undefined;

  return {
    urls,
    srcSet,
    loading: isLoading,
    error: !!error,
    variants: mediaData?.variants || [],
    loadTime,
  };
}

function generateOptimizedUrls(variants: MediaVariant[]): OptimizedMediaUrls {
  const fallbackUrl = variants[0]?.url || "";

  return {
    thumbnail: variants.find((v) => v.width === 400)?.url || fallbackUrl,
    small: variants.find((v) => v.width === 600)?.url || fallbackUrl,
    medium: variants.find((v) => v.width === 800)?.url || fallbackUrl,
    large: variants.find((v) => v.width === 1200)?.url || fallbackUrl,
    original: variants.find((v) => v.width === 1600)?.url || fallbackUrl,
  };
}

function generateSrcSet(variants: MediaVariant[]): string {
  return variants
    .filter((v) => v.format === "webp") // Prefer WebP
    .sort((a, b) => a.width - b.width)
    .map((v) => `${v.url} ${v.width}w`)
    .join(", ");
}

// Progressive image loading hook
export function useProgressiveImageLoading(
  mediaId: number,
  options: MediaOptimizationOptions = {},
) {
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const { urls, loading } = useOptimizedMedia(mediaId, options);

  useEffect(() => {
    if (!urls) return;

    // Start with thumbnail for instant loading
    setCurrentSrc(urls.thumbnail);

    // Preload medium quality image
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(urls.medium);
      setIsLoaded(true);
    };
    img.src = urls.medium;
  }, [urls]);

  return {
    src: currentSrc,
    isLoaded,
    loading,
    urls,
  };
}

// Smart image preloading
export function useImagePreloader(mediaIds: number[]) {
  const [preloadedIds, setPreloadedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const preloadImages = async () => {
      // PHASE 4 FIX: Use batch media system directly instead of non-existent CDN endpoint
      const { getMediaSrc } = await import("@/lib/queryClient");

      for (const mediaId of Array.from(mediaIds)) {
        if (preloadedIds.has(mediaId)) continue;

        try {
          // Preload using batch system
          const url = await getMediaSrc(mediaId);

          if (url) {
            const img = new Image();
            img.src = url;
            setPreloadedIds((prev) => new Set([...prev, mediaId]));
          }
        } catch (error) {
          console.warn(`[Optimized Media] Preload failed for media ${mediaId}`);
        }
      }
    };

    // Use requestIdleCallback for non-blocking preloading
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => preloadImages());
    } else {
      setTimeout(preloadImages, 100);
    }
  }, [mediaIds, preloadedIds]);

  return { preloadedIds };
}

// Performance monitoring hook
export function useMediaPerformanceMonitor() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
    optimizedCount: 0,
  });

  const recordLoadTime = (mediaId: number, loadTime: number, fromCache: boolean) => {
    setStats((prev) => ({
      totalRequests: prev.totalRequests + 1,
      averageLoadTime:
        (prev.averageLoadTime * prev.totalRequests + loadTime) / (prev.totalRequests + 1),
      cacheHitRate: fromCache ? prev.cacheHitRate + 1 : prev.cacheHitRate,
      optimizedCount: prev.optimizedCount + 1,
    }));

    // Send to performance tracking
    type WindowWithGtag = Window & { gtag?: (...args: unknown[]) => void };
    if (typeof window !== "undefined" && (window as WindowWithGtag).gtag) {
      (window as WindowWithGtag).gtag?.("event", "media_performance", {
        media_id: mediaId,
        load_time: loadTime,
        from_cache: fromCache,
        category: "cdn_optimized",
      });
    }
  };

  return { stats, recordLoadTime };
}
