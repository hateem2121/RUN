import type {
  Category,
  HomepageFeaturedProductsSettings,
  HomepageSection,
  Product,
} from "@shared/schema";
import { Suspense } from "react";
import { FeaturedProductGrid } from "@/components/homepage/featured-product-grid";

interface ProductsSectionProps {
  productsSection: HomepageSection;
  featuredProducts: Product[];
  categories: Category[];
  featuredProductsSettings?: HomepageFeaturedProductsSettings | null;
}

const LoadingProducts = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="h-64 bg-gray-300 rounded-lg mb-4" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    ))}
  </div>
);

export function ProductsSection({
  productsSection,
  featuredProducts,
  categories,
  featuredProductsSettings,
}: ProductsSectionProps) {
  if (!productsSection.isActive || featuredProducts.length === 0) {
    return null;
  }

  return (
    <Suspense fallback={<LoadingProducts />}>
      <FeaturedProductGrid
        productsSection={productsSection}
        featuredProducts={featuredProducts}
        categories={categories}
        featuredProductsSettings={featuredProductsSettings ?? undefined}
      />
    </Suspense>
  );
}
