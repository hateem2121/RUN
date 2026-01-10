import { useMutation } from "@tanstack/react-query";
// Removed unused Progress import
// import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { ChevronLeft, ChevronRight, Download, Edit, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
// import type { MediaAsset } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { invalidateMediaQueries } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { useMediaLibraryEnhanced } from "./MediaLibraryContextEnhanced";

// PHASE 1: Progressive Loading Integration
declare global {
  interface Window {
    needleProgressiveLoaded?: boolean | undefined;
  }
}

// PHASE 3: Web Vitals Integration
// PHASE 3: Web Vitals Integration
// import { onCLS, onFCP, onLCP } from "web-vitals";

// STEP 3 INTEGRATION: Use UnifiedModelViewer instead of manual model-viewer setup
// CHUNK 6: Use lazy-loaded 3D viewer to reduce initial bundle by ~1MB
// import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { UnifiedMediaTheater } from "@/components/products/UnifiedMediaTheater";

// PHASE 3 FIX: Global ImageBitmapLoader error handler to prevent unhandled promise rejections
if (typeof window !== "undefined") {
  // Add global handler for ImageBitmapLoader errors specifically
  const handleImageBitmapError = (event: PromiseRejectionEvent) => {
    const message = event.reason?.message || event.reason?.toString() || "";

    // Check if this is an ImageBitmapLoader error
    if (
      message.includes("ImageBitmapLoader") ||
      message.includes("Failed to fetch") ||
      event.reason?.stack?.includes("ImageBitmapLoader")
    ) {
      // Handle ImageBitmapLoader errors gracefully
      if (process.env.NODE_ENV === "development") {
      }

      // Prevent unhandled promise rejection
      event.preventDefault();
      return true;
    }

    return false; // Let other errors propagate normally
  };

  // Install global handler
  window.addEventListener("unhandledrejection", handleImageBitmapError);
}

// PHASE 1-3: Enhanced Loading States for Large 3D Models
// PHASE 1-3: Enhanced Loading States for Large 3D Models
// interface LoadingState {
//   status:
//   | "idle"
//   | "initializing"
//   | "progressive"
//   | "loading"
//   | "loaded"
//   | "error";
//   progress: number;
//   estimatedTimeRemaining: number;
//   startTime: number;
//   bytesLoaded?: number | undefined;
//   totalBytes?: number | undefined;
//   loadingStrategy: "standard" | "progressive" | "chunked";
//   performanceMetrics?: {
//     fcp?: number | undefined;
//     lcp?: number | undefined;
//     cls?: number | undefined;
//   };
// }

