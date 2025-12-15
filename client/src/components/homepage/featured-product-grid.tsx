import { lazy, Suspense } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { AnimationErrorBoundary } from "@/components/error-boundaries/animation-error-boundary";
import { LiquidGlassTitle } from "@/components/ui/glass-card";
import { SwipeableMediaCard } from "@/components/homepage/swipeable-media-card";
import { ButtonHoverMultiple } from "@/components/ui/button-hover-multiple";
import {
  buildProductUrl,
  buildProductMediaItems,
} from "@/lib/product-transformers";
import type {
  Product,
  Category,
  HomepageFeaturedProductsSettings,
} from "@shared/schema";

const DotGrid = lazy(() =>
  import("@/components/homepage/dot-grid").then((m) => ({
    default: m.DotGrid,
  })),
);

interface FeaturedProductGridProps {
  productsSection: {
    title?: string | null;
    content?: string | null;
  };
  featuredProducts: Product[];
  categories: Category[];
  featuredProductsSettings?: HomepageFeaturedProductsSettings;
}

export function FeaturedProductGrid({
  productsSection,
  featuredProducts,
  categories,
  featuredProductsSettings,
}: FeaturedProductGridProps) {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-black">
      {/* GSAP-based Dot Grid Background */}
      <div className="absolute inset-0">
        <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
          <DotGrid
            dotSize={featuredProductsSettings?.dotGrid?.dotSize ?? 10}
            gap={featuredProductsSettings?.dotGrid?.gap ?? 15}
            baseColor={
              featuredProductsSettings?.dotGrid?.baseColor ?? "#5227FF"
            }
            activeColor={
              featuredProductsSettings?.dotGrid?.activeColor ?? "#5227FF"
            }
            proximity={featuredProductsSettings?.dotGrid?.proximity ?? 120}
            shockRadius={featuredProductsSettings?.dotGrid?.shockRadius ?? 250}
            shockStrength={
              featuredProductsSettings?.dotGrid?.shockStrength ?? 5
            }
            resistance={featuredProductsSettings?.dotGrid?.resistance ?? 750}
            returnDuration={
              featuredProductsSettings?.dotGrid?.returnDuration ?? 1.5
            }
          />
        </Suspense>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex justify-center mb-12">
          <LiquidGlassTitle
            title={productsSection.title ?? "Featured Products"}
            subtitle={productsSection.content ?? undefined}
          />
        </div>

        {/* Product Grid */}
        {/* PATTERN: Responsive Grid - 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => {
            // Build product media items with proper priority ordering
            const mediaItems = buildProductMediaItems(product);

            // Build hierarchical product URL
            const productUrl = buildProductUrl(product, categories);

            return (
              <AnimationErrorBoundary
                key={product.id}
                componentName="SwipeableMediaCard"
              >
                <SwipeableMediaCard
                  id={product.id}
                  name={product.name}
                  description={product.description || undefined}
                  mediaItems={mediaItems}
                  onClick={() => {
                    window.location.href = productUrl;
                  }}
                  swipeAnimation={
                    featuredProductsSettings?.swipeAnimation ?? undefined
                  }
                  data-testid={`card-product-${product.id}`}
                />
              </AnimationErrorBoundary>
            );
          })}
        </div>

        {/* View All Products Button */}
        <div className="text-center mt-12">
          <Link href="/products">
            <ButtonHoverMultiple data-testid="button-view-all-products">
              View All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </ButtonHoverMultiple>
          </Link>
        </div>
      </div>
    </section>
  );
}
