/**
 * Related Products Grid Component
 * Displays grid of related products based on category or tags
 */

import type { MediaAsset, Product } from "@shared/schema";
import { Package } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

interface RelatedProductsGridProps {
  products: Product[];
  title?: string | undefined;
  className?: string | undefined;
  showViewAll?: boolean | undefined;
  viewAllUrl?: string | undefined;
  media?: MediaAsset[];
}

export function RelatedProductsGrid({
  products,
  title = "Related Products",
  className,
  showViewAll = false,
  viewAllUrl,
}: RelatedProductsGridProps) {
  if (products.length === 0) {
    return null;
  }

  // Helper to get media URL for a product
  const getProductImage = (product: Product) => {
    // Products may have media IDs in a media array or as a single ID
    const productMedia = (product as any).media;
    if (productMedia && productMedia.length > 0) {
      const firstMediaId = productMedia[0];
      return `/api/media/${firstMediaId}/content`;
    }
    return null;
  };

  return (
    <section className={cn("", className)}>
      {title && (
        <div className="mb-12 flex items-center justify-between">
          <h2 className="font-bold text-4xl text-black uppercase tracking-tight">{title}</h2>
          {showViewAll && viewAllUrl && (
            <Link
              to={viewAllUrl}
              className="font-medium text-black text-sm uppercase tracking-widest underline hover:no-underline"
            >
              Explore More
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-10">
        {products.slice(0, 4).map((product) => {
          const imageUrl = getProductImage(product);
          const productUrl = (product as any).canonicalUrl || `/products/${product.slug}`;

          return (
            <Link key={product.id} to={productUrl}>
              <div className="group cursor-pointer">
                <div className="relative mb-4 aspect-square overflow-hidden bg-background">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="line-clamp-2 font-medium text-base text-black group-hover:underline">
                    {product.name}
                  </h3>
                  {product.sku && (
                    <p className="font-mono text-muted-foreground/70 text-xs">{product.sku}</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {showViewAll && viewAllUrl && (
        <div className="mt-12 text-center">
          <Link to={viewAllUrl}>
            <button className="rounded-none bg-black px-8 py-4 font-semibold text-sm text-white uppercase tracking-widest transition-colors hover:bg-foreground">
              Explore More
            </button>
          </Link>
        </div>
      )}
    </section>
  );
}
