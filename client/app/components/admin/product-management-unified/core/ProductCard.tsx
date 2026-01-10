import type { Category, Fabric, MediaAsset, Product } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Edit,
  Eye,
  Image as ImageIcon,
  Layers,
  MoreHorizontal,
  Package,
  Tag,
  Trash2,
  Video,
} from "lucide-react";
import { memo, useState } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UnifiedModelViewer from "@/components/ui/UnifiedModelViewer";
import { useToast } from "@/hooks/use-toast";
import { RelationshipIndicators } from "./RelationshipIndicators";

interface ProductCardProps {
  product: Product;
  category?: Category;
  fabric?: Fabric;
  getMediaAsset: (id: number) => MediaAsset | undefined;
  viewMode: "grid" | "list";
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Memoized ProductCard component - only re-renders when props actually change
export const ProductCard = memo(function ProductCard({
  product,
  category,
  fabric,
  getMediaAsset,
  viewMode,
  onSelect,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [show3DPreview, setShow3DPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Inline helper to eliminate duplicate cache invalidation logic
  // Note: Kept inline per requirements - duplicates logic from ProductCreateEditModal for future consolidation
  const invalidateProductCaches = () => {
    // Invalidate all product-related queries for complete synchronization
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({
      queryKey: ["/api/admin/products/initial-data"],
    });

    // Invalidate product-complete caches for individual product pages
    if (product.urlPath) {
      queryClient.invalidateQueries({
        queryKey: ["product-complete", product.urlPath],
      });
    }
    if (product.slug) {
      queryClient.invalidateQueries({
        queryKey: ["product-complete", product.slug],
      });
    }

    // Invalidate hierarchical product queries
    queryClient.invalidateQueries({ queryKey: ["/api/products/by-path"] });
    queryClient.invalidateQueries({ queryKey: ["/api/product-complete"] });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete product");
      return response;
    },
    onSuccess: () => {
      invalidateProductCaches();

      toast({
        title: "Product Deleted",
        description: `${product.name} has been deleted successfully.`,
      });
      onDelete?.();
    },
    onError: (error: Error | unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete product";
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  // Get primary media
  const primaryImage = product.primaryImageId
    ? getMediaAsset(product.primaryImageId)
    : product.imageIds && product.imageIds.length > 0 && product.imageIds[0] !== undefined
      ? getMediaAsset(product.imageIds[0])
      : null;

  const primaryVideo = product.primaryVideoId ? getMediaAsset(product.primaryVideoId) : null;

  const model3D = product.modelFileId ? getMediaAsset(product.modelFileId) : undefined;

  // Calculate relationship counts
  const relationshipCounts = {
    images: product.imageIds?.length || 0,
    videos: product.primaryVideoId ? 1 : 0,
    accessories: product.accessoryIds?.length || 0,
    certificates: product.certificateIds?.length || 0,
    relatedProducts: product.relatedProductIds?.length || 0,
  };

  if (viewMode === "list") {
    return (
      <>
        <Card
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            isHovered ? "border-blue-300 shadow-lg" : ""
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onSelect}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Media Preview */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {show3DPreview && model3D ? (
                  <UnifiedModelViewer
                    asset={model3D}
                    className="h-full w-full"
                    config={{
                      autoRotate: true,
                      cameraControls: true,
                      loading: "eager",
                    }}
                    showControls={false}
                    showLoadingProgress={false}
                    showFileInfo={false}
                  />
                ) : primaryImage ? (
                  <img
                    src={`/api/media/${primaryImage.id}/content`}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground/70" />
                )}
                {/* 3D Model Toggle for List View */}
                {model3D && (
                  <Button
                    data-testid={`toggle-3d-model-list-${product.id}`}
                    size="sm"
                    variant="ghost"
                    className="absolute top-0 right-0 h-6 w-6 bg-white/90 p-0 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShow3DPreview(!show3DPreview);
                    }}
                    title={show3DPreview ? "Show Image" : "Show 3D Model"}
                  >
                    {show3DPreview ? (
                      <ImageIcon className="h-3 w-3" />
                    ) : (
                      <Box className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>

              {/* Product Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="truncate font-semibold text-foreground">{product.name}</h3>
                    <p className="text-muted-foreground text-sm">SKU: {product.sku}</p>
                    {category && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {category.name}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={product.isActive ? "default" : "secondary"}
                      className={
                        product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          data-testid={`product-actions-menu-${product.id}`}
                          variant="ghost"
                          size="sm"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          data-testid={`view-product-${product.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.();
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          data-testid={`edit-product-${product.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.();
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Product
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          data-testid={`delete-product-${product.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Relationship Indicators */}
              <RelationshipIndicators
                counts={relationshipCounts}
                hasCategory={!!category}
                hasFabric={!!fabric}
                has3DModel={!!model3D}
                compact={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={confirmDelete}
          title="Delete Product"
          description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
          showTrigger={false}
        />
      </>
    );
  }

  // Grid View
  return (
    <>
      <Card
        className={`relative cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg ${
          isHovered ? "scale-[1.02] border-blue-300 shadow-xl" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onSelect}
      >
        {/* Media Display */}
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          {show3DPreview && model3D ? (
            <UnifiedModelViewer
              asset={model3D}
              className="h-full w-full"
              config={{
                autoRotate: true,
                cameraControls: true,
                loading: "eager",
              }}
              showControls={true}
              showLoadingProgress={true}
              showFileInfo={false}
              onError={(_error) => {
                setShow3DPreview(false); // Fallback to image on error
              }}
            />
          ) : primaryImage ? (
            <img
              src={`/api/media/${primaryImage.id}/content`}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/600x400?text=No+Image";
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground/70" />
            </div>
          )}

          {/* Media Type Indicators */}
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            {primaryVideo && (
              <Badge className="bg-black/70 text-white text-xs">
                <Video className="mr-1 h-3 w-3" />
                Video
              </Badge>
            )}
            {model3D && (
              <Badge
                data-testid={`toggle-3d-model-${product.id}`}
                className={`cursor-pointer text-xs transition-all ${
                  show3DPreview
                    ? "bg-purple-600/90 text-white"
                    : "bg-purple-500/90 text-white hover:bg-purple-600/90"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShow3DPreview(!show3DPreview);
                }}
                title={show3DPreview ? "Show Image" : "Show 3D Model"}
              >
                <Box className="mr-1 h-3 w-3" />
                {show3DPreview ? "3D Active" : "3D"}
              </Badge>
            )}
          </div>

          {/* Status Badge */}
          <div className="absolute top-1.5 left-1.5">
            <Badge
              variant={product.isActive ? "default" : "secondary"}
              className={`text-xs ${
                product.isActive ? "bg-green-500/90 text-white" : "bg-muted/50/90 text-white"
              }`}
            >
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Hover Actions */}
          {isHovered && (
            <div className="center-flex absolute inset-0 bg-black/20">
              <div className="flex gap-2">
                <Button
                  data-testid={`view-product-grid-${product.id}`}
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.();
                  }}
                  className="bg-white/90 hover:bg-white"
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Button>
                <Button
                  data-testid={`edit-product-grid-${product.id}`}
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  className="bg-white/90 hover:bg-white"
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  data-testid={`delete-product-grid-${product.id}`}
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="bg-red-600/90 hover:bg-red-600"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>

        <CardHeader className="px-4 pt-3 pb-1.5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-foreground text-sm">{product.name}</h3>
              <p className="text-muted-foreground text-xs">SKU: {product.sku}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pt-0 pb-3">
          <div className="space-y-2">
            {/* Category & Fabric */}
            <div className="flex flex-wrap gap-1">
              {category && (
                <Badge variant="outline" className="text-xs">
                  <Tag className="mr-1 h-3 w-3" />
                  {category.name}
                </Badge>
              )}
              {fabric && (
                <Badge variant="outline" className="border-purple-200 text-purple-700 text-xs">
                  <Layers className="mr-1 h-3 w-3" />
                  {fabric.name}
                </Badge>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="line-clamp-2 text-muted-foreground text-xs">{product.description}</p>
            )}

            {/* Relationship Summary */}
            <RelationshipIndicators
              counts={relationshipCounts}
              hasCategory={!!category}
              hasFabric={!!fabric}
              has3DModel={!!model3D}
              compact={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        showTrigger={false}
      />
    </>
  );
});
