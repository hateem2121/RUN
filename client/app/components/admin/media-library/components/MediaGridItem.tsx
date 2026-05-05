import type { MediaAsset } from "@shared/index";
import { Box, Check, Download, Eye, File, Loader2, Play } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { cn } from "@/lib/utils";

// STEP 3 INTEGRATION: Import UnifiedModelViewer for 3D preview thumbnails
const UnifiedModelViewer = React.lazy(() =>
  import("@/components/ui/UnifiedModelViewer").then((m) => ({ default: m.UnifiedModelViewer })),
);

export interface MediaGridItemProps {
  asset: MediaAsset;
  isSelected: boolean;
  isOptimistic: boolean;
  onSelect: (id: number, asset?: MediaAsset) => void;
  onClick: (asset: MediaAsset, index: number) => void;
  formatFileSize: (bytes: number) => string;
  index: number;
  selectionMode?: boolean | undefined;
  signedUrl?: string | null | undefined;
}

export const MediaGridItem = React.memo(
  ({
    asset,
    isSelected,
    isOptimistic,
    onSelect,
    onClick,
    formatFileSize,
    index,
    selectionMode = false,
    signedUrl,
  }: MediaGridItemProps) => {
    const isImage = asset.type === "image";
    const isVideo = asset.type === "video";
    const is3DModel = asset.type === "3d_model" || asset.type === "model";

    const isSvg = asset.mimeType === "image/svg+xml";
    const imageUrl = signedUrl || `/api/media/${asset.id}/content`;
    const videoUrl = signedUrl || MediaUrlBuilder.buildUrlSafe(asset.id);

    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border transition-all duration-200",
          "hover:scale-[1.02] hover:shadow-lg",
          isOptimistic && "pointer-events-none opacity-60",
          isSelected
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-white/10 hover:border-white/20",
        )}
      >
        {/* Selection checkbox */}
        <div
          className={cn(
            "z-elevated absolute top-2 left-2 transition-opacity",
            selectionMode ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <button
            type="button"
            className={cn(
              "flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 transition-all",
              isSelected
                ? "border-blue-500 bg-blue-500"
                : "border-white/20 bg-white/10 hover:border-blue-400",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(asset.id, asset);
            }}
            aria-label={isSelected ? "Deselect asset" : "Select asset"}
            aria-pressed={isSelected}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </button>
        </div>

        {/* Status badges */}
        <div className="z-elevated absolute top-2 right-2 flex gap-1">
          {isOptimistic && (
            <Badge variant="secondary" className="status-badge-base status-badge-info">
              Uploading
            </Badge>
          )}
          {typeof asset === "object" &&
            asset !== null &&
            "isOptimized" in asset &&
            (asset as Record<string, unknown>).isOptimized === true && (
              <Badge variant="outline" className="shadow-sm-xs text-xs">
                Optimized
              </Badge>
            )}
        </div>

        {/* Enhanced Media preview */}
        <button
          type="button"
          className="group z-elevated bg-white/[0.03] relative flex aspect-square w-full cursor-pointer items-center justify-center border-0 p-0"
          onClick={() => onClick(asset, index)}
          aria-label={`Preview ${asset.originalName || asset.filename}`}
        >
          {isImage ? (
            isSvg ? (
              <img
                src={imageUrl}
                alt={asset.originalName || asset.filename}
                className="h-full w-full object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.src.includes("data:image/svg+xml")) {
                    img.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zz4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTEwMCA3MEMxMDUuNTIzIDcwIDExMCA3NC40NzcgMTEwIDgwQzg1NS40NzcgODAgNTAgODQuNDc3IDUwIDkwTDUwIDkwQzUwIDk1LjUyMyA1NC40NzcgMTAwIDYwIDEwMEgxNDBDMTQ1LjUyMyAxMDAgMTUwIDk1LjUyMyAxNTAgOTBWOTBDMTUwIDg0LjQ3NyAxNDUuNTIzIDgwIDE0MCA4MEgxMDAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8Y2lyY2xlIGN4PSI3NSIgY3k9IjgwIiByPSI1IiBmaWxsPSIjNjM3MEZGIi8+Cjwvc3ZnPgo=";
                  }
                }}
              />
            ) : (
              <img
                src={imageUrl}
                alt={asset.originalName || asset.filename}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.src.includes("data:image/svg+xml")) {
                    img.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zz4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTEwMCA3MEMxMDUuNTIzIDcwIDExMCA3NC40NzcgMTEwIDgwQzg1NS40NzcgODAgNTAgODQuNDc3IDUwIDkwTDUwIDkwQzUwIDk1LjUyMyA1NC40NzcgMTAwIDYwIDEwMEgxNDBDMTQ1LjUyMyAxMDAgMTUwIDk1LjUyMyAxNTAgOTBWOTBDMTUwIDg0LjQ3NyAxNDUuNTIzIDgwIDE0MCA4MEgxMDAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8Y2lyY2xlIGN4PSI3NSIgY3k9IjgwIiByPSI1IiBmaWxsPSIjNjM3MEZGIi8+Cjwvc3ZnPgo=";
                  }
                }}
              />
            )
          ) : isVideo ? (
            <div className="relative flex h-full w-full items-center justify-center bg-black">
              <video
                src={videoUrl}
                className="h-full w-full object-cover"
                muted
                preload="metadata"
              />
              <div className="center-flex absolute inset-0 bg-black/30">
                <Play className="h-12 w-12 text-white opacity-80" />
              </div>
            </div>
          ) : is3DModel ? (
            <div className="relative h-full w-full bg-linear-to-br from-purple-900/20 to-purple-800/20">
              <div
                className={`h-full w-full ${
                  selectionMode ? "pointer-events-none" : "pointer-events-auto"
                }`}
              >
                <React.Suspense
                  fallback={
                    <div className="bg-white/[0.03] flex h-full w-full items-center justify-center">
                      <Loader2 className="text-admin-muted/70 h-6 w-6 animate-spin" />
                    </div>
                  }
                >
                  <UnifiedModelViewer
                    asset={{
                      ...asset,
                      type: "model",
                      mimeType: asset.mimeType || "model/gltf-binary",
                      filename: asset.filename || `model-${asset.id}.glb`,
                      url: signedUrl || asset.url || MediaUrlBuilder.buildUrlSafe(asset.id),
                    }}
                    showControls={false}
                    showLoadingProgress={false}
                    showFileInfo={false}
                    config={{
                      cameraControls: false,
                      autoRotate: true,
                      backgroundColorHex: "transparent",
                      exposure: 1,
                      shadowIntensity: 0.3,
                      interactionPolicy: "when-focused",
                      loading: "auto",
                    }}
                    className="h-full w-full"
                    onError={() => {}}
                  />
                </React.Suspense>
              </div>
              <div className="center-flex pointer-events-none absolute inset-0">
                <Box className="h-8 w-8 text-purple-400 opacity-30" />
              </div>
              <div className="absolute right-1 bottom-1 rounded bg-purple-600 px-1 py-0.5 text-xs font-medium text-white">
                3D
              </div>
            </div>
          ) : (
            <div className="fallback-content">
              <File className="h-12 w-12" />
              <div className="fallback-text">{asset.type}</div>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="center-flex pointer-events-none absolute inset-0 bg-black/0 opacity-0 backdrop-blur-[0px] transition-all duration-300 ease-out group-hover:bg-black/40 group-hover:opacity-100 group-hover:backdrop-blur-[2px]">
            <div className="pointer-events-auto flex translate-y-4 transform gap-2 transition-transform duration-300 group-hover:translate-y-0">
              <Button
                size="sm"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-white/90 p-0 text-black shadow-lg transition-transform hover:scale-110 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(asset, index);
                }}
                title="Preview"
              >
                <Eye className="h-5 w-5" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-white/90 p-0 text-black shadow-lg transition-transform hover:scale-110 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement("a");
                  link.href = `/api/media/${asset.id}/download`;
                  link.download = asset.originalName || `asset-${asset.id}`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
                title="Download"
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </button>

        {/* File information */}
        <div className="space-y-2 p-3">
          <div
            className="line-clamp-2 text-sm font-medium"
            title={asset.originalName || asset.filename}
          >
            {asset.originalName || asset.filename}
          </div>

          <div className="text-admin-muted flex items-center justify-between text-xs">
            <span className="text-subtle">{formatFileSize(asset.size || 0)}</span>
            <Badge variant="outline" className="text-xs">
              {asset.type}
            </Badge>
          </div>
        </div>

        {/* Optimistic upload state */}
        {isOptimistic && (
          <div className="center-flex absolute inset-0 bg-black/60">
            <div className="border-blue-500 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        )}
      </div>
    );
  },
);

MediaGridItem.displayName = "MediaGridItem";
