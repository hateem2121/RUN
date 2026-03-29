import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Box, Boxes, Play } from "lucide-react";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import type { MediaAsset } from "@/schemas/product";
import { type MediaItem, MediaType } from "../types";

/**
 * Normalizes media type strings from various backend formats into MediaType enum
 * Handles variants like 'model', '3d_model', '3d-model', etc.
 */
export function normalizeMediaType(type: string | undefined | null): MediaType {
  if (!type) {
    return MediaType.Image;
  }

  const normalizedType = type.toLowerCase().trim();

  // Video types
  if (normalizedType === "video") {
    return MediaType.Video;
  }

  // 3D model types - handle all variants
  if (
    normalizedType === "model" ||
    normalizedType === "3d_model" ||
    normalizedType === "3d-model" ||
    normalizedType === "3dmodel"
  ) {
    return MediaType.Model3D;
  }

  // Default to image for unknown types or explicit 'image'
  return MediaType.Image;
}

interface Hotspot {
  id: string;
  position: string;
  normal: string;
  text: string;
}

export interface ProductGalleryHandle {
  switchTo3DView: () => void;
}

interface ProductGalleryProps {
  media: MediaItem[];
  hotspots?: Hotspot[];
}

export const ProductGallery = ({
  media,
  ref,
}: ProductGalleryProps & { ref?: React.Ref<ProductGalleryHandle> }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const slideRef = useRef<HTMLDivElement>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    switchTo3DView: () => {
      const model3DIndex = media.findIndex((item) => item.type === MediaType.Model3D);
      if (model3DIndex !== -1) {
        setActiveIndex(model3DIndex);
      }
    },
  }));

  // Reset loading state when active media changes
  useEffect(() => {
    setImageLoaded(false);
  }, []);

  useEffect(() => {
    thumbnailRefs.current[activeIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeIndex]);

  // Animate slide on media change
  useGSAP(() => {
    if (!slideRef.current) return;
    gsap.fromTo(slideRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  }, [activeIndex]);

  // Animate thumbnail strip on mount
  useGSAP(() => {
    if (!thumbnailStripRef.current) return;
    gsap.fromTo(
      thumbnailStripRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, delay: 0.2, ease: "power2.out" },
    );
  }, []);

  const renderMedia = () => {
    const item = media[activeIndex];
    if (!item) {
      return null;
    }

    return (
      <div ref={slideRef} className="h-full w-full">
        {(() => {
          switch (item.type) {
            case MediaType.Image:
              return (
                <>
                  <img
                    src={item.src}
                    alt="Product"
                    loading={activeIndex === 0 ? "eager" : "lazy"}
                    {...(activeIndex === 0 && {
                      fetchPriority: "high" as const,
                    })}
                    className={`h-full w-full object-contain transition-opacity duration-300 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => setImageLoaded(true)}
                  />
                  {!imageLoaded && (
                    <div className="center-flex absolute inset-0 bg-black">
                      <div className="border-border h-12 w-12 animate-spin rounded-full border-2 border-t-2 border-t-white"></div>
                    </div>
                  )}
                </>
              );
            case MediaType.Video:
              return (
                <video
                  controls
                  autoPlay
                  loop
                  muted
                  className="h-full w-full object-contain"
                  onError={(_e) => {}}
                >
                  <source src={item.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              );
            case MediaType.Model3D:
              return (
                <div className="h-full w-full">
                  <LazyUnifiedModelViewer
                    asset={
                      {
                        id: item.id,
                        url: item.src,
                        type: "3d_model",
                        filename: item.filename || "product-model.glb",
                        mimeType: item.mimeType || "model/gltf-binary",
                        storagePath: item.src,
                        bucketName: "default",
                        originalName: "product-model.glb",
                        fileSize: null,
                        thumbnailUrl: null,
                        thumbnailFilename: null,
                        width: null,
                        height: null,
                        caption: null,
                        altText: "Product 3D Model",
                        blurhash: null,
                        processing: false,
                        processingProgress: null,
                        processingError: null,
                        metadata: {},
                        tags: null,
                        isPublic: true,
                        isActive: true,
                        folderId: null,
                        downloadCount: 0,
                        lastAccessedAt: null,
                        deletedAt: null,
                        uploadedAt: null,
                        updatedAt: null,
                        createdAt: null,
                      } as unknown as MediaAsset
                    }
                    config={{
                      loading: "eager",
                    }}
                    className="h-full w-full"
                    showControls={true}
                    showLoadingProgress={true}
                  />
                </div>
              );
            default:
              return null;
          }
        })()}
      </div>
    );
  };

  return (
    <div className="flex w-full justify-center p-3 sm:p-5 md:p-7 lg:p-9">
      <div className="w-full max-w-3xl">
        <div className="product-gallery-container relative aspect-square w-full overflow-hidden rounded-lg bg-black sm:aspect-4/3 lg:aspect-video">
          <div className="absolute inset-0 bg-black">{renderMedia()}</div>
        </div>
        <div
          ref={thumbnailStripRef}
          className="thumbnail-scrollbar mt-3 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto p-2 sm:mt-4 sm:gap-3"
        >
          {media.map((item, index) => (
            <ThumbnailButton
              key={index}
              item={item}
              index={index}
              isActive={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              ref={(el) => {
                thumbnailRefs.current[index] = el;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Thumbnail Button Component with Media Type Indicators
// ============================================================================

interface ThumbnailButtonProps {
  item: MediaItem;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const ThumbnailButton = ({
  item,
  index,
  isActive,
  onClick,
  ref,
}: ThumbnailButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Check if thumbnail URL is missing or invalid
  const hasThumbnail = item.thumbnail && item.thumbnail.trim() !== "";

  // Determine if we should show a fallback (only when thumbnail is missing or failed to load)
  const shouldShowFallback = !hasThumbnail || thumbnailError;

  // Get fallback icon and background color based on media type
  const getFallbackContent = () => {
    switch (item.type) {
      case MediaType.Video:
        return {
          icon: <Play className="h-6 w-6 text-white" fill="white" />,
          bgColor: "bg-linear-to-br from-purple-500 to-pink-500",
          label: "Video",
        };
      case MediaType.Model3D:
        return {
          icon: <Boxes className="h-6 w-6 text-white" />,
          bgColor: "bg-linear-to-br from-blue-500 to-cyan-500",
          label: "3D Model",
        };
      default:
        return {
          icon: <Box className="h-6 w-6 text-white" />,
          bgColor: "bg-linear-to-br from-muted-foreground to-muted-foreground",
          label: "Media",
        };
    }
  };

  const fallbackContent = getFallbackContent();

  // Get badge for media type indicator (small overlay on thumbnail)
  const getMediaTypeBadge = () => {
    if (item.type === MediaType.Image) {
      return null;
    }

    return (
      <div className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5">
        {item.type === MediaType.Video ? (
          <Play className="h-2.5 w-2.5 text-white" fill="white" />
        ) : (
          <Boxes className="h-2.5 w-2.5 text-white" />
        )}
      </div>
    );
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`relative h-14 min-h-11 w-14 min-w-11 shrink-0 transform touch-manipulation snap-center overflow-hidden rounded-md transition-all duration-300 ease-in-out sm:h-16 sm:w-16 ${
        isActive
          ? "scale-105 ring-2 ring-black ring-offset-2"
          : "opacity-60 hover:scale-105 hover:opacity-100 active:scale-95"
      }`}
      data-testid={`button-gallery-thumbnail-${index}`}
      aria-label={`View ${fallbackContent.label} ${index + 1}`}
    >
      {shouldShowFallback ? (
        // Fallback UI with icon (shown when no thumbnail or failed to load)
        <div
          className={`flex h-full w-full items-center justify-center ${fallbackContent.bgColor}`}
        >
          {fallbackContent.icon}
        </div>
      ) : (
        // Show the actual thumbnail image
        <>
          <img
            src={item.thumbnail}
            alt={`Thumbnail ${index + 1}`}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setThumbnailError(true)}
            data-testid={`img-thumbnail-${index}`}
          />
          {!imageLoaded && <div className="bg-muted/20 absolute inset-0 animate-pulse" />}
        </>
      )}
      {/* Media type badge overlay - always show for videos and 3D models when thumbnail loads successfully */}
      {!shouldShowFallback && getMediaTypeBadge()}
    </button>
  );
};

ThumbnailButton.displayName = "ThumbnailButton";
