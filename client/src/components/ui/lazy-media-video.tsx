/**
 * Lazy Media Video Component - Optimized video loading with poster images
 * Phase 1 Optimization: Video lazy loading with poster prioritization
 */

import type { MediaAsset } from "@shared/schema";
import { Play } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getOptimizedMediaUrl } from "@/lib/homepage-media-loader";
import { cn } from "@/lib/utils";

interface LazyMediaVideoProps {
  asset: MediaAsset;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean; // Load immediately without intersection observer
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  placeholderClassName?: string;
  posterImage?: string; // Optional poster image URL
}

export function LazyMediaVideo({
  asset,
  className,
  style,
  priority = false,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  onLoad,
  onError,
  placeholderClassName = "bg-gray-100 dark:bg-gray-800",
  posterImage,
}: LazyMediaVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(!autoPlay);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (
      priority ||
      isInView ||
      typeof window === "undefined" ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px", // Videos need more time to load
        threshold: 0.1,
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, isInView]);

  // Handle video loading
  const handleVideoLoad = useCallback(() => {
    setIsLoaded(true);
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleVideoError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    const error = new Error(`Failed to load video asset ${asset.id}: ${asset.originalName}`);
    onError?.(error);
  }, [asset.id, asset.originalName, onError]);

  // Handle play button click with promise-based error handling
  const handlePlayClick = useCallback(() => {
    if (videoRef.current) {
      // PERFORMANCE FIX: Wrap play() in promise to prevent play/pause race condition
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setShowPlayButton(false);
          })
          .catch((_error) => {});
      } else {
        setShowPlayButton(false);
      }
    }
  }, []);

  // Start loading when in view
  useEffect(() => {
    if (isInView && !isLoaded && !isLoading && !hasError) {
      setIsLoading(true);
    }
  }, [isInView, isLoaded, isLoading, hasError]);

  // Generate optimized URL
  const videoUrl = getOptimizedMediaUrl(asset, !priority);

  if (!videoUrl) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center text-gray-400",
          placeholderClassName,
          className,
        )}
        style={style}
      >
        <span className="text-sm">No video</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)} style={style}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div
          className={cn("absolute inset-0 flex items-center justify-center", placeholderClassName)}
        >
          {isLoading && (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-white border-b-2" />
              <span className="text-sm text-white">Loading video...</span>
            </div>
          )}
          {hasError && <span className="text-red-500 text-sm">Failed to load video</span>}
          {!isLoading && !hasError && (
            <div className="flex flex-col items-center gap-2 text-white">
              <Play className="h-12 w-12" />
              <span className="text-sm">Video ready</span>
            </div>
          )}
        </div>
      )}

      {/* Actual video - only render when in view */}
      {isInView && (
        <video
          ref={videoRef}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls={controls && isLoaded}
          playsInline
          preload={priority ? "auto" : "none"}
          poster={posterImage}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        >
          <source src={videoUrl} type={asset.mimeType || "video/mp4"} />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Play button overlay */}
      {showPlayButton && isLoaded && (
        <button
          onClick={handlePlayClick}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all duration-200 hover:bg-black/50"
          aria-label="Play video"
        >
          <div className="rounded-full bg-white/90 p-4 transition-all duration-200 hover:bg-white">
            <Play className="ml-1 h-8 w-8 text-black" />
          </div>
        </button>
      )}
    </div>
  );
}
