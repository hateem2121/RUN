import type React from "react";
import { useRef } from "react";
import { Link } from "react-router";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, useGSAP } from "@/lib/gsap";
import { useCursorStore } from "@/stores/useCursorStore";
import { FEATURED_PRODUCTS } from "./constants";
import type { HomepageFeaturedSettings, ProductItem } from "./types";

interface FeaturedProductsProps {
  products: ProductItem[] | undefined;
  settings?: HomepageFeaturedSettings | null | undefined;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { setCursor, resetCursor } = useCursorStore();

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const scope = containerRef.current;
      const cards = scope.querySelectorAll(".product-card");

      if (cards.length > 0) {
        if (prefersReducedMotion) {
          gsap.set(cards, { y: 0, opacity: 1 });
          return;
        }

        gsap.fromTo(
          cards,
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: scope,
              start: "top 70%",
            },
          },
        );
      }
    },
    { dependencies: [prefersReducedMotion], scope: containerRef },
  );

  const isMobile = useIsMobile();

  return (
    <section
      ref={containerRef}
      className="bg-background-alt w-full px-4 py-32 md:px-8"
      aria-labelledby="featured-products-heading"
    >
      <div className="max-w-container-2xl mx-auto">
        <div className="mb-16 flex items-end justify-between border-b border-foreground/10 pb-8">
          <h2
            id="featured-products-heading"
            className="text-4xl sm:text-5xl md:text-6xl leading-[0.9] font-bold uppercase"
          >
            {settings?.title || "Archive"} <br /> 24/25
          </h2>
          <div className="hidden text-right md:block">
            <p className="text-muted-foreground mb-2 font-mono text-xs tracking-widest">
              SEASON: CURRENT
            </p>
            <p className="text-muted-foreground font-mono text-xs tracking-widest">
              STATUS: PRODUCTION READY
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {(products?.length ? products : FEATURED_PRODUCTS)
            .slice(0, settings?.maxProducts ?? undefined)
            .map((product, index) => {
              const prod = product as ProductItem & {
                imageUrl?: string;
                image?: string;
                primaryImage?: { url?: string };
                urlPath?: string;
                moq?: number;
              };
              const productImg =
                prod.imageUrl ||
                prod.image ||
                prod.primaryImage?.url ||
                FEATURED_PRODUCTS[index % FEATURED_PRODUCTS.length]?.image ||
                "/images/placeholders/product-placeholder.webp";
              const targetUrl = prod.urlPath ? `/products/${prod.urlPath}` : `/products/${prod.id}`;
              const categoryName =
                typeof prod.category === "string"
                  ? prod.category
                  : (prod.category as { name?: string } | undefined)?.name || "TECHNICAL APPAREL";
              const priceDisplay = prod.price || (prod.moq ? `MOQ ${prod.moq}` : "MOQ 500");

              return (
                <li
                  key={prod.id}
                  className={`product-card group relative ${index === 1 ? "sm:max-lg:mt-24" : ""}`}
                  onMouseEnter={() => !isMobile && setCursor("view", productImg)}
                  onMouseLeave={() => resetCursor()}
                >
                  <div className="bg-muted/20 relative mb-8 aspect-3/4 overflow-hidden rounded-lg">
                    <ImageWithSkeleton
                      src={productImg}
                      alt={prod.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover grayscale transition-transform duration-700 ease-in-out group-hover:scale-110 group-hover:grayscale-0"
                      containerClassName="h-full w-full"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-transparent" />
                  </div>

                  <div className="flex items-start justify-between border-t border-foreground/10 pt-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl leading-tight font-bold uppercase md:text-2xl">
                        {prod.name}
                      </h3>
                      <p className="text-muted-foreground font-mono text-xs tracking-widest md:text-sm">
                        {categoryName}
                      </p>
                    </div>
                    <span className="ml-4 rounded-full border border-foreground/20 px-3 py-1 font-mono text-xs whitespace-nowrap">
                      {priceDisplay}
                    </span>
                  </div>

                  <Link
                    to={targetUrl}
                    onClick={() => resetCursor()}
                    className="absolute inset-0 z-elevated rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`View product details: ${prod.name}`}
                  />
                </li>
              );
            })}
        </ul>

        <div className="mt-24 text-center">
          <Link
            to="/categories"
            className="hover:border-primary hover:text-primary inline-flex min-h-11 items-center justify-center border-b border-foreground pb-1 text-sm font-bold tracking-widest uppercase transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onMouseEnter={() => !isMobile && setCursor("button")}
            onMouseLeave={() => resetCursor()}
          >
            View Full Catalogue
          </Link>
        </div>
      </div>
    </section>
  );
};
