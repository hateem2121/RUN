import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Certificate, Fabric, ProductSummary } from "@shared/schema";
import { transformProducts } from "@/lib/product-transformers";
import { ProductCard } from "./product-card";
import { QuickViewModal } from "./quick-view-modal";
import type { TransformedProduct } from "@/lib/product-transformers";

interface ProductGridProps {
  products: ProductSummary[];
  viewMode: "small" | "medium" | "large";
  categories: any[];
  fabrics?: Fabric[];
  certificates?: Certificate[];
}

export function ProductGrid({
  products: rawProducts,
  viewMode,
  categories,
  fabrics = [],
  certificates = [],
}: ProductGridProps) {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<TransformedProduct | null>(null);

  // Transform products using the standard utility
  const products = transformProducts(rawProducts, {
    categories,
    fabrics,
    certificates,
    mediaAssets: [],
    mediaContentMap: new Map(), // We use content URLs by default if not in map
  });

  const gridClasses = {
    small: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3",
    medium: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
    large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
  };

  const handleProductHover = (product: TransformedProduct) => {
    // Prefetch product detail page data
    queryClient.prefetchQuery({
      queryKey: ["/api/products", product.id],
      queryFn: () => apiRequest(`/api/products/${product.id}`),
      staleTime: 5 * 60 * 1000,
    });
  };

  return (
    <>
      <div className={cn("grid", gridClasses[viewMode])}>
        {products.map((product) => (
          <div key={product.id} onMouseEnter={() => handleProductHover(product)}>
            <ProductCard
              product={product}
              viewMode={viewMode}
              onQuickViewClick={setSelectedProduct}
            />
          </div>
        ))}
      </div>

      <QuickViewModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
