import type { Category, Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { batchFetchMediaContent } from "@/lib/queryClient";
import { LazyMediaEnhanced } from "./LazyMediaEnhanced";

interface RelatedProductsProps {
  currentProductId: number;
  categoryId?: number | undefined;
  fabricId?: number | undefined;
  tags?: string[];
}

export function RelatedProducts({
  currentProductId,
  categoryId,
  fabricId,
  tags = [],
}: RelatedProductsProps) {
  // Fetch all active products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products?active=true"],
  });

  // Fetch categories to build hierarchical URLs
  // Fetch categories to build hierarchical URLs
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Helper function to calculate relevance score (moved here for useMemo)
  const getRelevanceScore = (product: Product) => {
    let score = 0;
    if (categoryId && product.categoryId === categoryId) score += 10;
    if (fabricId && product.fabricId === fabricId) score += 5;
    if (tags.length > 0 && product.tags) {
      const sharedTags = tags.filter((tag) => product.tags?.includes(tag));
      score += sharedTags.length * 2;
    }
    if (product.isFeatured) score += 1;
    return score;
  };

  // PHASE 1A INTEGRATION: Extract media IDs from related products and batch fetch them
  const relatedProductMediaIds = useMemo(() => {
    const relatedProducts = products
      .filter((p) => p.id !== currentProductId && p.isActive)
      .map((p) => ({ product: p, score: getRelevanceScore(p) }))
      .sort((a, b) => b.score - a.score)
      .filter((item) => item.score > 0)
      .slice(0, 6)
      .map((item) => item.product);

    const ids: number[] = [];
    relatedProducts.forEach((product) => {
      if (product.primaryImageId) ids.push(product.primaryImageId);
      if (product.primaryVideoId) ids.push(product.primaryVideoId);
      if (product.imageIds && Array.isArray(product.imageIds)) {
        ids.push(...product.imageIds.filter((id) => typeof id === "number"));
      }
      if (product.videos && Array.isArray(product.videos)) {
        ids.push(...product.videos.filter((id) => typeof id === "number"));
      }
    });

    return [...new Set(ids)].filter((id) => id > 0 && id < 1000000000000);
  }, [products, currentProductId, getRelevanceScore]);

  // PHASE 1A: Batch fetch media for related products to eliminate N+1 requests
  const [batchedProductMedia, setBatchedProductMedia] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (relatedProductMediaIds.length === 0) return;

    const fetchBatchedMedia = async () => {
      try {
        const results = await batchFetchMediaContent(relatedProductMediaIds);

        const mediaMap = new Map<number, string>();
        results.forEach((result) => {
          if (result.success) {
            // PHASE 1B Integration: Use inline content if available, otherwise URL
            const mediaUrl = result.content || result.url || `/api/media/${result.id}/content`;
            mediaMap.set(result.id, mediaUrl);
          }
        });

        setBatchedProductMedia(mediaMap);
      } catch (_error) {}
    };

    fetchBatchedMedia();
  }, [relatedProductMediaIds]);

  // Get product URL (hierarchical) - only return valid URLs
  const getProductUrl = (product: Product): string | null => {
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

  // PHASE 1A: Batch-first media URL resolver - eliminates individual requests
  const getMediaUrl = (mediaId: number | null | undefined) => {
    if (!mediaId) return null;

    // PHASE 1A: Use batched media first - eliminates individual requests
    if (batchedProductMedia.has(mediaId)) {
      return batchedProductMedia.get(mediaId);
    }

    // Fallback: Direct URL (rare case for unbatched media)
    return `/api/media/${mediaId}/content`;
  };

  // Get primary media with batch integration
  const getPrimaryMedia = (product: Product) => {
    const primaryId =
      product.primaryImageId ||
      product.primaryVideoId ||
      product.imageIds?.[0] ||
      product.videos?.[0];
    if (!primaryId || typeof primaryId !== "number") return null;

    // Return media info for LazyMediaEnhanced component
    return {
      id: primaryId,
      url: getMediaUrl(primaryId),
      type: product.primaryVideoId === primaryId ? "video" : "image",
    };
  };

  // Get related products sorted by relevance
  const relatedProducts = products
    .filter((p) => p.id !== currentProductId && p.isActive)
    .map((p) => ({ product: p, score: getRelevanceScore(p) }))
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, 6)
    .map((item) => item.product);

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="mb-6 font-bold text-2xl">Related Products</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {relatedProducts.map((product) => {
          const primaryMedia = getPrimaryMedia(product);
          const productUrl = getProductUrl(product);

          // Skip products with invalid URLs (missing category or product slug)
          if (!productUrl) {
            return null;
          }

          return (
            <Link to={productUrl} key={product.id}>
              <Card className="group h-full cursor-pointer overflow-hidden transition-shadow-sm hover:shadow-lg">
                {/* Media Preview */}
                <div className="relative aspect-4/5 overflow-hidden bg-muted">
                  {primaryMedia ? (
                    <LazyMediaEnhanced
                      mediaId={primaryMedia.id}
                      alt={product.name || "Related Product"}
                      className="h-full w-full"
                      priority={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/70">
                      <LayoutGrid className="h-12 w-12" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isFeatured && (
                      <Badge className="bg-yellow-500 text-white">Featured</Badge>
                    )}
                    {product.tags && product.tags.length > 0 && (
                      <Badge variant="secondary">{product.tags[0]}</Badge>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-lg transition-colors group-hover:text-blue-600">
                    {product.name || "Unnamed Product"}
                  </h3>
                  {product.sku && (
                    <p className="mb-2 text-muted-foreground text-sm">SKU: {product.sku}</p>
                  )}
                  {product.description && (
                    <p className="line-clamp-2 text-foreground/80 text-sm">{product.description}</p>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
