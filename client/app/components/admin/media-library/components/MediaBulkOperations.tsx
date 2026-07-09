import { useMutation } from "@tanstack/react-query";
import { Archive, Download, MoreHorizontal, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { invalidateMediaQueries } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { useMediaLibrary } from "../MediaLibraryContextEnhanced";

export const MediaBulkOperations = React.memo(() => {
  const { state, clearSelection } = useMediaLibrary();

  const selectedCount = state.selectedAssets.size;
  const hasSelection = selectedCount > 0;

  const bulkDeleteMutation = useMutation({
    mutationKey: ["media", "bulk-delete"],
    mutationFn: (ids: number[]) => {
      return apiRequest("/api/media/batch", {
        method: "POST",
        body: JSON.stringify({ operation: "delete", ids }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onMutate: async (deletedIds) => {
      await getQueryClient().cancelQueries({ queryKey: ["/api/media"] });
      const previousData = getQueryClient().getQueryData(["/api/media"]);

      getQueryClient().setQueriesData(
        { predicate: (query) => query.queryKey[0] === "/api/media" },
        (oldData: unknown) => {
          const dataRecord = oldData as Record<string, unknown>;
          if (!dataRecord?.data || !Array.isArray(dataRecord.data)) {
            return oldData;
          }

          const filteredData = dataRecord.data.filter(
            (item: unknown) =>
              typeof item === "object" &&
              item !== null &&
              "id" in item &&
              !deletedIds.includes(item.id as number),
          );

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
      clearSelection();
      toast.success("Bulk delete successful", {
        description: `${deletedIds.length} items deleted successfully`,
      });
    },
    onError: (_err, _deletedIds, context) => {
      if (context?.previousData) {
        getQueryClient().setQueryData(["/api/media"], context.previousData);
      }
      toast.error("Bulk delete failed", {
        description: _err instanceof Error ? _err.message : String(_err),
      });
    },
    onSettled: async () => {
      const pendingMutations = getQueryClient().isMutating({ mutationKey: ["media"] });
      if (pendingMutations === 1) {
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

      toast.success("Download started", {
        description: `Downloading ${selectedCount} items as ZIP`,
      });
    },
    onError: (error) => {
      toast.error("Download failed", {
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const handleBulkDownload = () => {
    if (!hasSelection) return;
    const ids = Array.from(state.selectedAssets);
    bulkDownloadMutation.mutate(ids);
  };

  const handleBulkDelete = () => {
    if (!hasSelection) return;
    const ids = Array.from(state.selectedAssets);
    bulkDeleteMutation.mutate(ids);
  };

  if (!hasSelection) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className="status-badge-base bg-white/10 text-white border-white/20"
      >
        {selectedCount} selected
      </Badge>

      <Button
        onClick={handleBulkDownload}
        variant="outline"
        size="sm"
        className="action-button-sidebar border-white/10 bg-white/5 text-admin-foreground hover:bg-white/10 hover:text-white transition-colors"
      >
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 bg-white/5 text-admin-foreground hover:bg-white/10 hover:text-white transition-colors"
          >
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
