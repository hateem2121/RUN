import type { MediaAsset } from "@shared/schema";
import {
  Box,
  Camera,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Star,
  Trash2,
  Video,
} from "lucide-react";
import { memo, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { Label } from "@/components/ui/label";

// import UnifiedModelViewer from '@/components/ui/UnifiedModelViewer';
// Simple Media Grid Component for Product Management
interface SimpleMediaGridProps {
  mediaAssets: MediaAsset[];
  onOrderChange?: (reorderedAssets: MediaAsset[]) => void;
  className?: string | undefined;
  gridCols?: number | undefined;
  itemSize?: string | undefined;
  showStars?: boolean | undefined;
  primaryImageId?: number | null;
  primaryVideoId?: number | null;
  onStarToggle?: (assetId: number, assetType: "image" | "video") => void;
  autoPlayOnHover?: boolean | undefined;
  showVideoControls?: boolean | undefined;
}

function SimpleMediaGrid({
  mediaAssets,
  onOrderChange,
  className,
  showStars = false,
  primaryImageId,
  primaryVideoId,
  onStarToggle,
  autoPlayOnHover = false,
  showVideoControls = false,
}: SimpleMediaGridProps) {
  // Defensive programming: Validate mediaAssets
  if (!Array.isArray(mediaAssets)) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p>Unable to display media assets</p>
        <p className="text-sm">Invalid data format</p>
      </div>
    );
  }

  if (mediaAssets.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p>No media assets to display</p>
      </div>
    );
  }

  const handleRemoveAsset = (assetId: number) => {
    if (onOrderChange && Array.isArray(mediaAssets)) {
      const updatedAssets = mediaAssets.filter((asset) => asset && asset.id !== assetId);
      onOrderChange(updatedAssets);
    }
  };

  const isPrimary = (asset: MediaAsset) => {
    if (!asset || typeof asset.id !== "number") {
      return false;
    }
    return asset.type === "image" ? asset.id === primaryImageId : asset.id === primaryVideoId;
  };

  return (
    <div className={`grid gap-3 ${className || "grid-cols-4"}`}>
      {mediaAssets
        .filter((asset) => asset?.id)
        .map((asset) => (
          <div key={asset.id} className="group relative">
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              {asset.type === "image" ? (
                <img
                  src={asset.url || ""}
                  alt={asset.filename || ""}
                  className="h-full w-full object-cover"
                />
              ) : asset.type === "video" ? (
                <video
                  src={asset.url || ""}
                  className="h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                  {...(autoPlayOnHover && {
                    onMouseEnter: (e) => e.currentTarget.play(),
                    onMouseLeave: (e) => e.currentTarget.pause(),
                  })}
                  {...(showVideoControls && { controls: true })}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted/20">
                  <Box className="h-8 w-8 text-muted-foreground/70" />
                </div>
              )}
            </div>

            {/* Star Toggle */}
            {showStars && onStarToggle && (
              <button
                type="button"
                onClick={() => onStarToggle(asset.id, asset.type === "image" ? "image" : "video")}
                className={`absolute top-2 left-2 rounded-full p-1 ${
                  isPrimary(asset)
                    ? "bg-yellow-500 text-white"
                    : "bg-black/50 text-white hover:bg-yellow-500"
                }`}
              >
                <Star className={`h-4 w-4 ${isPrimary(asset) ? "fill-current" : ""}`} />
              </button>
            )}

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => handleRemoveAsset(asset.id)}
              className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Asset Info */}
            <div className="absolute right-0 bottom-0 left-0 bg-black/70 p-2 text-white text-xs opacity-0 transition-opacity group-hover:opacity-100">
              <div className="truncate">{asset.filename || "Unknown file"}</div>
              {asset.size && (
                <div className="text-muted-foreground/50">{Math.round(asset.size / 1024)} KB</div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

import { AdminProductsErrorBoundary } from "../shared/ErrorBoundary";
import { logger } from "../shared/logger";
import type { ProductFormFieldValue } from "../shared/types";
import { extractMediaIds, mapMediaIdsToAssets } from "../shared/utils";

interface MediaAssetsSectionProps {
  formData: {
    primaryImageId: number | null;
    primaryVideoId: number | null;
    imageIds: number[];
    videos: number[];
    modelFileId: number | null;
  };
  formErrors: Record<string, string>;
  isOpen: boolean;
  onToggle: () => void;
  onInputChange: (field: string, value: ProductFormFieldValue) => void;
  getMediaAsset: (id: number) => MediaAsset | undefined;
}

export const MediaAssetsSection = memo(function MediaAssetsSection({
  formData,
  formErrors,
  isOpen,
  onToggle,
  onInputChange,
  getMediaAsset,
}: MediaAssetsSectionProps) {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [currentMediaField, setCurrentMediaField] = useState<
    "images" | "videos" | "model" | "primaryImage" | "primaryVideo" | null
  >(null);

  const openMediaPicker = (fieldType: typeof currentMediaField) => {
    setCurrentMediaField(fieldType);
    setIsMediaPickerOpen(true);
  };

  const handleMediaSelect = (value: MediaAsset | MediaAsset[] | number | number[] | undefined) => {
    if (!currentMediaField || value === undefined) {
      return;
    }

    // Extract IDs from MediaAsset objects or use numbers directly
    let ids: number[] = [];
    if (Array.isArray(value)) {
      ids = value.map((item) => (typeof item === "number" ? item : item.id));
    } else if (typeof value === "number") {
      ids = [value];
    } else if (value && typeof value === "object" && "id" in value) {
      ids = [value.id];
    }

    // Handle different field types with proper array/single value logic
    if (currentMediaField === "images") {
      // Images field expects array - merge with existing
      const newImageIds = [...(formData.imageIds || [])];
      ids.forEach((id) => {
        if (!newImageIds.includes(id)) {
          newImageIds.push(id);
        }
      });
      onInputChange("imageIds", newImageIds);
    } else if (currentMediaField === "videos") {
      // Videos field expects array - merge with existing
      const newVideoIds = [...(formData.videos || [])];
      ids.forEach((id) => {
        if (!newVideoIds.includes(id)) {
          newVideoIds.push(id);
        }
      });
      onInputChange("videos", newVideoIds);
    } else if (currentMediaField === "model") {
      // Model field expects single value
      onInputChange("modelFileId", ids.length > 0 ? (ids[0] ?? null) : null);
    } else if (currentMediaField === "primaryImage") {
      // Primary image expects single value
      onInputChange("primaryImageId", ids.length > 0 ? (ids[0] ?? null) : null);
    } else if (currentMediaField === "primaryVideo") {
      // Primary video expects single value
      onInputChange("primaryVideoId", ids.length > 0 ? (ids[0] ?? null) : null);
    }

    logger.debug("Media selected and processed", {
      field: currentMediaField,
      originalValue: value,
      extractedIds: ids,
      resultingFormData: {
        imageIds:
          currentMediaField === "images"
            ? [
                ...(formData.imageIds || []),
                ...ids.filter((id) => !(formData.imageIds || []).includes(id)),
              ]
            : formData.imageIds || [],
        videos:
          currentMediaField === "videos"
            ? [
                ...(formData.videos || []),
                ...ids.filter((id) => !(formData.videos || []).includes(id)),
              ]
            : formData.videos || [],
        modelFileId:
          currentMediaField === "model" ? (ids.length > 0 ? ids[0] : null) : formData.modelFileId,
        primaryImageId:
          currentMediaField === "primaryImage"
            ? ids.length > 0
              ? ids[0]
              : null
            : formData.primaryImageId,
        primaryVideoId:
          currentMediaField === "primaryVideo"
            ? ids.length > 0
              ? ids[0]
              : null
            : formData.primaryVideoId,
      },
    });

    setIsMediaPickerOpen(false);
    setCurrentMediaField(null);
  };

  const removeMedia = (fieldType: string, mediaId: number) => {
    if (fieldType === "images") {
      onInputChange(
        "imageIds",
        (formData.imageIds || []).filter((id) => id !== mediaId),
      );
    } else if (fieldType === "videos") {
      onInputChange(
        "videos",
        (formData.videos || []).filter((id) => id !== mediaId),
      );
    } else if (fieldType === "primaryImage") {
      onInputChange("primaryImageId", null);
    } else if (fieldType === "primaryVideo") {
      onInputChange("primaryVideoId", null);
    } else if (fieldType === "model") {
      onInputChange("modelFileId", null);
    }
    logger.debug("Media removed", { fieldType, mediaId });
  };

  // Handle star toggle for primary media selection
  const handleStarToggle = (assetId: number, assetType: "image" | "video") => {
    if (assetType === "image") {
      // Toggle primary image
      const newPrimaryImageId = formData.primaryImageId === assetId ? null : assetId;
      onInputChange("primaryImageId", newPrimaryImageId);
      logger.debug("Primary image toggled", { assetId, newPrimaryImageId });
    } else if (assetType === "video") {
      // Toggle primary video
      const newPrimaryVideoId = formData.primaryVideoId === assetId ? null : assetId;
      onInputChange("primaryVideoId", newPrimaryVideoId);
      logger.debug("Primary video toggled", { assetId, newPrimaryVideoId });
    }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-white p-4 transition-colors hover:bg-background">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Media Assets</h3>
              <p className="text-muted-foreground text-sm">Images, videos, and 3D models</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-6 px-4 pb-4">
          {/* Product Images with Star System */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label className="font-medium text-foreground/80 text-sm">Product Images</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">⭐ Click stars to set primary</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openMediaPicker("images")}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Add Images
                </Button>
              </div>
            </div>
            {(formData.imageIds || []).length > 0 ? (
              <AdminProductsErrorBoundary
                sectionName="Image Grid"
                fallbackMessage="Unable to display images. Media grid encountered an error."
              >
                <SimpleMediaGrid
                  mediaAssets={mapMediaIdsToAssets(formData.imageIds || [], getMediaAsset)}
                  onOrderChange={(reorderedAssets: MediaAsset[]) =>
                    onInputChange("imageIds", extractMediaIds(reorderedAssets))
                  }
                  className="grid-cols-4 gap-3"
                  gridCols={4}
                  showStars={true}
                  primaryImageId={formData.primaryImageId}
                  onStarToggle={handleStarToggle}
                />
              </AdminProductsErrorBoundary>
            ) : (
              <div className="rounded-lg border-2 border-border/50 border-dashed p-8 text-center">
                <ImageIcon className="mx-auto mb-2 h-12 w-12 text-muted-foreground/70" />
                <p className="text-muted-foreground">No images selected</p>
              </div>
            )}
            {formErrors.imageIds && (
              <p className="mt-1 text-red-600 text-sm">{formErrors.imageIds}</p>
            )}
            {formErrors.primaryImageId && (
              <p className="mt-1 text-red-600 text-sm">{formErrors.primaryImageId}</p>
            )}
          </div>

          {/* Product Videos with Star System */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label className="font-medium text-foreground/80 text-sm">Product Videos</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">⭐ Click stars to set primary</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openMediaPicker("videos")}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Add Videos
                </Button>
              </div>
            </div>
            {(formData.videos || []).length > 0 ? (
              <AdminProductsErrorBoundary
                sectionName="Video Grid"
                fallbackMessage="Unable to display videos. Video grid encountered an error."
              >
                <SimpleMediaGrid
                  mediaAssets={mapMediaIdsToAssets(formData.videos || [], getMediaAsset)}
                  onOrderChange={(reorderedAssets: MediaAsset[]) =>
                    onInputChange("videos", extractMediaIds(reorderedAssets))
                  }
                  className="grid-cols-3 gap-3"
                  gridCols={3}
                  autoPlayOnHover={true}
                  showVideoControls={true}
                  showStars={true}
                  primaryVideoId={formData.primaryVideoId}
                  onStarToggle={handleStarToggle}
                />
              </AdminProductsErrorBoundary>
            ) : (
              <div className="rounded-lg border-2 border-border/50 border-dashed p-8 text-center">
                <Video className="mx-auto mb-2 h-12 w-12 text-muted-foreground/70" />
                <p className="text-muted-foreground">No videos selected</p>
              </div>
            )}
            {formErrors.videos && <p className="mt-1 text-red-600 text-sm">{formErrors.videos}</p>}
            {formErrors.primaryVideoId && (
              <p className="mt-1 text-red-600 text-sm">{formErrors.primaryVideoId}</p>
            )}
          </div>

          {/* 3D Model */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label className="font-medium text-foreground/80 text-sm">3D Model</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openMediaPicker("model")}
              >
                <Box className="mr-2 h-4 w-4" />
                Select Model
              </Button>
            </div>
            {formData.modelFileId ? (
              <div className="group relative">
                {(() => {
                  const asset = getMediaAsset(formData.modelFileId);
                  return asset ? (
                    <>
                      <div className="relative h-64 w-64 overflow-hidden rounded-lg border bg-muted">
                        <LazyUnifiedModelViewer
                          asset={asset}
                          className="h-full w-full"
                          showControls={true}
                          showLoadingProgress={true}
                          showFileInfo={false}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia("model", formData.modelFileId!)}
                        className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex h-64 w-64 items-center justify-center rounded-lg border bg-muted/20">
                      <span className="text-muted-foreground text-sm">Asset not found</span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex h-64 w-64 flex-col items-center justify-center rounded-lg border-2 border-border/50 border-dashed">
                <Box className="mb-2 h-12 w-12 text-muted-foreground/70" />
                <span className="text-muted-foreground text-sm">No 3D model selected</span>
              </div>
            )}
            {formErrors.modelFileId && (
              <p className="mt-1 text-red-600 text-sm">{formErrors.modelFileId}</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Unified Media Selection Dialog */}
      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => {
          setIsMediaPickerOpen(false);
          setCurrentMediaField(null);
        }}
        onSelect={(result: MediaAsset | MediaAsset[]) => {
          handleMediaSelect(result);
          if (currentMediaField !== "images" && currentMediaField !== "videos") {
            setIsMediaPickerOpen(false);
            setCurrentMediaField(null);
          }
        }}
        title={
          currentMediaField === "images"
            ? "Select Product Images"
            : currentMediaField === "videos"
              ? "Select Product Videos"
              : currentMediaField === "model"
                ? "Select 3D Model"
                : currentMediaField === "primaryImage"
                  ? "Select Primary Image"
                  : currentMediaField === "primaryVideo"
                    ? "Select Primary Video"
                    : "Select Media"
        }
        mediaPickerTarget={`product-${currentMediaField || "media"}`}
        selectionMode={
          currentMediaField === "images" || currentMediaField === "videos" ? "multiple" : "single"
        }
        maxSelection={currentMediaField === "images" ? 20 : 10}
        initialSelectedIds={
          currentMediaField === "images"
            ? formData.imageIds || []
            : currentMediaField === "videos"
              ? formData.videos || []
              : []
        }
      />
    </>
  );
});

// Default export for lazy loading compatibility
