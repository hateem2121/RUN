import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isNavigating, setIsNavigating] = useState(false);

  const navTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const loadedImagesRef = useRef<Set<string>>(new Set());
  const failedImagesRef = useRef<Set<string>>(new Set());

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
  const currentImage = images[imageIndex];
  const imageKey =
    !showVideo && currentImage
      ? currentImage.id !== undefined && currentImage.id !== 0
        ? String(currentImage.id)
        : currentImage.url || `img-${imageIndex}`
      : null;

  const getMediaUrl = (item?: MediaItem | null) => {
    if (!item) return "/images/placeholders/product-placeholder.webp";
    if (item.url) return item.url;
    if (item.id && item.id > 0) {
      return (
        getOptimizedUrl?.(item.id) ||
        MediaUrlBuilder.buildUrlSafe(item.id) ||
        "/images/placeholders/product-placeholder.webp"
      );
    }
    return "/images/placeholders/product-placeholder.webp";
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

  const handleImageLoad = (key: string) => {
    loadedImagesRef.current.add(key);
    setLoadedImages((prev) => new Set([...prev, key]));
    const timeout = loadTimeoutsRef.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      loadTimeoutsRef.current.delete(key);
    }
  };

  const handleImageError = (key: string) => {
    console.warn(`[ImageCarousel] Failed to load image ${key} for ${productName}`);
    failedImagesRef.current.add(key);
    setFailedImages((prev) => new Set([...prev, key]));
    const timeout = loadTimeoutsRef.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      loadTimeoutsRef.current.delete(key);
    }
  };

  const handleImageLoadStart = useCallback((key: string) => {
    const existing = loadTimeoutsRef.current.get(key);
    if (existing) clearTimeout(existing);

    // Safety timeout: If image doesn't load in 3.5s, consider it failed to prevent infinite spinner
    const timeoutId = setTimeout(() => {
      if (!loadedImagesRef.current.has(key)) {
        failedImagesRef.current.add(key);
        setFailedImages((f) => new Set([...f, key]));
      }
      loadTimeoutsRef.current.delete(key);
    }, 3500);

    loadTimeoutsRef.current.set(key, timeoutId);
  }, []);

  useEffect(() => {
    if (
      imageKey &&
      !loadedImagesRef.current.has(imageKey) &&
      !failedImagesRef.current.has(imageKey)
    ) {
      handleImageLoadStart(imageKey);
    }
  }, [imageKey, handleImageLoadStart]);

  if (totalItems === 0) {
    return (
      <div className="relative h-full w-full bg-muted/20">
        <img
          src="/images/placeholders/product-placeholder.webp"
          alt={productName || "Product placeholder"}
          className="h-full w-full object-cover opacity-80"
          loading="lazy"
        />
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
            src={getMediaUrl(primaryVideo)}
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
        currentImage &&
        imageKey && (
          <div className="relative h-full w-full">
            {!loadedImages.has(imageKey) && !failedImages.has(imageKey) && (
              <div className="absolute inset-0 flex h-full w-full animate-pulse items-center justify-center bg-muted">
                <LoaderState />
              </div>
            )}
            <img
              src={
                failedImages.has(imageKey)
                  ? "/images/placeholders/product-placeholder.webp"
                  : getMediaUrl(currentImage)
              }
              alt={productName}
              className={cn(
                "h-full w-full object-cover transition-all duration-300",
                loadedImages.has(imageKey)
                  ? "opacity-100 group-hover:scale-105"
                  : failedImages.has(imageKey)
                    ? "opacity-80"
                    : "opacity-0",
              )}
              onLoad={() => handleImageLoad(imageKey)}
              onError={(e) => {
                handleImageError(imageKey);
                e.currentTarget.src = "/images/placeholders/product-placeholder.webp";
              }}
              onLoadStart={() => handleImageLoadStart(imageKey)}
            />
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
    <div className="h-6 w-6 animate-spin rounded-full border-muted-foreground border-2 border-t-transparent" />
  </div>
);
