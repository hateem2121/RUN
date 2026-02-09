import type { MediaAsset } from "@shared/schema";
import { AlertCircle, Check, FileIcon, Image, Video, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import MediaLibraryContainerEnhanced from "@/components/admin/media-library/MediaLibraryContainerEnhanced";
import { useMediaLibraryEnhanced } from "@/components/admin/media-library/MediaLibraryContextEnhanced";
import { Button } from "@/components/ui/button";

interface UnifiedMediaSelectionProps {
  onSelect: (assets: MediaAsset[] | MediaAsset) => void;
  onCancel?: () => void;
  mediaPickerTarget: string;
  selectionMode?: "single" | "multiple";
  maxSelection?: number | undefined;
  initialSelectedIds?: number[];
  className?: string | undefined; // Allow custom sizing from parent dialog
}

// Simplified filter mapping
const getAutoFilterType = (target: string): string => {
  if (target.includes("video")) {
    return "video";
  }
  if (target.includes("image")) {
    return "image";
  }
  if (target.includes("3d") || target.includes("model")) {
    return "model";
  }
  if (target.includes("document")) {
    return "document";
  }
  return "all";
};

const getAssetIcon = (type: string) => {
  switch (type) {
    case "image":
      return <Image className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    case "model":
      return <FileIcon className="h-4 w-4" />;
    default:
      return <FileIcon className="h-4 w-4" />;
  }
};

const getAssetTypeColor = (type: string) => {
  switch (type) {
    case "image":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200";
    case "video":
      return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
    case "model":
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
    default:
      return "bg-muted text-foreground border-border hover:bg-muted/20";
  }
};

/**
 * Unified MediaSelectionWrapper - Eliminates complex workarounds
 *
 * Key improvements:
 * - Single source of truth: MediaLibraryContext with real asset data
 * - No isolated state or global events
 * - Uses existing infinite scroll data
 * - Unified single/multiple selection handling
 * - Flexible sizing for different dialog contexts
 * - Real MediaAsset data integration (no mock data)
 */
export function MediaSelectionWrapperUnified({
  onSelect,
  onCancel,
  mediaPickerTarget,
  selectionMode = "single",
  maxSelection = 10,
  initialSelectedIds = [],
  className = "",
}: UnifiedMediaSelectionProps) {
  const {
    state,
    assets, // Real asset data from context
    setSelectedType,
    selectAssets,
    clearSelection,
  } = useMediaLibraryEnhanced();

  // Initialize selection state with provided IDs
  React.useEffect(() => {
    if (initialSelectedIds.length > 0) {
      selectAssets(initialSelectedIds);
    }
  }, [initialSelectedIds, selectAssets]);

  // Auto-set filter type based on picker context
  React.useEffect(() => {
    const autoFilterType = getAutoFilterType(mediaPickerTarget);
    if (autoFilterType !== "all" && state.selectedType !== autoFilterType) {
      setSelectedType(autoFilterType);
    }
  }, [mediaPickerTarget, state.selectedType, setSelectedType]);

  // Get selected assets from context state - no separate API calls needed
  const selectedAssetIds = Array.from(state.selectedAssets);
  const hasSelection = selectedAssetIds.length > 0;

  // SELECTION FIX: Store full asset objects, not just IDs
  const [selectedAssetsCache, setSelectedAssetsCache] = useState<Map<number, MediaAsset>>(
    new Map(),
  );

  // Custom asset selection handler respecting mode and limits
  const handleAssetSelect = (assetId: number, asset?: MediaAsset) => {
    // Use provided asset or fallback to finding it
    const selectedAsset = asset || assets.find((a) => a.id === assetId);

    if (selectedAsset) {
      // CACHE FIX: Store full asset object for later retrieval
      setSelectedAssetsCache((prev) => {
        const updated = new Map(prev);
        updated.set(assetId, selectedAsset);
        return updated;
      });
    } else {
    }

    const currentSelection = new Set(state.selectedAssets);

    if (selectionMode === "single") {
      selectAssets([assetId]);
    } else {
      // Multiple selection: toggle selection with limits
      if (currentSelection.has(assetId)) {
        currentSelection.delete(assetId);
        selectAssets(Array.from(currentSelection));

        // Remove from cache when deselected
        setSelectedAssetsCache((prev) => {
          const updated = new Map(prev);
          updated.delete(assetId);
          return updated;
        });
      } else if (currentSelection.size < maxSelection) {
        currentSelection.add(assetId);
        selectAssets(Array.from(currentSelection));
      } else {
      }
    }
  };

  const handleConfirmSelection = async () => {
    if (selectedAssetIds.length > 0) {
      // CACHE FIX: Use cached assets first, fallback to current page assets, then API
      const { foundAssets, missingIds } = selectedAssetIds.reduce<{
        foundAssets: MediaAsset[];
        missingIds: number[];
      }>(
        (acc, id) => {
          // Try cache first (contains assets from all pages)
          let foundAsset = selectedAssetsCache.get(id);

          if (foundAsset) {
            acc.foundAssets.push(foundAsset);
            return acc;
          }

          // Fallback to current page assets
          foundAsset = assets.find((asset) => asset.id === id);

          if (foundAsset) {
            acc.foundAssets.push(foundAsset);
            return acc;
          }
          acc.missingIds.push(id);
          return acc;
        },
        { foundAssets: [], missingIds: [] },
      );

      // API FALLBACK: Fetch missing assets by ID
      if (missingIds.length > 0) {
        try {
          const responses = await Promise.all(
            missingIds.map((id) =>
              fetch(`/api/media/${id}`)
                .then((res) => {
                  if (!res.ok) {
                    throw new Error(`Failed to fetch asset ${id}`);
                  }
                  return res.json();
                })
                .catch((_err) => {
                  return null;
                }),
            ),
          );

          const fetchedAssets = responses.filter(Boolean) as MediaAsset[];

          // Add fetched assets to the result
          foundAssets.push(...fetchedAssets);
        } catch (_error) {}
      }

      if (foundAssets.length > 0) {
        const result = selectionMode === "single" ? foundAssets[0]! : foundAssets;

        try {
          onSelect(result);
        } catch (_error) {}
      } else {
      }
    } else {
    }
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  const handleRemoveAsset = (assetId: number) => {
    const updatedSelection = new Set(state.selectedAssets);
    updatedSelection.delete(assetId);
    selectAssets(Array.from(updatedSelection));
  };

  // CACHE FIX: Get display data from cache first, fallback to current page
  const selectedAssetsForDisplay = useMemo(() => {
    return selectedAssetIds
      .map((id) => {
        // Try cache first (multi-page selections)
        const cachedAsset = selectedAssetsCache.get(id);
        if (cachedAsset) {
          return cachedAsset;
        }

        // Fallback to current page assets
        return assets.find((asset: MediaAsset) => asset.id === id);
      })
      .filter(Boolean) as MediaAsset[];
  }, [selectedAssetIds, assets, selectedAssetsCache]);

  return (
    <div className={`flex h-full min-h-0 flex-col ${className}`}>
      {/* SCROLL FIX: Own the scroll container to prevent 3D model viewers from stealing wheel events */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <MediaLibraryContainerEnhanced
          selectionMode={true}
          useExistingContext={true}
          mediaPickerTarget={mediaPickerTarget}
          initialFilter={getAutoFilterType(mediaPickerTarget)}
          onAssetSelect={handleAssetSelect}
        />
      </div>

      {/* Fixed/Floating selection confirmation bar */}
      {hasSelection && (
        <div
          className="z-elevated flex shrink-0 flex-col gap-4 border-blue-300/50 border-t bg-linear-to-br from-blue-50/95 via-indigo-50/95 to-cyan-50/95 px-6 py-4 pb-[calc(theme(spacing.4)+env(safe-area-inset-bottom))] shadow-sm-blue-200/20 shadow-xl transition-all duration-300 ease-out supports-[backdrop-filter]:bg-white/90"
          data-testid="bar-selection-confirmation"
        >
          {/* Selected assets display for multiple mode */}
          {selectionMode === "multiple" && selectedAssetsForDisplay.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                <h4 className="font-semibold text-foreground/80 text-sm">Selected Assets</h4>
                <div className="h-px flex-1 bg-linear-to-r from-blue-200 to-transparent"></div>
              </div>
              <div className="custom-scrollbar flex max-h-28 flex-wrap gap-3 overflow-y-auto">
                {selectedAssetsForDisplay.map((asset: MediaAsset) => (
                  <div
                    key={asset.id}
                    className={`group relative flex min-w-0 max-w-56 items-center gap-3 rounded-xl border-2 px-4 py-2.5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${getAssetTypeColor(
                      asset.type,
                    )} `}
                    data-testid={`badge-selected-asset-${asset.id}`}
                  >
                    <div className="shrink-0 rounded-lg bg-white/70 p-1.5">
                      {getAssetIcon(asset.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate font-medium text-sm"
                        title={asset.originalName || asset.filename}
                      >
                        {asset.originalName || asset.filename}
                      </div>
                      <div className="text-xs uppercase tracking-wide opacity-70">
                        {asset.type.replace("_", " ")}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 shrink-0 rounded-full border-2 border-transparent bg-white/70 p-0 opacity-60 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      onClick={() => handleRemoveAsset(asset.id)}
                      data-testid={`button-remove-asset-${asset.id}`}
                      title="Remove asset"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state when selection can't be resolved */}
          {selectedAssetIds.length > 0 && selectedAssetsForDisplay.length === 0 && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Some selected assets could not be found. Please refresh and try again.</span>
            </div>
          )}

          {/* Selection status and controls */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {hasSelection ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-4 w-4 animate-pulse rounded-full bg-linear-to-r from-blue-500 to-indigo-500"></div>
                      <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-linear-to-r from-blue-500 to-indigo-500 opacity-20"></div>
                    </div>
                    <div>
                      <div className="font-semibold text-base text-foreground">
                        {selectionMode === "single" ? (
                          <div className="flex items-center gap-2">
                            <span>Ready to select:</span>
                            <span className="rounded-md bg-blue-100 px-2 py-1 font-medium text-blue-700 text-sm">
                              {selectedAssetsForDisplay[0]?.originalName ||
                                selectedAssetsForDisplay[0]?.filename ||
                                "Asset"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-blue-100 px-2 py-1 font-bold text-blue-700 text-sm">
                              {selectedAssetIds.length}
                            </span>
                            <span>asset{selectedAssetIds.length > 1 ? "s" : ""} selected</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-0.5 text-muted-foreground text-xs">
                        {selectionMode === "multiple" && `Maximum: ${maxSelection} assets`}
                        {selectionMode === "single" && "Single selection mode"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-4 w-4 rounded-full bg-muted/30 opacity-60"></div>
                  <div>
                    <span className="font-medium text-muted-foreground text-sm">
                      Choose {selectionMode === "single" ? "a media asset" : "media assets"} from
                      above
                    </span>
                    <div className="mt-0.5 text-muted-foreground/70 text-xs">
                      {selectionMode === "multiple"
                        ? `Up to ${maxSelection} assets`
                        : "Single selection"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {hasSelection && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="border border-border font-medium text-muted-foreground transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="border-border/50 font-medium text-foreground/80 transition-all duration-200 hover:border-border/70 hover:bg-background hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!hasSelection}
                onClick={handleConfirmSelection}
                className={`font-semibold shadow-lg transition-all duration-200 hover:shadow-xl ${
                  hasSelection
                    ? "transform bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 hover:from-blue-700 hover:to-indigo-700 active:scale-95"
                    : "cursor-not-allowed bg-muted text-muted-foreground/70"
                } `}
              >
                {hasSelection ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Selection
                  </>
                ) : (
                  "Select Media"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
