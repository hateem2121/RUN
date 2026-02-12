import { ChevronLeft, ChevronRight, LayoutGrid, Play } from "lucide-react";
import type React from "react";
import { useState } from "react";
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
  const [isNavigating, setIsNavigating] = useState(false);

  const hasVideo = !!primaryVideo;
  const totalItems = (hasVideo ? 1 : 0) + images.length;
  const showVideo = hasVideo && currentImageIndex === 0;
  const imageIndex = hasVideo ? currentImageIndex - 1 : currentImageIndex;

  const getMediaUrl = (mediaId: number) => {
    return getOptimizedUrl?.(mediaId) || MediaUrlBuilder.buildUrlSafe(mediaId);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNavigating || totalItems <= 1) {
      return;
    }

    setCurrentImageIndex((prev) => (prev + 1) % totalItems);
    setIsNavigating(true);
    setTimeout(() => setIsNavigating(false), 200);
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNavigating || totalItems <= 1) {
      return;
    }

    setCurrentImageIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setIsNavigating(true);
    setTimeout(() => setIsNavigating(false), 200);
  };

  const goToIndex = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNavigating || index === currentImageIndex) {
      return;
    }

    setCurrentImageIndex(index);
    setIsNavigating(true);
    setTimeout(() => setIsNavigating(false), 200);
  };

  const handleImageLoad = (imageId: number) => {
    setLoadedImages((prev) => new Set([...prev, imageId]));
  };

  const handleImageLoadStart = () => {
    // No-op for now as we don't use loading state
  };

  if (totalItems === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
        <LayoutGrid className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div
      className="group relative h-full w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          />
          <div className="absolute top-2 right-2 rounded bg-black/70 p-1 text-white">
            <Play className="h-3 w-3" />
          </div>
        </div>
      ) : (
        images[imageIndex] && (
          <div className="relative h-full w-full">
            {!loadedImages.has(images[imageIndex]?.id) && (
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
                  : "opacity-0",
              )}
              onLoad={() => handleImageLoad(images[imageIndex]?.id || 0)}
              onLoadStart={handleImageLoadStart}
            />
          </div>
        )
      )}

      {totalItems > 1 && (
        <>
          {viewMode !== "small" && isHovered && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white transition-all hover:bg-black/70"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
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
    </div>
  );
};

const LoaderState = () => (
  <div className="flex flex-col items-center gap-2">
    <div className="h-6 w-6 animate-spin rounded-full border-muted-foreground border-b-2" />
  </div>
);
