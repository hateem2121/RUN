import type { Category, Fabric, MediaAsset, Product } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Box,
  Edit,
  Image as ImageIcon,
  Layers,
  Link as LinkIcon,
  Package,
  Tag,
  Users,
  Video,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/admin/shared/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// STEP 3 INTEGRATION: Import UnifiedModelViewer to replace manual model-viewer
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { Separator } from "@/components/ui/separator";

interface ProductDetailsPanelProps {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
}

export function ProductDetailsPanel({ product, onClose, onEdit }: ProductDetailsPanelProps) {
  // Fetch related data using same cache keys as admin interface
  const { data: initialData } = useQuery<{
    categories: Category[];
    fabrics: Fabric[];
    mediaAssets: MediaAsset[];
    products: Product[];
  }>({
    queryKey: ["/api/admin/products/initial-data"],
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Use data from admin cache for consistency
  const categories: Category[] = initialData?.categories || [];
  const fabrics: Fabric[] = initialData?.fabrics || [];
  const mediaAssets: MediaAsset[] = initialData?.mediaAssets || [];

  // Helper functions
  const getCategory = () => categories.find((c) => c.id === product.categoryId);
  const getFabric = () => fabrics.find((f) => f.id === product.fabricId);
  const getMediaAsset = (id: number) => mediaAssets.find((m) => m.id === id);

  const category = getCategory();
  const fabric = getFabric();

  // Get media assets
  const primaryImage = product.primaryImageId
    ? getMediaAsset(product.primaryImageId)
    : product.imageIds && product.imageIds.length > 0 && product.imageIds[0] !== undefined
      ? getMediaAsset(product.imageIds[0])
      : null;

  const allImages = Array.isArray(product.imageIds)
    ? (product.imageIds as unknown as number[])
        .map((id: number) => getMediaAsset(id))
        .filter(Boolean)
    : [];
  const allVideos = Array.isArray(product.videos)
    ? (product.videos as unknown as number[]).map((id: number) => getMediaAsset(id)).filter(Boolean)
    : [];
  const model3D = product.modelFileId ? getMediaAsset(product.modelFileId) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-white">Product Details</h2>
        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            size="sm"
            className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 hover:text-blue-300"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-admin-muted hover:text-white hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Primary Image */}
      {primaryImage && (
        <GlassCard>
          <div className="p-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-white/[0.03] border border-white/5">
              <img
                src={
                  primaryImage.id && primaryImage.id < 1000000000000
                    ? `/api/media/${primaryImage.id}/content`
                    : undefined
                }
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Basic Information */}
      <GlassCard>
        <div className="px-5 pt-4 pb-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Package className="h-5 w-5 text-blue-400" />
            Basic Information
          </h3>
        </div>
        <div className="px-5 pb-5 space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-white">{product.name}</h3>
            <p className="text-admin-muted text-sm">SKU: {product.sku}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={product.isActive ? "default" : "secondary"}
              className={
                product.isActive
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/5 text-admin-muted border border-white/10"
              }
            >
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
            {product.isFeatured && (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Featured
              </Badge>
            )}
          </div>

          {product.description && (
            <div>
              <h4 className="mb-2 font-medium text-admin-foreground text-sm">Description</h4>
              <p className="text-admin-muted text-sm">{product.description}</p>
            </div>
          )}

          {product.shortDescription && (
            <div>
              <h4 className="mb-2 font-medium text-admin-foreground text-sm">Short Description</h4>
              <p className="text-admin-muted text-sm">{product.shortDescription}</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Relationships */}
      <GlassCard>
        <div className="px-5 pt-4 pb-1">
          <h3 className="text-sm font-semibold text-white">Relationships</h3>
        </div>
        <div className="px-5 pb-5 space-y-3">
          {category && (
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-emerald-400" />
              <div>
                <span className="font-medium text-admin-foreground">Category:</span>
                <span className="ml-2 text-admin-muted">{category.name}</span>
              </div>
            </div>
          )}

          {fabric && (
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-purple-400" />
              <div>
                <span className="font-medium text-admin-foreground">Fabric:</span>
                <span className="ml-2 text-admin-muted">{fabric.name}</span>
              </div>
            </div>
          )}

          <Separator className="bg-white/5" />

          {/* Media Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-blue-400" />
              <span className="text-admin-foreground">{allImages.length} Images</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-purple-400" />
              <span className="text-admin-foreground">{allVideos.length} Videos</span>
            </div>
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-indigo-400" />
              <span className="text-admin-foreground">{model3D ? "1" : "0"} 3D Model</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-400" />
              <span className="text-admin-foreground">
                {product.accessoryIds?.length || 0} Accessories
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-400" />
              <span className="text-admin-foreground">
                {product.certificateIds?.length || 0} Certificates
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-admin-muted" />
              <span className="text-admin-foreground">
                {product.relatedProductIds?.length || 0} Related
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* STEP 3 INTEGRATION: Replace manual model-viewer with UnifiedModelViewer */}
      {model3D && (
        <GlassCard>
          <div className="px-5 pt-4 pb-1">
            <h3 className="text-sm font-semibold text-white">3D Model Preview</h3>
          </div>
          <div className="px-5 pb-5">
            <div className="relative z-elevated h-64 w-full overflow-hidden rounded-xl bg-white/[0.03] border border-white/5">
              <LazyUnifiedModelViewer
                asset={{
                  ...model3D,
                  type: "model",
                }}
                config={{
                  cameraControls: true,
                  autoRotate: true,
                  backgroundColorHex: "#0a0a0a",
                  exposure: 1.0,
                  shadowIntensity: 1,
                  interactionPolicy: "always-allow",
                  loading: "auto",
                }}
                className="h-full w-full"
              />
              <div className="absolute bottom-2 left-2 z-elevated rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1 text-white/80 text-xs">
                {model3D.filename}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Specifications */}
      {product.technicalSpecs && Object.keys(product.technicalSpecs).length > 0 && (
        <GlassCard>
          <div className="px-5 pt-4 pb-1">
            <h3 className="text-sm font-semibold text-white">Technical Specifications</h3>
          </div>
          <div className="px-5 pb-5">
            <div className="space-y-2">
              {Object.entries(product.technicalSpecs).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize text-admin-foreground">
                    {key.replace(/([A-Z])/g, " $1").trim()}:
                  </span>
                  <span className="text-admin-muted">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <GlassCard>
          <div className="px-5 pt-4 pb-1">
            <h3 className="text-sm font-semibold text-white">Tags</h3>
          </div>
          <div className="px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs text-admin-foreground border-white/10 bg-white/[0.03]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Business Information */}
      {(product.minimumOrderQuantity ||
        product.leadTime ||
        product.customizationOptions?.length) && (
        <GlassCard>
          <div className="px-5 pt-4 pb-1">
            <h3 className="text-sm font-semibold text-white">Business Information</h3>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {product.minimumOrderQuantity && (
              <div className="text-sm">
                <span className="font-medium text-admin-foreground">Minimum Order Quantity:</span>
                <span className="ml-2 text-admin-muted">{product.minimumOrderQuantity}</span>
              </div>
            )}
            {product.leadTime && (
              <div className="text-sm">
                <span className="font-medium text-admin-foreground">Lead Time:</span>
                <span className="ml-2 text-admin-muted">{product.leadTime}</span>
              </div>
            )}
            {product.customizationOptions && product.customizationOptions.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-admin-foreground">Customization Options:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {product.customizationOptions.map((option: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs text-admin-foreground border-white/10 bg-white/[0.03]"
                    >
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
