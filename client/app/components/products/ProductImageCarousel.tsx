import { ChevronLeft, ChevronRight, LayoutGrid, Play } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: number;
  type: "image" | "video";
  url?: string;
}

interface ProductImageCarouselProps {
  images: MediaItem[];
  primaryVideo?: MediaItem | null;
  productName: string;
  viewMode?: string;
  getOptimizedUrl?: (mediaId: number) => string | undefined;
}

export const ProductImageCarousel: React.FC<ProductImageCarouselProps> = ({
  images,
  primaryVideo,
  productName,
  viewMode = "medium",
  getOptimizedUrl,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [isNavigating, setIsNavigating] = useState(false);

  const navTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
      loadTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const hasVideo = !!primaryVideo;
  const totalItems = (hasVideo ? 1 : 0) + images.length;
  const showVideo = hasVideo && currentImageIndex === 0;
  const imageIndex = hasVideo ? currentImageIndex - 1 : currentImageIndex;

  const getMediaUrl = (mediaId: number) => {
    return getOptimizedUrl?.(mediaId) || MediaUrlBuilder.buildUrlSafe(mediaId);
  };

  const setNavTimeout = () => {
    if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    navTimeoutRef.current = setTimeout(() => setIsNavigating(false), 200);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNavigating || totalItems <= 1) {
      return;
    }

    setCurrentImageIndex((prev) => (prev + 1) % totalItems);
    setIsNavigating(true);
    setNavTimeout();
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNavigating || totalItems <= 1) {
      return;
    }

    setCurrentImageIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setIsNavigating(true);
    setNavTimeout();
  };

  const goToIndex = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNavigating || index === currentImageIndex) {
      return;
    }

    setCurrentImageIndex(index);
    setIsNavigating(true);
    setNavTimeout();
  };

  const handleImageLoad = (imageId: number) => {
    setLoadedImages((prev) => new Set([...prev, imageId]));
    const timeout = loadTimeoutsRef.current.get(imageId);
    if (timeout) {
      clearTimeout(timeout);
      loadTimeoutsRef.current.delete(imageId);
    }
  };

  const handleImageError = (imageId: number) => {
    console.warn(`[ImageCarousel] Failed to load image ${imageId} for ${productName}`);
    setFailedImages((prev) => new Set([...prev, imageId]));
    const timeout = loadTimeoutsRef.current.get(imageId);
    if (timeout) {
      clearTimeout(timeout);
      loadTimeoutsRef.current.delete(imageId);
    }
  };

  const handleImageLoadStart = (imageId: number) => {
    const existing = loadTimeoutsRef.current.get(imageId);
    if (existing) clearTimeout(existing);

    // Safety timeout: If image doesn't load in 10s, consider it failed to prevent infinite spinner
    const timeoutId = setTimeout(() => {
      setLoadedImages((prev) => {
        if (!prev.has(imageId)) {
          setFailedImages((f) => new Set([...f, imageId]));
        }
        return prev;
      });
      loadTimeoutsRef.current.delete(imageId);
    }, 10000);

    loadTimeoutsRef.current.set(imageId, timeoutId);
  };

  if (totalItems === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
        <LayoutGrid className="h-12 w-12" />
      </div>
    );
  }

  return (
    <section
      className="group relative h-full w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`${productName} image gallery`}
    >
      {showVideo && primaryVideo ? (
        <div className="relative h-full w-full">
          <video
            src={getMediaUrl(primaryVideo.id)}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            onMouseEnter={(e) => e.currentTarget.play()}
            onMouseLeave={(e) => e.currentTarget.pause()}
            aria-label={`${productName} product video`}
            title={`${productName} product video`}
          />
          <div className="absolute top-2 right-2 rounded bg-black/70 p-1 text-white">
            <Play className="h-3 w-3" />
          </div>
        </div>
      ) : (
        images[imageIndex] && (
          <div className="relative h-full w-full">
            {!loadedImages.has(images[imageIndex]?.id) &&
              !failedImages.has(images[imageIndex]?.id) && (
                <div className="absolute inset-0 flex h-full w-full animate-pulse items-center justify-center bg-muted">
                  <LoaderState />
                </div>
              )}
            <img
              src={getMediaUrl(images[imageIndex]?.id || 0)}
              alt={productName}
              className={cn(
                "h-full w-full object-cover transition-all duration-300",
                loadedImages.has(images[imageIndex]?.id || 0)
                  ? "opacity-100 group-hover:scale-105"
                  : failedImages.has(images[imageIndex]?.id || 0)
                    ? "opacity-50 grayscale"
                    : "opacity-0",
              )}
              onLoad={() => handleImageLoad(images[imageIndex]?.id || 0)}
              onError={() => handleImageError(images[imageIndex]?.id || 0)}
              onLoadStart={() => handleImageLoadStart(images[imageIndex]?.id || 0)}
            />
            {failedImages.has(images[imageIndex]?.id || 0) && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                <LayoutGrid className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
        )
      )}

      {totalItems > 1 && (
        <>
          {viewMode !== "small" && isHovered && (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-all hover:bg-black/70"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-all hover:bg-black/70"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {Array.from({ length: totalItems }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => goToIndex(index, e)}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all duration-200",
                  currentImageIndex === index ? "scale-110 bg-white" : "bg-white/50",
                )}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

const LoaderState = () => (
  <div className="flex flex-col items-center gap-2">
    <div className="h-6 w-6 animate-spin rounded-full border-muted-foreground border-b-2" />
  </div>
);