// Phase 1: Enhanced Media Viewing with Loading States
export default function MediaViewerModal() {
  const {
    state,
    setLightboxOpen,
    setEditModalOpen,
    setDeleteModalOpen,
    setSelectedAsset,
    setSelectedAssetIndex,
  } = useMediaLibraryEnhanced();

  const { selectedAsset, lightboxOpen, editModalOpen, deleteModalOpen } = state;
  const { toast } = useToast();

  // PHASE 1B FIX: Single asset delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (assetId: number) => {
      return await apiRequest(`/api/media/${assetId}`, { method: "DELETE" });
    },
    retry: 2, // PHASE 3: Retry failed delete operations up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

    // TRUE OPTIMISTIC DELETE: Remove item immediately before API call
    onMutate: async (assetId: number) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await getQueryClient().cancelQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "apimedia",
      });

      // Snapshot the previous value for rollback
      const previousData = getQueryClient().getQueriesData({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "apimedia",
      });

      // Optimistically remove from all list caches
      getQueryClient().setQueriesData(
        {
          predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === "apimedia",
        },
        (oldData: unknown) => {
          // Handle different data shapes robustly
          if (!oldData) return oldData;

          // Handle direct array response
          if (Array.isArray(oldData)) {
            return oldData.filter(
              (item: unknown) =>
                typeof item === "object" && item !== null && "id" in item && item.id !== assetId,
            );
          }

          // Handle envelope response with data.data
          const dataRecord = oldData as Record<string, unknown>;
          if (dataRecord.data && typeof dataRecord.data === "object" && dataRecord.data !== null) {
            const nestedData = dataRecord.data as Record<string, unknown>;
            if (nestedData.data && Array.isArray(nestedData.data)) {
              const filteredData = nestedData.data.filter(
                (item: unknown) =>
                  typeof item === "object" && item !== null && "id" in item && item.id !== assetId,
              );
              let paginationUpdate = {};
              if (nestedData.pagination && typeof nestedData.pagination === "object") {
                const paginationData = nestedData.pagination as Record<string, unknown>;
                paginationUpdate = {
                  pagination: {
                    ...paginationData,
                    total: Math.max(
                      0,
                      (typeof paginationData.total === "number" ? paginationData.total : 0) - 1,
                    ),
                  },
                };
              }

              return {
                ...oldData,
                data: {
                  ...nestedData,
                  data: filteredData,
                  ...paginationUpdate,
                },
              };
            }
          }

          // Handle envelope response with direct data array
          const oldDataRecord = oldData as Record<string, unknown>;
          if (oldDataRecord.data && Array.isArray(oldDataRecord.data)) {
            return {
              ...oldDataRecord,
              data: oldDataRecord.data.filter(
                (item: unknown) =>
                  typeof item === "object" && item !== null && "id" in item && item.id !== assetId,
              ),
            };
          }

          return oldData;
        },
      );

      return { previousData };
    },

    onSuccess: () => {
      toast({
        title: "Asset deleted",
        description: "The media asset has been permanently removed",
      });

      // Close all modals and clear selection
      setDeleteModalOpen(false);
      setLightboxOpen(false);
      setSelectedAsset(null);
    },

    onError: (error, _assetId, context) => {
      // Rollback optimistic updates
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          getQueryClient().setQueryData(queryKey, data);
        });
      }

      toast({
        title: "Delete failed",
        description: error.message || "An error occurred while deleting the asset",
        variant: "destructive",
      });
    },

    // Always invalidate to ensure data freshness after success or failure
    onSettled: async () => {
      await invalidateMediaQueries(getQueryClient());
    },
  });

  // PHASE 2: Asset edit functionality with cache invalidation
  const [editForm, setEditForm] = useState({ name: "", tags: "" });

  // Initialize edit form when modal opens
  useEffect(() => {
    if (editModalOpen && selectedAsset) {
      setEditForm({
        name: selectedAsset.originalName || "",
        tags: selectedAsset.tags?.join(", ") || "",
      });
    }
  }, [editModalOpen, selectedAsset]);

  const editMutation = useMutation({
    mutationFn: async ({
      assetId,
      updates,
    }: {
      assetId: number;
      updates: { name: string; tags: string[] };
    }) => {
      return await apiRequest(`/api/media/${assetId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    retry: 3, // PHASE 3: Retry failed edit operations up to 3 times
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 10000), // Faster backoff for edits

    // TRUE OPTIMISTIC UPDATE: Apply changes immediately before API call
    onMutate: async ({ assetId, updates }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await getQueryClient().cancelQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "apimedia",
      });

      // Snapshot the previous values for rollback (CRITICAL FIX: Include selectedAsset)
      const previousData = getQueryClient().getQueriesData({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "apimedia",
      });
      const prevSelectedAsset = selectedAsset; // Snapshot BEFORE optimistic update

      // Optimistically update selected asset
      if (selectedAsset?.id === assetId) {
        setSelectedAsset({
          ...selectedAsset,
          originalName: updates.name,
          tags: updates.tags,
        });
      }

      // Optimistically update all list caches
      getQueryClient().setQueriesData(
        {
          predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === "apimedia",
        },
        (oldData: unknown) => {
          // Handle different data shapes robustly
          if (!oldData) return oldData;

          // Handle direct array response
          if (Array.isArray(oldData)) {
            return oldData.map((item: unknown) =>
              typeof item === "object" && item !== null && "id" in item && item.id === assetId
                ? {
                    ...(item as object),
                    originalName: updates.name,
                    tags: updates.tags,
                  }
                : item,
            );
          }

          // Handle envelope response with data.data
          const dataRecord = oldData as Record<string, unknown>;
          if (dataRecord.data && typeof dataRecord.data === "object" && dataRecord.data !== null) {
            const nestedData = dataRecord.data as Record<string, unknown>;
            if (nestedData.data && Array.isArray(nestedData.data)) {
              return {
                ...dataRecord,
                data: {
                  ...nestedData,
                  data: nestedData.data.map((item: unknown) =>
                    typeof item === "object" && item !== null && "id" in item && item.id === assetId
                      ? {
                          ...(item as object),
                          originalName: updates.name,
                          tags: updates.tags,
                        }
                      : item,
                  ),
                },
              };
            }
          }

          // Handle envelope response with direct data array
          const oldDataRecord = oldData as Record<string, unknown>;
          if (oldDataRecord.data && Array.isArray(oldDataRecord.data)) {
            return {
              ...oldDataRecord,
              data: oldDataRecord.data.map((item: unknown) =>
                typeof item === "object" && item !== null && "id" in item && item.id === assetId
                  ? {
                      ...(item as object),
                      originalName: updates.name,
                      tags: updates.tags,
                    }
                  : item,
              ),
            };
          }

          return oldData;
        },
      );

      return { previousData, prevSelectedAsset };
    },

    onSuccess: async () => {
      toast({
        title: "Asset updated",
        description: "Media asset has been updated successfully",
      });
      setEditModalOpen(false);
    },

    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          getQueryClient().setQueryData(queryKey, data);
        });
      }

      // CRITICAL FIX: Restore selected asset from snapshot, not current state
      if (context?.prevSelectedAsset && selectedAsset?.id === variables.assetId) {
        setSelectedAsset(context.prevSelectedAsset);
      }

      toast({
        title: "Update failed",
        description: error.message || "An error occurred while updating the asset",
        variant: "destructive",
      });
    },

    // Always invalidate to ensure data freshness after success or failure
    onSettled: async () => {
      await invalidateMediaQueries(getQueryClient());
    },
  });

  const handleSaveEdit = () => {
    if (!selectedAsset?.id) return;

    const tagsArray = editForm.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    editMutation.mutate({
      assetId: selectedAsset.id,
      updates: {
        name: editForm.name.trim(),
        tags: tagsArray,
      },
    });
  };

  // PHASE 1B FIX: Actual delete handler that calls the API
  const handleConfirmDelete = () => {
    if (selectedAsset?.id) {
      deleteMutation.mutate(selectedAsset.id);
    }
  };

  // PHASE 1-3: Enhanced Loading State Management
  // const [loadingState, setLoadingState] = useState<LoadingState>({
  //   status: "idle",
  //   progress: 0,
  //   estimatedTimeRemaining: 0,
  //   startTime: 0,
  //   loadingStrategy: "standard",
  //   performanceMetrics: {},
  // });

  // STEP 3 INTEGRATION: Simplified state management using UnifiedModelViewer
  // STEP 3 INTEGRATION: UnifiedModelViewer handles retry mechanisms internally

  const handleClose = () => {
    setLightboxOpen(false);
    setSelectedAsset(null);
    setSelectedAssetIndex(0);
  };

  const handleEdit = () => {
    setEditModalOpen(true);
    setLightboxOpen(false);
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
    setLightboxOpen(false);
  };

  const handleDownload = async () => {
    if (!selectedAsset) return;

    try {
      const response = await fetch(`/api/media/${selectedAsset.id}/download`);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = selectedAsset.originalName || `media_${selectedAsset.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (_error) {}
  };

  const handlePrevious = () => {
    // Navigation logic would be implemented here
  };

  const handleNext = () => {
    // Navigation logic would be implemented here
  };

  return (
    <>
      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="z-modal flex flex-col" contentType="media-library">
          <DialogHeader className="shrink-0 border-b pb-4">
            <DialogTitle>Media Viewer</DialogTitle>
            <DialogDescription>View and manage your media assets</DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 overflow-hidden pt-4">
            {/* Media display */}
            <div className="mr-4 flex max-h-full max-w-[calc(100%-17rem)] flex-1 items-center justify-center rounded-lg bg-muted/20">
              {selectedAsset && (
                <div className="flex h-full w-full items-center justify-center">
                  <UnifiedMediaTheater
                    media={[selectedAsset]}
                    productName={selectedAsset.originalName || "Media Asset"}
                    viewMode="theater"
                    className="h-full w-full"
                    onMediaLoad={() => {
                      // Optional: Track load performance
                    }}
                  />
                </div>
              )}
            </div>

            {/* Actions sidebar - FIXED: Add proper scrolling */}
            <div className="flex w-64 shrink-0 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="w-full justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="w-full justify-start"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="w-full justify-start text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>

                {/* Asset info */}
                {selectedAsset && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>
                      <p className="text-muted-foreground">{selectedAsset.originalName}</p>
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>
                      <p className="text-muted-foreground">{selectedAsset.type}</p>
                    </div>
                    <div>
                      <span className="font-medium">Size:</span>
                      <p className="text-muted-foreground">
                        {selectedAsset.size} bytes
                        {selectedAsset.type === "model" && (
                          <span className="mt-1 block text-xs">{/* Size info simplified */}</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Upload Date:</span>
                      <p className="text-muted-foreground">
                        {new Date(selectedAsset.uploadedAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal (placeholder) */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Edit asset properties and metadata</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assetName">Name</Label>
              <Input
                id="assetName"
                data-testid="input-asset-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Asset name"
                disabled={editMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetTags">Tags</Label>
              <Input
                id="assetTags"
                data-testid="input-asset-tags"
                value={editForm.tags}
                onChange={(e) => setEditForm((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
                disabled={editMutation.isPending}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={editMutation.isPending}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editMutation.isPending || !editForm.name.trim()}
              data-testid="button-save-edit"
            >
              {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal (placeholder) */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
