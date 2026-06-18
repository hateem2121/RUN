import type { MediaAsset } from "@shared/index";
import gsap from "gsap";
import { ImageOff, Play } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";

interface ManufacturingMediaDisplayProps {
  mediaAssets: MediaAsset[];
  mediaIds?: number[] | null;
  mediaId?: number | null;
  className?: string | undefined;
  variant?: "hero" | "gallery" | "thumbnail" | "background";
  showMultipleIndicator?: boolean | undefined;
  aspectRatio?: "square" | "video" | "banner" | "auto";
  enableLightbox?: boolean | undefined;
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
  const [shouldRenderSkeleton, setShouldRenderSkeleton] = useState(true);
  const skeletonRef = useRef<HTMLDivElement>(null);

  // Get relevant media assets with null safety
  const relevantMedia = React.useMemo(() => {
    if (!Array.isArray(mediaAssets)) {
      return [];
    }

    if (mediaId && mediaId !== null) {
      const asset = mediaAssets.find((asset) => asset.id === mediaId);
      return asset ? [asset] : [];
    }

    if (Array.isArray(mediaIds) && mediaIds !== null) {
      return mediaAssets.filter((asset) => mediaIds.includes(asset.id));
    }

    return [];
  }, [mediaAssets, mediaIds, mediaId]);

  // Fade out skeleton when media loads
  useEffect(() => {
    if (!isLoaded && !hasError) return;
    if (!skeletonRef.current) {
      setShouldRenderSkeleton(false);
      return;
    }
    gsap.to(skeletonRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power1.out",
      onComplete: () => setShouldRenderSkeleton(false),
    });
  }, [isLoaded, hasError]);

  const primaryMedia = relevantMedia[0];
  const hasMultipleMedia = relevantMedia.length > 1;

  // Aspect ratio classes
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-21/9",
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
        className={`${aspectClasses[aspectRatio]} ${className} center-flex overflow-hidden rounded-lg border border-border/50 border-dashed bg-surface-subtle/30`}
      >
        <EmptyState
          title="No Media"
          description="Content not configured"
          icon={ImageOff}
          className="min-h-custom-misc-239 border-none bg-transparent p-4"
        />
      </div>
    );

    return <>{PlaceholderContent}</>;
  }

  const mediaUrl = primaryMedia.url || `/api/media/${primaryMedia.id}/content`;
  const isVideo = primaryMedia.type === "video";

  return (
    <div className={`relative ${aspectClasses[aspectRatio]} ${className}`}>
      {shouldRenderSkeleton && (
        <div
          ref={skeletonRef}
          className="absolute inset-0 flex animate-pulse items-center justify-center rounded-lg bg-muted/20"
        >
          <div className="h-8 w-8 animate-pulse rounded bg-muted/30" />
        </div>
      )}

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
          <div className="center-flex pointer-events-none absolute inset-0">
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
          className={` ${aspectClasses[aspectRatio]} center-flex rounded-lg border border-border/50 bg-muted`}
        >
          <div className="text-center text-muted-foreground">
            <ImageOff className="mx-auto mb-1 h-6 w-6" />
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Gradient overlay for hero/background variants */}
      {(variant === "hero" || variant === "background") && (
        <div className="absolute inset-0 rounded-lg bg-linear-to-b from-blue-900/20 to-blue-900/60" />
      )}
    </div>
  );
}
