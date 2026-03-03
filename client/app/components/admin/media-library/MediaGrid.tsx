import type { MediaAsset } from "@shared/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Archive,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  File,
  FileImage,
  Grid3X3,
  List,
  Loader2,
  MoreHorizontal,
  Play,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCacheInvalidationListener } from "@/hooks/useCacheInvalidation";
// Removed: react-window virtual scrolling for simplified grid layout
// Import removed - using direct API response
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { apiRequest, batchFetchMediaContent, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useMediaLibraryEnhanced } from "./MediaLibraryContextEnhanced";

// STEP 3 INTEGRATION: Import UnifiedModelViewer for 3D preview thumbnails
const UnifiedModelViewer = React.lazy(() =>
  import("@/components/ui/UnifiedModelViewer").then((m) => ({ default: m.UnifiedModelViewer })),
);

// Import centralized standardized query keys
import { createMediaQueryKey, invalidateMediaQueries } from "@/lib/media-query-keys";

// Consolidated Media Grid Item Component (replaces MediaGridItemEnhanced)
interface MediaGridItemProps {
  asset: MediaAsset;
  isSelected: boolean;
  isOptimistic: boolean;
  onSelect: (id: number, asset?: MediaAsset) => void;
  onClick: (asset: MediaAsset, index: number) => void;
  formatFileSize: (bytes: number) => string;
  index: number;
  selectionMode?: boolean | undefined; // SCROLL FIX: Add selectionMode prop to control pointer events
  signedUrl?: string | null | undefined; // PERFORMANCE FIX: Direct signed URL from batch fetch
}

