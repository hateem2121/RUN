import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageOff, Play } from "lucide-react";
import type { MediaAsset } from "@shared/schema";

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
  placeholder
}: ManufacturingMediaDisplayProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Get relevant media assets with null safety
  const relevantMedia = React.useMemo(() => {
    if (!Array.isArray(mediaAssets)) return [];

    if (mediaId && mediaId !== null) {
      const asset = mediaAssets.find(asset => asset.id === mediaId);
      return asset ? [asset] : [];
    }

    if (Array.isArray(mediaIds) && mediaIds !== null) {
      return mediaAssets.filter(asset => mediaIds.includes(asset.id));
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
    auto: ""
  };

  // Variant-specific styling
  const variantStyles = {
    hero: "w-full h-full object-cover",
    gallery: "w-full h-32 object-cover rounded-lg",
    thumbnail: "w-16 h-16 object-cover rounded",
    background: "absolute inset-0 w-full h-full object-cover"
  };

  if (!primaryMedia) {
    const PlaceholderContent = placeholder || (
      <div className={`
        ${aspectClasses[aspectRatio]} 
        ${className}
        bg-gray-100 border-2 border-dashed border-gray-300 
        flex items-center justify-center rounded-lg
      `}>
        <div className="text-center text-gray-500">
          <ImageOff className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No media available</p>
        </div>
      </div>
    );

    return <>{PlaceholderContent}</>;
  }

  const mediaUrl = primaryMedia.url || `/api/media/${primaryMedia.id}/content`;
  const isVideo = primaryMedia.type === 'video';

  return (
    <div className={`relative ${aspectClasses[aspectRatio]} ${className}`}>
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`
              absolute inset-0 bg-gray-200 rounded-lg animate-pulse
              flex items-center justify-center
            `}
          >
            <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {isVideo ? (
        <div className="relative">
          <video
            src={mediaUrl}
            className={`${variantStyles[variant]} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoadedData={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            muted
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 rounded-full p-3">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ) : (
        <img
          src={mediaUrl}
          alt={primaryMedia.filename || "Manufacturing asset"}
          className={`${variantStyles[variant]} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading={variant === "hero" ? "eager" : "lazy"}
        />
      )}

      {/* Multiple media indicator */}
      {hasMultipleMedia && showMultipleIndicator && (
        <div className="absolute bottom-2 right-2 bg-blue-600/80 text-white text-xs px-2 py-1 rounded">
          +{relevantMedia.length - 1} more
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className={`
          ${aspectClasses[aspectRatio]} 
          bg-gray-100 border border-gray-300 
          flex items-center justify-center rounded-lg
        `}>
          <div className="text-center text-gray-500">
            <ImageOff className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Gradient overlay for hero/background variants */}
      {(variant === "hero" || variant === "background") && (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-blue-900/60 rounded-lg" />
      )}
    </div>
  );
}