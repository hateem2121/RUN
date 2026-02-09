/**
 * Optimized Image Component
 * supports:
 * 1. Legacy Mode: mediaId (database ID) -> uses MediaUrlBuilder
 * 2. Direct Mode: src (string) -> uses direct URL
 * CLS Mitigation: Handles aspect ratio and blur-sm-up states.
 */

import type * as React from "react";
import { useEffect, useState } from "react";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { cn } from "@/lib/utils";

interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "onLoad" | "onError"> {
  // Legacy Props
  mediaId?: number | undefined;
  priority?: boolean | undefined;
  quality?: number | undefined;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";

  // New Props
  src?: string | undefined;
  aspectRatio?: number | string; // supports "aspect-square" (string) or 1.5 (number)
  fallbackSrc?: string | undefined;
  imageClassName?: string | undefined;

  // Handlers
  onLoad?: () => void;
  onError?: (error: unknown) => void;
}

// === Sub-Component: Direct Image (New V2) ===
const DirectImage: React.FC<OptimizedImageProps> = ({
  src: srcProp,
  alt,
  className,
  imageClassName,
  aspectRatio = "aspect-3/4",
  objectFit = "cover",
  fallbackSrc = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  onLoad,
  onError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(srcProp);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(srcProp);
    setIsLoading(true);
    setHasError(false);
  }, [srcProp]);

  // Handle number vs string aspect ratio
  const styleObj = typeof aspectRatio === "number" ? { aspectRatio } : undefined;
  const ratioClass = typeof aspectRatio === "string" ? aspectRatio : "";

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-muted dark:bg-muted",
        ratioClass,
        className,
      )}
      style={styleObj}
    >
      <img
        src={hasError ? fallbackSrc : currentSrc}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-all duration-700 ease-in-out",
          objectFit === "contain" && "object-contain", // Tailwind support
          isLoading ? "scale-110 blur-xl grayscale" : "scale-100 blur-0 grayscale-0",
          hasError ? "object-contain p-8 opacity-50" : "",
          imageClassName,
        )}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={(e) => {
          setIsLoading(false);
          setHasError(true);
          onError?.(e);
        }}
        loading="lazy"
        decoding="async"
        {...props}
      />

      {/* Skeleton / Pulse Overlay during loading */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-white/10" />
      )}
    </div>
  );
};

// === Sub-Component: Legacy Image (Media ID) ===
const LegacyImage: React.FC<OptimizedImageProps> = ({
  mediaId,
  priority = false,
  quality = 85,
  className,
  imageClassName,
  alt,
  onLoad,
  onError,
  aspectRatio = "aspect-3/4",
  objectFit = "cover",
  ...props
}) => {
  if (mediaId === undefined) {
    return null;
  }

  // Use the legacy MediaUrlBuilder
  const src = MediaUrlBuilder.buildUrlSafe(mediaId);

  // Forward to DirectImage to handle all loading states consistently
  return (
    <DirectImage
      src={src}
      className={className}
      imageClassName={imageClassName}
      alt={alt || `Media ${mediaId}`}
      aspectRatio={aspectRatio}
      objectFit={objectFit}
      {...(onLoad ? { onLoad } : {})}
      {...(onError ? { onError } : {})}
      {...props}
    />
  );
};

// === Main Export ===
export const OptimizedImage: React.FC<OptimizedImageProps> = (props) => {
  if (props.mediaId !== undefined) {
    return <LegacyImage {...props} />;
  }
  return <DirectImage {...props} />;
};