const MediaGridItem = React.memo(
  ({
    asset,
    isSelected,
    isOptimistic,
    onSelect,
    onClick,
    formatFileSize,
    index,
    selectionMode = false, // SCROLL FIX: Default to false for compatibility
    signedUrl,
  }: MediaGridItemProps) => {
    const isImage = asset.type === "image";
    const isVideo = asset.type === "video";
    const is3DModel = asset.type === "3d_model" || asset.type === "model";

    // Pre-compute URLs to avoid nested ternaries
    const isSvg = asset.mimeType === "image/svg+xml";
    const imageUrl = signedUrl || `/api/media/${asset.id}/content`;
    const videoUrl = signedUrl || MediaUrlBuilder.buildUrlSafe(asset.id);
    if (isVideo) {
    }

    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border transition-all duration-200",
          "hover:scale-[1.02] hover:shadow-lg",
          isOptimistic && "pointer-events-none opacity-60",
          isSelected
            ? "border-blue-500 ring-2 ring-blue-200/50"
            : "border-border hover:border-border/50",
        )}
      >
        {/* Selection checkbox */}
        <div
          className={cn(
            "z-elevated absolute top-2 left-2 transition-opacity",
            selectionMode ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {/* Selection checkbox outside the button to prevent nested button issues */}
          <div
            role="checkbox"
            aria-checked={isSelected ? "true" : "false"}
            tabIndex={0}
            className={cn(
              "flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 transition-all",
              isSelected
                ? "border-blue-500 bg-blue-500"
                : "border-border/50 bg-white hover:border-blue-400",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(asset.id, asset);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onSelect?.(asset.id, asset);
              }
            }}
          >
            {isSelected && <Check className="h-4 w-4 text-white" />}
          </div>
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

        {/* Enhanced Media preview with video and 3D support */}
        <div
          className="group z-elevated bg-muted relative flex aspect-square w-full cursor-pointer items-center justify-center"
          onClick={() => onClick(asset, index)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick(asset, index);
            }
          }}
          aria-label={`Preview ${asset.originalName || asset.filename}`}
        >
          {isImage ? (
            isSvg ? (
              // SVG-specific handling with object-contain to prevent cropping
              <img
                src={imageUrl}
                alt={asset.originalName || asset.filename}
                className="h-full w-full object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  // Prevent infinite retry loop - set to placeholder on error
                  if (!img.src.includes("data:image/svg+xml")) {
                    img.src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMTAwIDcwQzEwNS41MjMgNzAgMTEwIDc0LjQ3NyAxMTAgODBDODU1LjQ3NyA4MCA1MCA4NC40NzcgNTAgOTBMNTAgOTBDNTAgOTUuNTIzIDU0LjQ3NyAxMDAgNjAgMTAwSDE0MEMxNDUuNTIzIDEwMCAxNTAgOTUuNTIzIDE1MCA5MFY5MEMxNTAgODQuNDc3IDE0NS41MjMgODAgMTQwIDgwSDEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPGNpcmNsZSBjeD0iNzUiIGN5PSI4MCIgcj0iNSIgZmlsbD0iIzYzNzBGRiIvPgo8L3N2Zz4K";
                  }
                }}
              />
            ) : (
              // PHASE 2 OPTIMIZATION: Use thumbnails for grid images - 90% faster loading!
              <img
                src={imageUrl}
                alt={asset.originalName || asset.filename}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  // Prevent infinite retry loop - set to placeholder on error
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
            <div className="relative h-full w-full bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              {/* STEP 3 INTEGRATION: Enhanced 3D preview using UnifiedModelViewer */}
              {/* SCROLL FIX: Disable pointer events in selection mode to prevent wheel event capture */}
              <div
                className={`h-full w-full ${
                  selectionMode ? "pointer-events-none" : "pointer-events-auto"
                }`}
              >
                <React.Suspense
                  fallback={
                    <div className="bg-muted flex h-full w-full items-center justify-center">
                      <Loader2 className="text-muted-foreground/70 h-6 w-6 animate-spin" />
                    </div>
                  }
                >
                  <UnifiedModelViewer
                    asset={{
                      ...asset,
                      type: "model", // Ensure type is normalized
                      mimeType: asset.mimeType || "model/gltf-binary",
                      filename: asset.filename || `model-${asset.id}.glb`,
                      url: signedUrl || asset.url || MediaUrlBuilder.buildUrlSafe(asset.id), // Ensure URL is available
                    }}
                    showControls={false}
                    showLoadingProgress={false}
                    showFileInfo={false}
                    config={{
                      cameraControls: false, // Disable controls for thumbnail
                      autoRotate: true,
                      backgroundColorHex: "transparent",
                      exposure: 1,
                      shadowIntensity: 0.3,
                      interactionPolicy: "when-focused", // Minimal interaction for grid
                      loading: "auto", // Changed from "lazy" - load immediately in admin panel
                    }}
                    className="h-full w-full"
                    onError={() => {}}
                  />
                </React.Suspense>
              </div>
              {/* Fallback overlay for loading/error states */}
              <div className="center-flex pointer-events-none absolute inset-0">
                <Box className="h-8 w-8 text-purple-400 opacity-30" />
              </div>
              {/* 3D Model badge */}
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

          {/* Premium Hover Overlay */}
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
                  // Simple download trigger
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
        </div>

        {/* File information */}
        <div className="space-y-2 p-3">
          <div
            className="line-clamp-2 text-sm font-medium"
            title={asset.originalName || asset.filename}
          >
            {asset.originalName || asset.filename}
          </div>

          <div className="text-muted flex items-center justify-between text-xs">
            <span className="text-subtle">{formatFileSize(asset.size || 0)}</span>
            <Badge variant="outline" className="text-xs">
              {asset.type}
            </Badge>
          </div>
        </div>

        {/* Loading overlay for optimistic uploads */}
        {isOptimistic && (
          <div className="center-flex absolute inset-0 bg-white/80">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        )}
      </div>
    );
  },
);

MediaGridItem.displayName = "MediaGridItem";

// REMOVED: Virtual scrolling components for simplified UI
// REMOVED: Unused PaginationControls component (using inline pagination)

