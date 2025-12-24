import type { Product } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckSquare, Download, Edit3, Square, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ProductBulkOperationsProps {
  products: Product[];
  selectedProductIds: number[];
  onSelectionChange: (productIds: number[]) => void;
  onBulkActionComplete?: () => void;
}

export function ProductBulkOperations({
  products,
  selectedProductIds,
  onSelectionChange,
  onBulkActionComplete,
}: ProductBulkOperationsProps) {
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Inline helper to eliminate duplicate cache invalidation logic
  // Note: Kept inline per requirements - duplicates logic from ProductCreateEditModal/ProductCard for future consolidation
  const invalidateProductCaches = () => {
    // Invalidate all product-related queries for complete synchronization
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({
      queryKey: ["/api/admin/products/initial-data"],
    });

    // Invalidate product-complete caches for individual product pages
    // For bulk operations, we invalidate all product-complete queries since multiple products may be affected
    queryClient.invalidateQueries({ queryKey: ["product-complete"] });

    // Invalidate hierarchical product queries
    queryClient.invalidateQueries({ queryKey: ["/api/products/by-path"] });
    queryClient.invalidateQueries({ queryKey: ["/api/product-complete"] });
  };

  // Phase 3: Advanced Features - Bulk Operations System
  const bulkOperationMutation = useMutation({
    mutationFn: async ({
      action,
      productIds,
      data,
    }: {
      action: string;
      productIds: number[];
      data?: Record<string, unknown>;
    }) => {
      setIsLoading(true);

      const operations = productIds.map((id) => {
        switch (action) {
          case "delete":
            return fetch(`/api/products/${id}`, { method: "DELETE" });
          case "activate":
            return fetch(`/api/products/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ isActive: true, ...(data || {}) }),
              headers: { "Content-Type": "application/json" },
            });
          case "deactivate":
            return fetch(`/api/products/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ isActive: false, ...(data || {}) }),
              headers: { "Content-Type": "application/json" },
            });
          case "feature":
            return fetch(`/api/products/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ isFeatured: true, ...(data || {}) }),
              headers: { "Content-Type": "application/json" },
            });
          case "unfeature":
            return fetch(`/api/products/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ isFeatured: false, ...(data || {}) }),
              headers: { "Content-Type": "application/json" },
            });
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      });

      return Promise.all(operations);
    },
    onSuccess: (_results, variables) => {
      invalidateProductCaches();

      toast({
        title: "Success",
        description: `Bulk ${variables.action} completed for ${variables.productIds.length} products`,
      });
      onSelectionChange([]);
      setBulkAction("");
      onBulkActionComplete?.();
    },
    onError: (error: Error | unknown, variables) => {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to perform bulk ${variables.action}`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map((p) => p.id));
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedProductIds.length === 0) return;

    // Show confirmation dialog for destructive actions
    if (bulkAction === "delete" || bulkAction === "deactivate") {
      setConfirmAction(bulkAction);
      setShowConfirmDialog(true);
    } else {
      executeBulkAction(bulkAction);
    }
  };

  const executeBulkAction = (action: string) => {
    bulkOperationMutation.mutate({
      action: action,
      productIds: selectedProductIds,
    });
    setShowConfirmDialog(false);
    setConfirmAction("");
  };

  const getConfirmationMessage = () => {
    const count = selectedProductIds.length;
    if (confirmAction === "delete") {
      return {
        title: "Delete Products",
        description: `Are you sure you want to permanently delete ${count} product${count > 1 ? "s" : ""}? This action cannot be undone.`,
        actionText: "Delete",
        variant: "destructive" as const,
      };
    } else if (confirmAction === "deactivate") {
      return {
        title: "Deactivate Products",
        description: `Are you sure you want to deactivate ${count} product${count > 1 ? "s" : ""}? They will no longer be visible to customers.`,
        actionText: "Deactivate",
        variant: "default" as const,
      };
    }
    return {
      title: "",
      description: "",
      actionText: "",
      variant: "default" as const,
    };
  };

  const exportProducts = () => {
    const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));
    const exportData = {
      exportDate: new Date().toISOString(),
      products: selectedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        shortDescription: product.shortDescription,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        categoryId: product.categoryId,
        fabricId: product.fabricId,
        tags: product.tags,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${selectedProducts.length} products`,
    });
  };

  const selectedCount = selectedProductIds.length;
  const allSelected = selectedCount === products.length && products.length > 0;

  return (
    <div className="mb-6 rounded-lg border bg-white p-4">
      <div className="flex flex-col space-y-4">
        {/* Phase 3: Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              data-testid="select-all-products-button"
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-gray-600 text-sm hover:text-gray-900"
            >
              {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              <span>
                {selectedCount > 0
                  ? `${selectedCount} of ${products.length} selected`
                  : `Select all ${products.length} products`}
              </span>
            </button>

            {selectedCount > 0 && <Badge variant="secondary">{selectedCount} selected</Badge>}
          </div>

          {selectedCount > 0 && (
            <Button
              data-testid="clear-selection-button"
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              Clear Selection
            </Button>
          )}
        </div>

        {/* Phase 3: Bulk Actions */}
        {selectedCount > 0 && (
          <div className="flex items-center space-x-3 border-t pt-2">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger data-testid="bulk-action-select" className="w-48">
                <SelectValue placeholder="Choose bulk action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem data-testid="bulk-action-activate" value="activate">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="h-4 w-4" />
                    <span>Activate Products</span>
                  </div>
                </SelectItem>
                <SelectItem data-testid="bulk-action-deactivate" value="deactivate">
                  <div className="flex items-center space-x-2">
                    <Archive className="h-4 w-4" />
                    <span>Deactivate Products</span>
                  </div>
                </SelectItem>
                <SelectItem data-testid="bulk-action-feature" value="feature">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4" />
                    <span>Mark as Featured</span>
                  </div>
                </SelectItem>
                <SelectItem data-testid="bulk-action-unfeature" value="unfeature">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 opacity-50" />
                    <span>Remove Featured</span>
                  </div>
                </SelectItem>
                <SelectItem data-testid="bulk-action-delete" value="delete">
                  <div className="flex items-center space-x-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    <span className="text-red-500">Delete Products</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              data-testid="apply-bulk-action-button"
              onClick={handleBulkAction}
              disabled={!bulkAction || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              {isLoading ? "Processing..." : "Apply Action"}
            </Button>

            <Button
              data-testid="export-selected-button"
              variant="outline"
              onClick={exportProducts}
              disabled={selectedCount === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={() => executeBulkAction(confirmAction)}
        title={getConfirmationMessage().title}
        description={getConfirmationMessage().description}
        confirmText={getConfirmationMessage().actionText}
        showTrigger={false}
        variant={confirmAction === "delete" ? "destructive" : "default"}
      />
    </div>
  );
}
