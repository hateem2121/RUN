/**
 * Enhanced Interactive Image Gallery - Style 1 Integration
 * Features: Advanced gallery with zoom, thumbnails, keyboard navigation
 */

import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: string | number;
  url: string;
  alt: string;
  caption?: string | undefined;
}

// Optimized image component that uses ultra-high-resolution variants
const OptimizedGalleryImage = ({
  image,
  className,
  style,
  onLoad,
  ref,
  ...props
}: {
  image: GalleryImage;
  className?: string | undefined;
  style?: React.CSSProperties;
  onLoad?: () => void;
  ref?: React.Ref<HTMLImageElement>;
} & React.ImgHTMLAttributes<HTMLImageElement>) => {
  const { urls } = useOptimizedMedia(
    typeof image.id === "string" ? parseInt(image.id, 10) : image.id,
    {
      width: 1200,
      quality: 90,
      format: "webp",
    },
  );

  // Use ultra-high-resolution variant if available, fallback to original URL
  const optimizedSrc = urls?.large || urls?.medium || image.url;

  return (
    <img
      {...props}
      ref={ref}
      src={optimizedSrc}
      alt={image.alt}
      className={className}
      style={style}
      onLoad={onLoad}
      draggable={false}
    />
  );
};

interface InteractiveImageGalleryProps {
  images: GalleryImage[];
  className?: string | undefined;
  autoPlay?: boolean | undefined;
  autoPlayInterval?: number | undefined;
  showThumbnails?: boolean | undefined;
  showZoom?: boolean | undefined;
  showFullscreen?: boolean | undefined;
}