// Consolidated Bulk Operations
const MediaBulkOperations = React.memo(() => {
  const { state, clearSelection } = useMediaLibraryEnhanced();
  const { toast } = useToast();

  const selectedCount = state.selectedAssets.size;
  const hasSelection = selectedCount > 0;

  // PHASE 5: Optimized bulk delete mutation with optimistic updates, rollback, and concurrent protection
  const bulkDeleteMutation = useMutation({
    mutationKey: ["media", "bulk-delete"], // Enables concurrent mutation tracking

    mutationFn: (ids: number[]) => {
      return apiRequest("/api/media/batch", {
        method: "POST",
        body: JSON.stringify({ operation: "delete", ids }),
        headers: { "Content-Type": "application/json" },
      });
    },

    onMutate: async (deletedIds) => {
      // Cancel outgoing refetches (optimistic update)
      await getQueryClient().cancelQueries({
        queryKey: ["/api/media"],
      });

      // Snapshot previous value for rollback
      const previousData = getQueryClient().getQueryData(["/api/media"]);

      // Optimistically update cache - remove items immediately
      getQueryClient().setQueriesData(
        {
          predicate: (query) => {
            const key = query.queryKey[0];
            return key === "/api/media";
          },
        },
        (oldData: unknown) => {
          const dataRecord = oldData as Record<string, unknown>;
          if (!dataRecord || !dataRecord.data || !Array.isArray(dataRecord.data)) {
            return oldData;
          }

          // Filter out deleted items
          const filteredData = dataRecord.data.filter(
            (item: unknown) =>
              typeof item === "object" &&
              item !== null &&
              "id" in item &&
              !deletedIds.includes(item.id as number),
          );

          // Update meta.total to reflect new count
          const metaObj = (dataRecord.meta || {}) as Record<string, unknown>;

          return {
            ...dataRecord,
            data: filteredData,
            meta: {
              ...metaObj,
              total: filteredData.length,
            },
          };
        },
      );

      return { previousData };
    },

    onSuccess: (_, deletedIds) => {
      // Clear selection after successful delete
      clearSelection();

      toast({
        title: "Bulk delete successful",
        description: `${deletedIds.length} items deleted successfully`,
      });
    },

    onError: (_err, _deletedIds, context) => {
      // Rollback on error - restore previous data
      if (context?.previousData) {
        getQueryClient().setQueryData(["/api/media"], context.previousData);
      }

      toast({
        title: "Bulk delete failed",
        description: _err instanceof Error ? _err.message : "An error occurred during bulk delete",
        variant: "destructive",
      });
    },

    onSettled: async () => {
      // CONCURRENT MUTATION PROTECTION
      // Only invalidate if this is the last pending mutation
      const pendingMutations = getQueryClient().isMutating({
        mutationKey: ["media"],
      });

      if (pendingMutations === 1) {
        // Only this mutation pending - safe to invalidate
        await invalidateMediaQueries(getQueryClient());
      }
    },
  });

  const bulkDownloadMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await fetch("/api/media/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error("Bulk download failed");
      }

      return response.blob();
    },
    onSuccess: (blob) => {
      const url = globalThis.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `media-export-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${selectedCount} items as ZIP`,
      });
    },
    onError: (error) => {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "An error occurred during download",
        variant: "destructive",
      });
    },
  });

  const handleBulkDownload = () => {
    if (!hasSelection) {
      return;
    }
    const ids = Array.from(state.selectedAssets);
    bulkDownloadMutation.mutate(ids);
  };

  const handleBulkDelete = () => {
    if (!hasSelection) {
      return;
    }

    const ids = Array.from(state.selectedAssets);
    bulkDeleteMutation.mutate(ids);
  };

  if (!hasSelection) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="status-badge-base">
        {selectedCount} selected
      </Badge>

      <Button
        onClick={handleBulkDownload}
        variant="outline"
        size="sm"
        className="action-button-sidebar"
      >
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleBulkDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Selected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>
            <Archive className="mr-2 h-4 w-4" />
            Archive Selected
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBulkDelete} className="action-button-danger">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

MediaBulkOperations.displayName = "MediaBulkOperations";

