import type { MediaAsset } from "@shared/schema";
import { Box, FileX, Image as ImageIcon, Video } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { cn } from "@/lib/utils";

interface MediaPreviewProps {
  asset: MediaAsset;
  className?: string;
  size?: "sm" | "md" | "lg";
  showTypeIcon?: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "video":
      return <Video className="h-4 w-4" />;
    case "3d_model":
      return <Box className="h-4 w-4" />;
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    default:
      return <FileX className="h-4 w-4" />;
  }
};

export function MediaPreview({
  asset,
  className,
  size = "md",
  showTypeIcon = true,
}: Readonly<MediaPreviewProps>) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Determine optimized size based on size prop
  let imageWidth: number;
  let optimizedSize: "small" | "medium" | "large";

  if (size === "sm") {
    imageWidth = 300;
    optimizedSize = "small";
  } else if (size === "lg") {
    imageWidth = 1200;
    optimizedSize = "large";
  } else {
    imageWidth = 600;
    optimizedSize = "medium";
  }

  // Use the hook at component level, not inside renderMedia
  const { urls } = useOptimizedMedia(asset.id, {
    width: imageWidth,
    quality: 85,
    format: "webp",
  });

  // Get optimized URL or fallback
  const mediaUrl = urls?.[optimizedSize] || asset.url || MediaUrlBuilder.buildUrlSafe(asset.id);

  const sizeClasses = {
    sm: "h-16",
    md: "h-24",
    lg: "h-32",
  };

  const renderMedia = () => {
    if (hasError) {
      return (
        <div className="flex h-full items-center justify-center rounded border-2 border-gray-300 border-dashed bg-gray-100">
          <div className="text-center">
            {getTypeIcon(asset.type)}
            <p className="mt-1 text-gray-500 text-xs">Failed to load</p>
          </div>
        </div>
      );
    }

    switch (asset.type) {
      case "video":
        return (
          <div className="group relative h-full">
            <video
              src={mediaUrl}
              className="h-full w-full rounded object-cover"
              muted
              preload="metadata"
              onError={() => setHasError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center rounded bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100">
              <Video className="h-6 w-6 text-white drop-shadow-lg" />
            </div>
            {showTypeIcon && (
              <div className="absolute right-1 bottom-1 rounded-full bg-black/70 px-1.5 py-0.5 text-white text-xs">
                <Video className="mr-1 inline h-2.5 w-2.5" />
                Video
              </div>
            )}
          </div>
        );

      case "3d_model":
        return (
          <div className="flex h-full items-center justify-center rounded border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="text-center">
              <Box className="mx-auto mb-1 h-6 w-6 text-orange-600" />
              <p
                className="max-w-[60px] truncate font-medium text-orange-700 text-xs"
                title={asset.originalName || ""}
              >
                {/* Handle potential null for originalName */}
                {(asset.originalName || "").length > 8
                  ? `${(asset.originalName || "").substring(0, 8)}...`
                  : asset.originalName || ""}
              </p>
              {showTypeIcon && <div className="mt-1 text-orange-500 text-xs">3D</div>}
            </div>
          </div>
        );
      default:
        return (
          <div className="relative h-full overflow-hidden rounded">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="h-full w-full animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                </div>
              </div>
            )}
            <img
              src={mediaUrl}
              // Handle potential null for originalName in alt text
              alt={asset.originalName || ""}
              className={cn(
                "h-full w-full rounded object-cover transition-all duration-300",
                "group-hover:scale-105",
                imageLoaded ? "opacity-100" : "opacity-0",
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setHasError(true)}
            />
            {showTypeIcon && imageLoaded && (
              <div className="absolute right-1 bottom-1 rounded-full bg-black/70 px-1.5 py-0.5 text-white text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <ImageIcon className="mr-1 inline h-2.5 w-2.5" />
                Image
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs transition-all duration-300",
        "hover:border-gray-300 hover:shadow-md",
        sizeClasses[size],
        className,
      )}
    >
      {renderMedia()}
    </div>
  );
}
