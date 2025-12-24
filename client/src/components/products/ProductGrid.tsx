import type { Category, MediaAsset, ProductSummary } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, Play } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { LazyMediaEnhanced } from "./LazyMediaEnhanced";

interface ProductGridProps {
  products: ProductSummary[];
  mediaAssets: MediaAsset[];
  viewMode: "small" | "medium" | "large";
}

export function ProductGrid({
  products,
  mediaAssets,
  viewMode,
  categories,
}: ProductGridProps & { categories: Category[] }) {
  const queryClient = useQueryClient();

  // Get product URL (hierarchical) - only return valid URLs
  const getProductUrl = (product: ProductSummary): string | null => {
    const category = categories.find((c) => c.id === product.categoryId);

    // Validate required data before constructing URL
    if (!category || !category.slug) {
      return null;
    }

    if (!product.slug) {
      return null;
    }

    return `/categories/${category.slug}/${product.slug}`;
  };

  // Get primary media
  const getPrimaryMedia = (product: ProductSummary) => {
    const primaryId =
      product.primaryImageId ||
      product.primaryVideoId ||
      product.imageIds?.[0] ||
      product.videos?.[0];
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
        // Defensive coding: skip undefined products or hydration ghosts
        if (!product || !product.id) return null;

        const primaryMedia = getPrimaryMedia(product);
        const isVideo = primaryMedia?.type === "video";
        const productUrl = getProductUrl(product);

        // Skip products with invalid URLs (missing category or product slug)
        // Defensively check name to prevent hydration crashes
        if (!productUrl || !product.name) {
          return null;
        }

        return (
          <Link href={productUrl} key={product.id}>
            <Card
              className="group cursor-pointer overflow-hidden transition-shadow-sm hover:shadow-lg"
              onMouseEnter={() => handleProductHover(product)}
            >
              {/* Media Preview */}
              <div
                className={cn(
                  "relative overflow-hidden bg-gray-100",
                  viewMode === "small" ? "aspect-[3/4]" : "aspect-[4/5]",
                )}
              >
                {primaryMedia ? (
                  <LazyMediaEnhanced
                    mediaId={primaryMedia.id}
                    alt={product.name || "Product Image"}
                    className="h-full w-full"
                    priority={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <LayoutGrid className="h-12 w-12" />
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
                  <div className="absolute right-2 bottom-2">
                    <div className="rounded-full bg-black/70 p-2 text-white">
                      <Play className="h-4 w-4" fill="white" />
                    </div>
                  </div>
                )}

                {/* Media count badges */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {product.imageIds && product.imageIds.length > 1 && (
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                      {product.imageIds.length} images
                    </Badge>
                  )}
                  {product.videos && product.videos.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 px-2 py-0.5 text-green-800 text-xs"
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
                    "mb-1 font-semibold transition-colors group-hover:text-blue-600",
                    viewMode === "small" ? "text-sm" : "text-lg",
                  )}
                >
                  {product?.name || "Unnamed Product"}
                </h3>

                {/* Defensive Rendering for Category Relation */}
                <p className="mb-2 text-muted-foreground text-xs">
                  {categories.find((c) => c.id === product.categoryId)?.name ?? "Uncategorized"}
                </p>

                {viewMode !== "small" && (
                  <>
                    {product.sku && (
                      <p className="mb-2 text-gray-600 text-sm">SKU: {product.sku}</p>
                    )}
                    {product.description && viewMode === "large" && (
                      <p className="line-clamp-2 text-gray-700 text-sm">{product.description}</p>
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