// Main MediaGrid Component (consolidates MediaGridResponsive)
// MediaGridProps interface was redundant and removed to simplify the file.
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
  const { state, updateState, setSelectedAsset, setLightboxOpen, setCurrentPage, setTotalPages } =
    useMediaLibraryEnhanced();

  const containerRef = useRef<HTMLDivElement>(null);

  // Standalone check used for grid classes
  const gridClassName = cn(
    "grid gap-4",
    isStandalone
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  );

  // PHASE 4: Event-driven cache invalidation - listen for backend cache invalidation events
  useCacheInvalidationListener("media:");

  // Build query parameters - PAGINATION FIX: Always use pagination (both standalone & modal)
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (state.searchTerm) {
      params.append("search", state.searchTerm);
    }
    if (state.selectedType && state.selectedType !== "all") {
      params.append("type", state.selectedType);
    }
    params.append("sortBy", state.sortBy);
    params.append("sortOrder", state.sortOrder);

    // PAGINATION FIX: Use currentPage in both selection mode and standalone
    params.append("page", String(state.currentPage));
    params.append("limit", "24"); // Standard pagination: 24 items per page

    // CACHE FIX: Force bypass of server-side cache (max-age=60s) for admin grid
    params.append("nocache", "true");

    return params;
  };

  // Use centralized standardized query keys
  const params = buildQueryParams();
  const apiUrl = `/api/media?${params.toString()}`;

  // Standardized query key - ensures cache invalidation works everywhere
  const queryKey = createMediaQueryKey.paginated({
    page: state.currentPage,
    limit: 24,
    search: state.searchTerm,
    type: state.selectedType,
  });

  // 🔍 PAGINATION SYNC MONITOR: Track frontend-backend pagination alignment
  useEffect(() => {}, []);

  // Traditional pagination media query with proper timeout and selective retry
  const {
    data: mediaResponse,
    status,
    error,
  } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      // Use React Query's signal for proper cancellation integration
      const timeoutId = setTimeout(() => {}, 30000);

      try {
        const response = await fetch(apiUrl, { signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
        }

        const jsonData = await response.json();

        return jsonData;
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        const err = error as Error;

        // DIALOG FIX: Handle abort signals gracefully to prevent unhandled promise rejections
        if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
          // Silently handle cancellation - this is expected behavior in dialogs
          if (process.env.NODE_ENV === "development") {
          }
          // Return empty result instead of throwing to prevent unhandled promise rejections
          return {
            success: false,
            data: [],
            pagination: { page: 1, totalPages: 0, totalCount: 0 },
          };
        }

        throw error;
      }
    },

    // STALE-WHILE-REVALIDATE PATTERN (Phase 5)
    staleTime: 2 * 60 * 1000, // 2 min - consider fresh, don't refetch
    gcTime: 10 * 60 * 1000, // 10 min - keep in cache (was cacheTime in v4)
    refetchOnWindowFocus: true, // Refetch on window focus (user returns to tab)
    refetchOnMount: false, // Don't refetch on mount if data is fresh (within staleTime)

    // CLIENT-SIDE FILTER (Phase 5): Safety net for stale cache
    select: (data) => {
      const dataRecord = data as Record<string, unknown>;
      if (!dataRecord || !dataRecord.data || !Array.isArray(dataRecord.data)) {
        return data;
      }

      // MediaGridProps interface removed as it was redundant with local component props and unused elsewhere.
      // Small helper for individual media items (internal)
      // Filter out deletedAt items as safety net against stale backend cache
      const filteredAssets = dataRecord.data.filter((asset: unknown) => {
        if (typeof asset !== "object" || asset === null) {
          return true;
        }
        const assetObj = asset as Record<string, unknown>;
        return !assetObj.deletedAt; // Exclude items with deletedAt set
      });

      // Update meta.total to reflect filtered count
      const metaObj = (dataRecord.meta || {}) as Record<string, unknown>;

      return {
        ...dataRecord,
        data: filteredAssets,
        meta: {
          ...metaObj,
          total: filteredAssets.length,
        },
      };
    },

    retry: (failureCount, error) => {
      // DIALOG FIX: Enhanced abort signal detection for all variations
      const err = error as Error & {
        code?: string | undefined;
        response?: { headers?: Record<string, string> };
      };
      const isAbortError =
        err?.name === "AbortError" ||
        err?.message?.includes("aborted") ||
        err?.message?.includes("cancelled") ||
        err?.code === "ABORT_ERR";

      if (isAbortError) {
        return false; // Never retry cancelled requests
      }

      // 429 Rate Limit: Retry with exponential backoff (max 3 attempts)
      if (err?.message?.includes("429")) {
        return failureCount < 3;
      }

      if (err?.message?.includes("Failed to fetch media: 4")) {
        return false; // Don't retry 4xx errors
      }
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        return failureCount < 2; // Network errors: 2 retries
      }
      if (err?.message?.includes("Failed to fetch media: 5")) {
        return failureCount < 2; // 5xx errors: 2 retries
      }
      return false; // Don't retry other errors
    },
    retryDelay: (attemptIndex, error) => {
      // Check for Retry-After header in 429 responses
      const err = error as Error & {
        response?: { headers?: { get?: (key: string) => string | null } };
      };
      const retryAfter = err?.response?.headers?.get?.("Retry-After");

      if (retryAfter) {
        const retrySeconds = Number.parseInt(retryAfter, 10);
        if (!Number.isNaN(retrySeconds)) {
          return retrySeconds * 1000;
        }
      }

      // Exponential backoff for 429: 2s, 4s, 8s (capped at 10s)
      if (err?.message?.includes("429")) {
        const delay = Math.min(2000 * 2 ** attemptIndex, 10000);
        return delay;
      }

      // Conservative backoff for other errors: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 5000);
    },
  });

  const isLoading = status === "pending";

  // FIXED: Defensive parsing for both cache hit/miss response formats
  const response = mediaResponse as Record<string, unknown> | undefined;
  const responseData = response?.data as Record<string, unknown> | unknown[] | undefined;
  const displayAssets =
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData &&
    Array.isArray(responseData.data)
      ? responseData.data
      : Array.isArray(responseData)
        ? responseData
        : [];
  // PAGINATION FIX: Backend uses "meta" field with "pages" (not "pagination" with "totalPages")
  const metaRaw = (
    responseData && typeof responseData === "object" && "meta" in responseData
      ? responseData.meta
      : response?.meta
  ) as
    | {
        pages?: number | undefined;
        total?: number | undefined;
        page?: number | undefined;
        limit?: number;
      }
    | undefined;
  const paginationRaw = (
    responseData && typeof responseData === "object" && "pagination" in responseData
      ? responseData.pagination
      : response?.pagination
  ) as
    | {
        totalPages?: number | undefined;
        total?: number | undefined;
        page?: number | undefined;
        limit?: number;
      }
    | undefined;

  // PAGINATION FIX: Calculate totalPages from total/limit if not provided
  const total = metaRaw?.total || paginationRaw?.total || 0;
  const limit = metaRaw?.limit || paginationRaw?.limit || 24;
  const calculatedTotalPages = total > 0 ? Math.ceil(total / limit) : 0;

  const pagination = {
    totalPages: metaRaw?.pages || paginationRaw?.totalPages || calculatedTotalPages,
    total: total,
    page: metaRaw?.page || paginationRaw?.page || 1,
    limit: limit,
  };
  const totalAssets = pagination.total;

  // 🔍 API RESPONSE VALIDATION: Verify backend response matches request
  useEffect(() => {
    if (mediaResponse && status === "success") {
      const requestPage = Number.parseInt(params.get("page") || "1", 10);
      const requestLimit = Number.parseInt(params.get("limit") || "24", 10);
      const pageMatch = requestPage === pagination.page;
      const limitMatch = requestLimit === pagination.limit;
      const frontendMatch = state.currentPage === pagination.page;
      if (!pageMatch || !limitMatch || !frontendMatch) {
      }
    }
  }, [mediaResponse, status, state.currentPage, pagination.limit, pagination.page, params.get]);

  // Data validation logic retained without console output

  // REMOVED: Sync with context to prevent infinite loop
  // The context should be the single source of truth, not receiving updates from MediaGrid

  // Update context pagination state when API response changes
  useEffect(() => {
    if (pagination.totalPages && pagination.totalPages !== state.totalPages) {
      setTotalPages(pagination.totalPages);
    }
  }, [pagination.totalPages, state.totalPages, setTotalPages]);

  // Reset to page 1 when filters change (important UX)
  useEffect(() => {
    if (state.currentPage > 1) {
      setCurrentPage(1);
    }
  }, [setCurrentPage, state.currentPage]);

  // Asset handling

  // PERFORMANCE FIX: Batch fetch media content to prevent connection exhaustion
  // This fetches signed URLs for all displayed assets in a single request
  const { data: batchContent } = useQuery({
    queryKey: ["media-batch", displayAssets.map((a: MediaAsset) => a.id).join(",")],
    queryFn: async () => {
      if (displayAssets.length === 0) {
        return {};
      }
      const ids = displayAssets.map((a: MediaAsset) => a.id);
      const results = await batchFetchMediaContent(ids);

      // Create a map of ID -> Signed URL
      const urlMap: Record<number, string> = {};
      for (const result of results) {
        if (result.success && result.url) {
          urlMap[result.id] = result.url;
        } else {
        }
      }

      return urlMap;
    },
    enabled: displayAssets.length > 0,
    staleTime: 45 * 60 * 1000, // 45 minutes (matches server cache)
    refetchOnMount: true, // Ensure fresh data on component mount
  });
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) {
      return "0 B";
    }
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  }, []);

  // Simplified selection handling - using context methods properly
  const { toggleAsset } = useMediaLibraryEnhanced();
  const handleAssetSelect = useCallback(
    (assetId: number, asset?: MediaAsset) => {
      toggleAsset(assetId);

      // Call external callback if provided (for modal contexts)
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

  // Error state
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid-responsive-media">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-muted aspect-square animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (displayAssets.length === 0) {
    return (
      <div className="fallback-content py-12">
        <FileImage className="mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-medium">No media found</h3>
        <p className="text-muted-foreground">
          {state.searchTerm || state.selectedType !== "all"
            ? "Try adjusting your search or filters"
            : "Upload some media to get started"}
        </p>
      </div>
    );
  }

  // SCROLL FIX: Add bottom padding in selection mode when selection bar is present
  const hasSelection = state.selectedAssets.size > 0;
  const needsBottomPadding = selectionMode && hasSelection;

  return (
    <div className={cn("min-h-0 space-y-4", needsBottomPadding && "pb-24")}>
      {/* Header with view controls and bulk operations */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={state.viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => updateState("viewMode", "grid")}
              className="action-button-icon"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={state.viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => updateState("viewMode", "list")}
              className="action-button-icon"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Select
            value={state.sortBy}
            onValueChange={(value) => updateState("sortBy", value as typeof state.sortBy)}
          >
            <SelectTrigger className="w-36 sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="uploadedAt">Upload Date</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => updateState("sortOrder", state.sortOrder === "asc" ? "desc" : "asc")}
            className="action-button-icon"
          >
            {state.sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>

        <MediaBulkOperations />
      </div>

      {/* SIMPLIFIED: Pure CSS Grid Layout (removed virtual scrolling complexity) */}
      <div ref={containerRef} className="w-full">
        <div className={cn(gridClassName, state.viewMode === "list" && "grid-cols-1")}>
          {displayAssets.map((asset: MediaAsset, index: number) => (
            <MediaGridItem
              key={`${asset.id}-${batchContent?.[asset.id] ? "signed" : "loading"}`}
              asset={asset}
              isSelected={state.selectedAssets.has(asset.id)}
              aria-checked={state.selectedAssets.has(asset.id) ? "true" : "false"}
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

      {/* Traditional Pagination Controls - Now shown in BOTH standalone and selection mode */}
      {(() => {
        // FIX: Show pagination in both modes when there are multiple pages
        const shouldShowPagination = pagination.totalPages > 1;

        return shouldShowPagination;
      })() && (
        <div
          className="flex items-center justify-between border-t px-4 py-6"
          data-testid="pagination-controls"
        >
          <div className="text-muted-foreground text-sm">
            Showing {displayAssets.length} of {totalAssets} media items
          </div>

          <div className="flex items-center gap-2">
            {/* Previous Page Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, state.currentPage - 1))}
              disabled={state.currentPage <= 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pageNum = 0;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (state.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (state.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = state.currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === state.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="h-8 min-w-8"
                  >
                    {pageNum}
                  </Button>
                );
              })}

              {pagination.totalPages > 5 && state.currentPage < pagination.totalPages - 2 && (
                <>
                  <span className="text-muted-foreground px-2">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pagination.totalPages)}
                    className="h-8 min-w-8"
                  >
                    {pagination.totalPages}
                  </Button>
                </>
              )}
            </div>

            {/* Next Page Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, state.currentPage + 1))}
              disabled={state.currentPage >= pagination.totalPages}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* No pagination needed but show count - Now shown in both modes */}
      {pagination.totalPages <= 1 && displayAssets.length > 0 && (
        <div className="text-muted-foreground border-t py-4 text-center text-sm">
          {displayAssets.length} media {displayAssets.length === 1 ? "item" : "items"}
        </div>
      )}
    </div>
  );
}
