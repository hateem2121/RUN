import type { Category, Fabric, MediaAsset, Product } from "@shared/index";
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
import { GlassCard } from "@/components/admin/shared/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
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
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
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
        <GlassCard
          className={`group cursor-pointer transition-all duration-200 border border-white/5 bg-white/[0.04] hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 hover:bg-white/[0.06]`}
          onClick={onSelect}
        >
          <div className="p-4">
            <div className="flex items-center gap-4">
              {/* Media Preview */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black/40 border border-white/10 relative">
                {show3DPreview && model3D ? (
                  <LazyUnifiedModelViewer
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
                  <Package className="h-8 w-8 text-[#68869A]/70" />
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
                    <h3 className="truncate font-bold text-white tracking-tight">{product.name}</h3>
                    <p className="text-[#68869A] text-sm tracking-wider">SKU: {product.sku}</p>
                    {category && (
                      <Badge
                        variant="outline"
                        className="mt-1 text-[10px] bg-white/5 border-white/10 text-[#E3DFD6] tracking-wider uppercase"
                      >
                        {category.name}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        product.isActive
                          ? "bg-green-500/10 border-green-500/30 text-green-400 font-bold uppercase tracking-wider text-[10px]"
                          : "bg-white/5 border-white/10 text-[#68869A] font-bold uppercase tracking-wider text-[10px]"
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
                          className="h-8 w-8 p-0 text-[#68869A] hover:bg-white/10 hover:text-white rounded-lg"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#0A0A0A] border-white/10 text-white rounded-xl"
                      >
                        <DropdownMenuItem
                          data-testid={`view-product-${product.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.();
                          }}
                          className="focus:bg-white/10 cursor-pointer rounded-lg"
                        >
                          <Eye className="mr-2 h-4 w-4 text-[#68869A]" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          data-testid={`edit-product-${product.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.();
                          }}
                          className="focus:bg-white/10 cursor-pointer rounded-lg"
                        >
                          <Edit className="mr-2 h-4 w-4 text-[#68869A]" />
                          Edit Product
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          data-testid={`delete-product-${product.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                          }}
                          className="focus:bg-red-500/10 text-red-500 focus:text-red-400 cursor-pointer rounded-lg"
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
          </div>
        </GlassCard>

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
      <GlassCard
        className="group relative cursor-pointer overflow-hidden transition-all duration-300 border-white/5 bg-white/[0.04] hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:bg-white/[0.08]"
        onClick={onSelect}
      >
        {/* Media Display */}
        <div className="relative aspect-auto h-48 overflow-hidden bg-black/40 border-b border-white/5">
          {show3DPreview && model3D ? (
            <LazyUnifiedModelViewer
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
              <Package className="h-12 w-12 text-[#68869A]/30" />
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
          <div className="absolute top-2 left-2">
            <Badge
              variant="outline"
              className={`text-[10px] font-bold uppercase tracking-wider ${
                product.isActive
                  ? "bg-green-500/20 border-green-500/30 text-green-400"
                  : "bg-black/60 border-white/10 text-[#68869A]"
              }`}
            >
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                data-testid={`view-product-grid-${product.id}`}
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.();
                }}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-xl h-10 w-10 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                data-testid={`edit-product-grid-${product.id}`}
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-xl h-10 w-10 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                data-testid={`delete-product-grid-${product.id}`}
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300 rounded-xl h-10 w-10 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-bold text-white text-base tracking-tight">
                {product.name}
              </h3>
              <p className="text-[#68869A] text-xs font-mono mt-1 opacity-70">SKU: {product.sku}</p>
            </div>
          </div>
        </div>

        <div className="px-5 pt-0 pb-5">
          <div className="space-y-3">
            {/* Category & Fabric */}
            <div className="flex flex-wrap gap-2 mt-2">
              {category && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-white/5 border-white/10 text-[#E3DFD6] tracking-wider uppercase"
                >
                  <Tag className="mr-1.5 h-3 w-3 text-[#68869A]" />
                  {category.name}
                </Badge>
              )}
              {fabric && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-blue-500/10 border-blue-500/20 text-blue-400 tracking-wider uppercase"
                >
                  <Layers className="mr-1.5 h-3 w-3 text-blue-500" />
                  {fabric.name}
                </Badge>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="line-clamp-2 text-[#68869A] text-xs leading-relaxed mt-2">
                {product.description}
              </p>
            )}

            <div className="pt-2">
              <RelationshipIndicators
                counts={relationshipCounts}
                hasCategory={!!category}
                hasFabric={!!fabric}
                has3DModel={!!model3D}
                compact={false}
              />
            </div>
          </div>
        </div>
      </GlassCard>

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
