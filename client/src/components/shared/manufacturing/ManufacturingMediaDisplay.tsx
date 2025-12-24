import type { MediaAsset } from "@shared/schema";
import { AnimatePresence, motion } from "framer-motion";
import { ImageOff, Play } from "lucide-react";
import React, { useState } from "react";

interface ManufacturingMediaDisplayProps {
  mediaAssets: MediaAsset[];
  mediaIds?: number[] | null;
  mediaId?: number | null;
  className?: string;
  variant?: "hero" | "gallery" | "thumbnail" | "background";
  showMultipleIndicator?: boolean;
  aspectRatio?: "square" | "video" | "banner" | "auto";
  enableLightbox?: boolean;
  placeholder?: React.ReactNode;
}

/**
 * Unified media display component for manufacturing assets
 * Handles images, videos, and provides consistent fallbacks
 */
export function ManufacturingMediaDisplay({
  mediaAssets,
  mediaIds,
  mediaId,
  className = "",
  variant = "gallery",
  showMultipleIndicator = true,
  aspectRatio = "auto",
  // enableLightbox = false,
  placeholder,
}: ManufacturingMediaDisplayProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Get relevant media assets with null safety
  const relevantMedia = React.useMemo(() => {
    if (!Array.isArray(mediaAssets)) return [];

    if (mediaId && mediaId !== null) {
      const asset = mediaAssets.find((asset) => asset.id === mediaId);
      return asset ? [asset] : [];
    }

    if (Array.isArray(mediaIds) && mediaIds !== null) {
      return mediaAssets.filter((asset) => mediaIds.includes(asset.id));
    }

    return [];
  }, [mediaAssets, mediaIds, mediaId]);

  const primaryMedia = relevantMedia[0];
  const hasMultipleMedia = relevantMedia.length > 1;

  // Aspect ratio classes
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-[21/9]",
    auto: "",
  };

  // Variant-specific styling
  const variantStyles = {
    hero: "w-full h-full object-cover",
    gallery: "w-full h-32 object-cover rounded-lg",
    thumbnail: "w-16 h-16 object-cover rounded",
    background: "absolute inset-0 w-full h-full object-cover",
  };

  if (!primaryMedia) {
    const PlaceholderContent = placeholder || (
      <div
        className={`
        ${aspectClasses[aspectRatio]} 
        ${className}bg-gray-100 flex items-center justify-center rounded-lg border-2 border-gray-300 border-dashed`}
      >
        <div className="text-center text-gray-500">
          <ImageOff className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">No media available</p>
        </div>
      </div>
    );

    return <>{PlaceholderContent}</>;
  }

  const mediaUrl = primaryMedia.url || `/api/media/${primaryMedia.id}/content`;
  const isVideo = primaryMedia.type === "video";

  return (
    <div className={`relative ${aspectClasses[aspectRatio]} ${className}`}>
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 flex animate-pulse items-center justify-center rounded-lg bg-gray-200`}
          >
            <div className="h-8 w-8 animate-pulse rounded bg-gray-300" />
          </motion.div>
        )}
      </AnimatePresence>

      {isVideo ? (
        <div className="relative">
          <video
            src={mediaUrl}
            className={`${variantStyles[variant]} ${isLoaded ? "opacity-100" : "opacity-0"}`}
            onLoadedData={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            muted
            playsInline
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-black/50 p-3">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ) : (
        <img
          src={mediaUrl}
          alt={primaryMedia.filename || "Manufacturing asset"}
          className={`${variantStyles[variant]} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading={variant === "hero" ? "eager" : "lazy"}
        />
      )}

      {/* Multiple media indicator */}
      {hasMultipleMedia && showMultipleIndicator && (
        <div className="absolute right-2 bottom-2 rounded bg-blue-600/80 px-2 py-1 text-white text-xs">
          +{relevantMedia.length - 1} more
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div
          className={`
          ${aspectClasses[aspectRatio]} flex items-center justify-center rounded-lg border border-gray-300 bg-gray-100`}
        >
          <div className="text-center text-gray-500">
            <ImageOff className="mx-auto mb-1 h-6 w-6" />
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Gradient overlay for hero/background variants */}
      {(variant === "hero" || variant === "background") && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-blue-900/20 to-blue-900/60" />
      )}
    </div>
  );
}
