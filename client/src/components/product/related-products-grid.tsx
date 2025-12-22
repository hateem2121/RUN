/**
 * Related Products Grid Component
 * Displays grid of related products based on category or tags
 */

import type { MediaAsset, Product } from "@shared/schema";
import { Package } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface RelatedProductsGridProps {
  products: Product[];
  title?: string;
  className?: string;
  showViewAll?: boolean;
  viewAllUrl?: string;
  media?: MediaAsset[];
}

export function RelatedProductsGrid({
  products,
  title = "Related Products",
  className,
  showViewAll = false,
  viewAllUrl
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
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-bold uppercase tracking-tight text-black">
            {title}
          </h2>
          {showViewAll && viewAllUrl && (
            <Link
              href={viewAllUrl}
              className="text-sm uppercase tracking-[0.1em] font-medium underline hover:no-underline text-black"
            >
              Explore More
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
        {products.slice(0, 4).map((product) => {
          const imageUrl = getProductImage(product);
          const productUrl = (product as any).canonicalUrl || `/products/${product.slug}`;

          return (
            <Link key={product.id} href={productUrl}>
              <div className="group cursor-pointer">
                <div className="aspect-square relative mb-4 bg-gray-50 overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-medium text-black line-clamp-2 group-hover:underline">
                    {product.name}
                  </h3>
                  {product.sku && (
                    <p className="text-xs font-mono text-gray-400">
                      {product.sku}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {showViewAll && viewAllUrl && (
        <div className="text-center mt-12">
          <Link href={viewAllUrl}>
            <button className="text-sm uppercase tracking-[0.1em] font-semibold px-8 py-4 bg-black text-white hover:bg-gray-900 transition-colors rounded-none">
              Explore More
            </button>
          </Link>
        </div>
      )}
    </section>
  );
}