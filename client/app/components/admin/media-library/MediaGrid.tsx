import type { MediaAsset } from "@shared/index";
import { AlertCircle, FileImage } from "lucide-react";
import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
// Import Extracted Components
import { MediaGridItem } from "./components/MediaGridItem";
import { MediaGridPagination } from "./components/MediaGridPagination";
import { MediaGridToolbar } from "./components/MediaGridToolbar";
import { useMediaGridQuery } from "./hooks/useMediaGridQuery";
import { useMediaLibrary } from "./MediaLibraryContextEnhanced";

export interface MediaGridProps {
  selectionMode?: boolean;
  isStandalone?: boolean;
  onAssetSelect?: (assetId: number, asset?: MediaAsset) => void;
}

export function MediaGrid({
  selectionMode = false,
  isStandalone = false,
  onAssetSelect,
}: MediaGridProps) {
  const { state, setSelectedAsset, setLightboxOpen, toggleAsset } = useMediaLibrary();

  const containerRef = useRef<HTMLDivElement>(null);

  const gridClassName = cn(
    "grid gap-4",
    isStandalone
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  );

  // Use extracted query hook
  const { displayAssets, pagination, batchContent, isLoading, error } = useMediaGridQuery();

  const totalAssets = pagination.total;

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  }, []);

  const handleAssetSelect = useCallback(
    (assetId: number, asset?: MediaAsset) => {
      toggleAsset(assetId);
      if (onAssetSelect) {
        onAssetSelect(assetId, asset);
      }
    },
    [toggleAsset, onAssetSelect],
  );

  const handleAssetClick = useCallback(
    (asset: MediaAsset, _index: number) => {
      setSelectedAsset(asset);
      setLightboxOpen(true);
    },
    [setSelectedAsset, setLightboxOpen],
  );

  if (error) {
    return (
      <div className="error-card-base rounded-lg p-6">
        <div className="error-title">
          <AlertCircle className="h-5 w-5" />
          Failed to load media
        </div>
        <p className="error-message mt-2">
          {error instanceof Error
            ? error.message
            : String(error) || "An error occurred while fetching media assets"}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid-responsive-media">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-white/[0.03] aspect-square animate-pulse rounded-lg border border-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (displayAssets.length === 0) {
    return (
      <div className="fallback-content py-12">
        <FileImage className="mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-medium">No media found</h3>
        <p className="text-admin-muted">
          {state.searchTerm || state.selectedType !== "all"
            ? "Try adjusting your search or filters"
            : "Upload some media to get started"}
        </p>
      </div>
    );
  }

  const hasSelection = state.selectedAssets.size > 0;
  const needsBottomPadding = selectionMode && hasSelection;

  return (
    <div className={cn("min-h-0 space-y-4", needsBottomPadding && "pb-24")}>
      <MediaGridToolbar />

      <div ref={containerRef} className="w-full">
        <div className={cn(gridClassName, state.viewMode === "list" && "grid-cols-1")}>
          {displayAssets.map((asset: MediaAsset, index: number) => (
            <MediaGridItem
              key={`${asset.id}-${batchContent?.[asset.id] ? "signed" : "loading"}`}
              asset={asset}
              isSelected={state.selectedAssets.has(asset.id)}
              isOptimistic={false}
              onSelect={handleAssetSelect}
              onClick={handleAssetClick}
              formatFileSize={formatFileSize}
              index={index}
              selectionMode={selectionMode}
              signedUrl={batchContent?.[asset.id]}
            />
          ))}
        </div>
      </div>

      <MediaGridPagination
        totalPages={pagination.totalPages}
        totalAssets={totalAssets}
        displayCount={displayAssets.length}
      />
    </div>
  );
}
