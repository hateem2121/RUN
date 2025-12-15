/**
 * Enhanced Interactive Image Gallery - Style 1 Integration
 * Features: Advanced gallery with zoom, thumbnails, keyboard navigation
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";

interface GalleryImage {
  id: string | number;
  url: string;
  alt: string;
  caption?: string;
}

// Optimized image component that uses ultra-high-resolution variants
const OptimizedGalleryImage = React.forwardRef<
  HTMLImageElement,
  {
    image: GalleryImage;
    className?: string;
    style?: React.CSSProperties;
    onLoad?: () => void;
  } & React.ImgHTMLAttributes<HTMLImageElement>
>(({ image, className, style, onLoad, ...props }, ref) => {
  const { urls } = useOptimizedMedia(typeof image.id === "string" ? parseInt(image.id) : image.id, {
    width: 1200,
    quality: 90,
    format: "webp",
  });

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
});

interface InteractiveImageGalleryProps {
  images: GalleryImage[];
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showThumbnails?: boolean;
  showZoom?: boolean;
  showFullscreen?: boolean;
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
  }, [
    currentIndex,
    autoPlay,
    autoPlayPaused,
    autoPlayInterval,
    images.length,
    isZoomed,
    isFullscreen,
  ]);

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
  }, [isFullscreen, isZoomed, autoPlayPaused]);

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

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No images available</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div
        ref={galleryRef}
        className={cn("relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={-1}
      >
        {/* Main Image Container */}
        <div className="relative bg-gray-100 dark:bg-gray-800 flex justify-center items-center min-h-[300px]">
          <OptimizedGalleryImage
            ref={mainImageRef}
            image={currentImage!}
            className={cn(
              "max-w-full max-h-[85vh] w-auto h-auto object-contain transition-all duration-300",
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={previousImage}
                className={cn(
                  "absolute left-4 top-1/2 transform -translate-y-1/2",
                  "p-2 bg-white/90 dark:bg-gray-800/90 rounded-full",
                  "hover:bg-white dark:hover:bg-gray-800 transition-all duration-200",
                  "focus:outline-hidden focus:ring-2 focus:ring-blue-500",
                  "opacity-0 group-hover:opacity-100",
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              <button
                onClick={nextImage}
                className={cn(
                  "absolute right-4 top-1/2 transform -translate-y-1/2",
                  "p-2 bg-white/90 dark:bg-gray-800/90 rounded-full",
                  "hover:bg-white dark:hover:bg-gray-800 transition-all duration-200",
                  "focus:outline-hidden focus:ring-2 focus:ring-blue-500",
                  "opacity-0 group-hover:opacity-100",
                )}
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </>
          )}

          {/* Controls */}
          <div
            className={cn(
              "absolute top-4 right-4 flex space-x-2",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            )}
          >
            {showZoom && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3}
                  className="bg-white/90 dark:bg-gray-800/90"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={zoomOut}
                  disabled={zoomLevel <= 1}
                  className="bg-white/90 dark:bg-gray-800/90"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </>
            )}
            {showFullscreen && (
              <Button
                size="sm"
                variant="secondary"
                onClick={toggleFullscreen}
                className="bg-white/90 dark:bg-gray-800/90"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {showThumbnails && images.length > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => goToImage(index)}
                  className={cn(
                    "shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-200",
                    index === currentIndex
                      ? "border-blue-500 ring-2 ring-blue-500/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                  )}
                  aria-label={`View image ${index + 1}: ${image.alt}`}
                >
                  <OptimizedGalleryImage image={image} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-modal bg-black/95 flex items-center justify-center">
          <div className="relative max-w-screen-xl max-h-screen p-4">
            <OptimizedGalleryImage
              image={currentImage!}
              className="max-w-full max-h-full object-contain"
            />

            {/* Fullscreen Controls */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              aria-label="Exit fullscreen"
            >
              <X className="w-5 h-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Fullscreen Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
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
