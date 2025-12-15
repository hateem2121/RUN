import { ProductSummary, MediaAsset, Category } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { LazyMediaEnhanced } from "./LazyMediaEnhanced";
import { LayoutGrid, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProductGridProps {
  products: ProductSummary[];
  mediaAssets: MediaAsset[];
  viewMode: "small" | "medium" | "large";
}

export function ProductGrid({ products, mediaAssets, viewMode }: ProductGridProps) {
  const queryClient = useQueryClient();

  // Fetch categories to build hierarchical URLs
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Get product URL (hierarchical) - only return valid URLs
  const getProductUrl = (product: ProductSummary): string | null => {
    const category = categories.find((c) => c.id === product.categoryId);

    // Validate required data before constructing URL
    if (!category || !category.slug) {
      console.warn(
        `[ProductGrid] Missing category slug for product ${product.id} (${product.name})`,
      );
      return null;
    }

    if (!product.slug) {
      console.warn(
        `[ProductGrid] Missing product slug for product ${product.id} (${product.name})`,
      );
      return null;
    }

    return `/categories/${category.slug}/${product.slug}`;
  };

  // Get primary media
  const getPrimaryMedia = (product: ProductSummary) => {
    const primaryId =
      product.primaryImageId ||
      product.primaryVideoId ||
      (product.imageIds && product.imageIds[0]) ||
      (product.videos && product.videos[0]);
    if (!primaryId) return null;

    const media = mediaAssets.find((m) => m.id === primaryId);
    return media;
  };

  const gridClasses = {
    small: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3",
    medium: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
    large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
  };

  // Prefetch product data on hover for instant navigation
  const handleProductHover = (product: ProductSummary) => {
    const category = categories.find((c) => c.id === product.categoryId);

    // Prefetch product detail page data using shared apiRequest for proper error handling
    queryClient.prefetchQuery({
      queryKey: ["/api/products", product.id],
      queryFn: () => apiRequest(`/api/products/${product.id}`, { method: "GET" }),
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    // Also prefetch category data if available
    if (category) {
      queryClient.prefetchQuery({
        queryKey: ["/api/categories", category.id],
        queryFn: () => apiRequest(`/api/categories/${category.id}`, { method: "GET" }),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  return (
    <div className={cn("grid", gridClasses[viewMode])}>
      {products.map((product) => {
        const primaryMedia = getPrimaryMedia(product);
        const isVideo = primaryMedia?.type === "video";
        const productUrl = getProductUrl(product);

        // Skip products with invalid URLs (missing category or product slug)
        if (!productUrl) {
          return null;
        }

        return (
          <Link href={productUrl} key={product.id}>
            <Card
              className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow-sm"
              onMouseEnter={() => handleProductHover(product)}
            >
              {/* Media Preview */}
              <div
                className={cn(
                  "relative bg-gray-100 overflow-hidden",
                  viewMode === "small" ? "aspect-[3/4]" : "aspect-[4/5]",
                )}
              >
                {primaryMedia ? (
                  <LazyMediaEnhanced
                    mediaId={primaryMedia.id}
                    alt={product.name}
                    className="w-full h-full"
                    priority={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <LayoutGrid className="w-12 h-12" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isFeatured && (
                    <Badge className="bg-yellow-500 text-white">Featured</Badge>
                  )}
                  {product.tags && product.tags.length > 0 && viewMode !== "small" && (
                    <Badge variant="secondary">{product.tags[0]}</Badge>
                  )}
                </div>

                {/* Video indicator */}
                {isVideo && (
                  <div className="absolute bottom-2 right-2">
                    <div className="bg-black/70 text-white rounded-full p-2">
                      <Play className="w-4 h-4" fill="white" />
                    </div>
                  </div>
                )}

                {/* Media count badges */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {product.imageIds && product.imageIds.length > 1 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {product.imageIds.length} images
                    </Badge>
                  )}
                  {product.videos && product.videos.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-green-100 text-green-800"
                    >
                      {product.videos.length} videos
                    </Badge>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className={cn("p-4", viewMode === "small" && "p-3")}>
                <h3
                  className={cn(
                    "font-semibold mb-1 group-hover:text-blue-600 transition-colors",
                    viewMode === "small" ? "text-sm" : "text-lg",
                  )}
                >
                  {product.name}
                </h3>

                {viewMode !== "small" && (
                  <>
                    {product.sku && (
                      <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                    )}
                    {product.description && viewMode === "large" && (
                      <p className="text-sm text-gray-700 line-clamp-2">{product.description}</p>
                    )}
                  </>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
