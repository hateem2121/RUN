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
  <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="mb-4 h-64 rounded-lg bg-gray-300" />
        <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
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
