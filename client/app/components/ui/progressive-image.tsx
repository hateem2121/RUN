/**
 * Progressive Image Component
 * Implements blur-to-sharp loading with multiple resolution support
 */

import type { MediaAsset } from "@shared/index";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps {
  src?: string | undefined;
  alt: string;
  className?: string | undefined;
  thumbnailSrc?: string | undefined;
  blurhash?: string | undefined;
  sizes?: string | undefined;
  srcSet?: string | undefined;
  loading?: "lazy" | "eager";
  priority?: boolean | undefined;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  aspectRatio?: number | undefined;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  asset?: MediaAsset;
  width?: number | undefined;
  height?: number | undefined;
}

export function ProgressiveImage({
  src: srcProp,
  alt,
  className,
  thumbnailSrc,
  blurhash,
  sizes,
  srcSet,
  loading = "lazy",
  priority = false,
  onLoad,
  onError,
  aspectRatio,
  objectFit = "cover",
  asset,
}: ProgressiveImageProps) {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">("loading");
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Derive src from asset if provided, otherwise use srcProp
  const src = asset?.url || srcProp || "";

  // Generate optimized URLs

  // Optimize srcSet generation
  const getOptimizedSrcSet = useCallback(() => {
    if (srcSet) {
      return srcSet;
    }
    if (!src) {
      return "";
    }

    const urlParts = src.match(/(.+?)(\.[^.]+)?$/);
    if (!urlParts) {
      return "";
    }

    const baseUrl = urlParts[1];
    const ext = urlParts[2] || "";

    const sizes = [640, 1024, 1920];
    return sizes.map((size) => `${baseUrl}?size=${size}${ext} ${size}w`).join(", ");
  }, [src, srcSet]);

  // Load image progressively
  useEffect(() => {
    if (!src) {
      return;
    }

    const loadMainImage = () => {
      const img = new Image();
      if (srcSet || src.includes("/api/media/")) {
        img.srcset = getOptimizedSrcSet();
      }
      img.src = src;
      img.onload = () => {
        setCurrentSrc(src);
        setImageState("loaded");
        onLoad?.();
      };
      img.onerror = () => {
        setImageState("error");
        onError?.(new Error(`Failed to load image: ${src}`));
      };
    };

    const loadFullImage = () => {
      if (thumbnailSrc && thumbnailSrc !== currentSrc) {
        const thumbnailImg = new Image();
        thumbnailImg.src = thumbnailSrc;
        thumbnailImg.onload = () => {
          setCurrentSrc(thumbnailSrc);
          loadMainImage();
        };
        thumbnailImg.onerror = () => {
          loadMainImage();
        };
      } else {
        loadMainImage();
      }
    };

    const setupIntersectionObserver = () => {
      if (!imgRef.current || typeof IntersectionObserver === "undefined") {
        loadFullImage();
        return;
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadFullImage();
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          });
        },
        { rootMargin: "200px", threshold: 0.01 },
      );

      observerRef.current.observe(imgRef.current);
    };

    if (priority) {
      loadFullImage();
    } else {
      setupIntersectionObserver();
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [src, priority, srcSet, thumbnailSrc, onLoad, onError, currentSrc, getOptimizedSrcSet]);

  // Render blurhash placeholder if available
  const renderBlurhash = () => {
    if (!blurhash) {
      return null;
    }

    // This would use a blurhash library in production
    return (
      <div
        className="from-surface-muted to-surface-emphasis absolute inset-0 animate-pulse bg-linear-to-br"
        aria-hidden="true"
      />
    );
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (blurhash) {
      return renderBlurhash();
    }

    return (
      <div className="bg-surface-muted absolute inset-0 animate-pulse">
        <svg
          className="text-surface-emphasis absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      </div>
    );
  };

  return (
    <div
      className={cn("bg-surface-subtle relative overflow-hidden", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Placeholder / Loading state */}
      {imageState === "loading" && renderPlaceholder()}

      {/* Thumbnail (blur-smred) */}
      {thumbnailSrc && currentSrc === thumbnailSrc && (
        <img
          src={thumbnailSrc}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full scale-110 blur-md filter",
            `object-${objectFit}`,
          )}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={
          currentSrc ||
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        }
        alt={alt}
        className={cn(
          "h-full w-full transition-opacity duration-500",
          `object-${objectFit}`,
          imageState === "loaded" && currentSrc === src ? "opacity-100" : "opacity-0",
          imageState === "error" && "hidden",
        )}
        loading={priority ? "eager" : loading}
        sizes={sizes}
        srcSet={currentSrc === src ? getOptimizedSrcSet() : undefined}
        onError={() => setImageState("error")}
      />

      {/* Error state */}
      {imageState === "error" && (
        <div className="center-flex bg-surface-subtle absolute inset-0">
          <div className="p-4 text-center">
            <svg
              className="text-text-subtle mx-auto mb-2 h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-text-muted text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Preload utility for critical images
export function preloadImage(src: string, srcSet?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    if (srcSet) {
      img.srcset = srcSet;
    }

    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
  });
}

// Hook for managing image loading state
export function useProgressiveImage(src: string, thumbnailSrc?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || "");

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Load thumbnail first if available
    if (thumbnailSrc) {
      const thumbnailImg = new Image();
      thumbnailImg.src = thumbnailSrc;
      thumbnailImg.onload = () => setCurrentSrc(thumbnailSrc);
    }

    // Load main image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };

    img.onerror = () => {
      setError(new Error(`Failed to load image: ${src}`));
      setLoading(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, thumbnailSrc]);

  return { currentSrc, loading, error };
}