export function InteractiveImageGallery({
  images,
  className,
  autoPlay = false,
  autoPlayInterval = 5000,
  showThumbnails = true,
  showZoom = true,
  showFullscreen = true,
}: InteractiveImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [autoPlayPaused, setAutoPlayPaused] = useState(false);

  const mainImageRef = useRef<HTMLImageElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>(undefined);

  const currentImage = images[currentIndex];

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setImageLoaded(false);
    setIsZoomed(false);
    setZoomLevel(1);
  }, [images.length]);

  const previousImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setImageLoaded(false);
    setIsZoomed(false);
    setZoomLevel(1);
  }, [images.length]);

  const goToImage = useCallback(
    (index: number) => {
      if (index !== currentIndex) {
        setCurrentIndex(index);
        setImageLoaded(false);
        setIsZoomed(false);
        setZoomLevel(1);
      }
    },
    [currentIndex],
  );

  const zoomIn = useCallback(() => {
    if (!showZoom) return;
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
    setIsZoomed(true);
  }, [showZoom]);

  const zoomOut = useCallback(() => {
    if (!showZoom) return;
    setZoomLevel((prev) => {
      const newLevel = Math.max(prev - 0.5, 1);
      if (newLevel === 1) {
        setIsZoomed(false);
      }
      return newLevel;
    });
  }, [showZoom]);

  const toggleFullscreen = useCallback(() => {
    if (!showFullscreen) return;
    setIsFullscreen(!isFullscreen);
    setIsZoomed(false);
    setZoomLevel(1);
  }, [showFullscreen, isFullscreen]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setAutoPlayPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setAutoPlayPaused(false);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !autoPlayPaused && !isZoomed && !isFullscreen) {
      autoPlayRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, autoPlayInterval);
    }

    return () => {
      if (autoPlayRef.current) {
        clearTimeout(autoPlayRef.current);
      }
    };
  }, [autoPlay, autoPlayPaused, autoPlayInterval, images.length, isZoomed, isFullscreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!galleryRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          previousImage();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextImage();
          break;
        case "Escape":
          if (isFullscreen) {
            setIsFullscreen(false);
          } else if (isZoomed) {
            setIsZoomed(false);
            setZoomLevel(1);
          }
          break;
        case " ":
          e.preventDefault();
          setAutoPlayPaused(!autoPlayPaused);
          break;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          e.preventDefault();
          zoomOut();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, isZoomed, autoPlayPaused, nextImage, previousImage, zoomIn, zoomOut]);

  if (images.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg bg-muted dark:bg-muted/80">
        <p className="text-muted-foreground dark:text-muted-foreground/70">No images available</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div
        ref={galleryRef}
        className={cn("relative overflow-hidden rounded-lg bg-white dark:bg-foreground", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={-1}
      >
        {/* Main Image Container */}
        <div className="relative flex min-h-[300px] items-center justify-center bg-muted dark:bg-muted/80">
          <OptimizedGalleryImage
            ref={mainImageRef}
            image={currentImage!}
            className={cn(
              "h-auto max-h-viewport-85 w-auto max-w-full object-contain transition-all duration-300",
              imageLoaded ? "opacity-100" : "opacity-0",
              isZoomed && "cursor-move",
            )}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center",
            }}
            onLoad={handleImageLoad}
          />

          {/* Loading State */}
          {!imageLoaded && (
            <div className="center-flex absolute inset-0">
              <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2 dark:border-blue-400" />
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={previousImage}
                className={cn(
                  "absolute top-1/2 left-4 -translate-y-1/2 transform",
                  "rounded-full bg-white/90 p-2 dark:bg-muted/80/90",
                  "transition-all duration-200 hover:bg-white dark:hover:bg-muted/80",
                  "focus:outline-hidden focus:ring-2 focus:ring-ring",
                  "opacity-0 group-hover:opacity-100",
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 text-foreground/80 dark:text-muted-foreground/50" />
              </button>

              <button
                onClick={nextImage}
                className={cn(
                  "absolute top-1/2 right-4 -translate-y-1/2 transform",
                  "rounded-full bg-white/90 p-2 dark:bg-muted/80/90",
                  "transition-all duration-200 hover:bg-white dark:hover:bg-muted/80",
                  "focus:outline-hidden focus:ring-2 focus:ring-ring",
                  "opacity-0 group-hover:opacity-100",
                )}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 text-foreground/80 dark:text-muted-foreground/50" />
              </button>
            </>
          )}

          {/* Controls */}
          <div
            className={cn(
              "absolute top-4 right-4 flex space-x-2",
              "opacity-0 transition-opacity duration-200 group-hover:opacity-100",
            )}
          >
            {showZoom && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3}
                  className="bg-white/90 dark:bg-muted/80/90"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={zoomOut}
                  disabled={zoomLevel <= 1}
                  className="bg-white/90 dark:bg-muted/80/90"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </>
            )}
            {showFullscreen && (
              <Button
                size="sm"
                variant="secondary"
                onClick={toggleFullscreen}
                className="bg-white/90 dark:bg-muted/80/90"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {showThumbnails && images.length > 1 && (
          <div className="border-border border-t p-4 dark:border-border">
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => goToImage(index)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-200",
                    index === currentIndex
                      ? "border-blue-500 ring-2 ring-ring/20"
                      : "border-border hover:border-border/50 dark:border-border dark:hover:border-border",
                  )}
                  aria-label={`View image ${index + 1}: ${image.alt}`}
                >
                  <OptimizedGalleryImage image={image} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="center-flex fixed inset-0 z-modal bg-black/95">
          <div className="relative max-h-screen max-w-screen-xl p-4">
            <OptimizedGalleryImage
              image={currentImage!}
              className="max-h-full max-w-full object-contain"
            />

            {/* Fullscreen Controls */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              aria-label="Exit fullscreen"
            >
              <X className="h-5 w-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute top-1/2 left-4 -translate-y-1/2 transform rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute top-1/2 right-4 -translate-y-1/2 transform rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Fullscreen Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform rounded-full bg-black/70 px-4 py-2 text-white">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen Reader Info */}
      <div className="sr-only">
        <h3>Image gallery with {images.length} images</h3>
        <p>Current image: {currentImage?.alt || "Image"}</p>
        <p>
          Use arrow keys to navigate, space to pause autoplay, +/- to zoom, escape to exit
          fullscreen
        </p>
      </div>
    </>
  );
}

export default InteractiveImageGallery;
