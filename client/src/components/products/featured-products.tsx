import type { TransformedProduct } from "@/lib/product-transformers";
import { ProductCard } from "./product-card";

interface FeaturedProductsProps {
  title: string;
  products: TransformedProduct[];
  onQuickViewClick: (product: TransformedProduct) => void;
}

export const FeaturedProducts = ({ title, products, onQuickViewClick }: FeaturedProductsProps) => (
  <section className="bg-background px-6 py-16 text-foreground lg:py-24">
    <div className="mx-auto container-wide">
      <h2 className="mb-12 text-center font-condensed text-5xl sm:text-6xl md:text-8xl lg:text-9xl">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onQuickViewClick={onQuickViewClick} />
        ))}
      </div>
    </div>
  </section>
);
