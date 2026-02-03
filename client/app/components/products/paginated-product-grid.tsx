import { useEffect, useState } from "react";
import type { TransformedProduct } from "@/lib/product-transformers";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: TransformedProduct[];
  onQuickViewClick: (product: TransformedProduct) => void;
}

export const PaginatedProductGrid = ({ products, onQuickViewClick }: ProductGridProps) => {
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, []);

  const PRODUCTS_PER_LOAD = 12;
  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PRODUCTS_PER_LOAD);
  };

  return (
    <section className="bg-background px-6 py-16 text-foreground lg:py-24">
      <div className="container-wide mx-auto">
        {products.length === 0 ? (
          <div className="px-4 py-20 text-center">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickViewClick={onQuickViewClick}
                />
              ))}
            </div>
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="min-h-11 bg-primary px-8 py-4 text-primary-foreground text-sm uppercase tracking-widest transition-colors hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  data-testid="load-more-button"
                  aria-label="Load more products"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
