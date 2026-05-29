import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type React from "react";
import { useRef } from "react";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { useCursorStore } from "@/stores/useCursorStore";
import { useScroll } from "../../hooks/use-scroll";
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
  const { scroll } = useScroll();

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
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.2,
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

  const handleCatalogueClick = () => {
    const catalogueSection = document.getElementById("catalogue");
    if (catalogueSection && scroll) {
      // Use Locomotive/Lenis scrollTo for synchronized movement
      scroll.scrollTo(catalogueSection, {
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      });
    } else if (catalogueSection) {
      // Fallback if scroll instance is not ready
      catalogueSection.scrollIntoView({ behavior: "smooth" });
    }
  };

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
            className="text-[12vw] leading-[0.9] font-bold uppercase md:text-[5vw]"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {(products?.length ? products : FEATURED_PRODUCTS)
            .slice(0, settings?.maxProducts ?? undefined)
            .map((product, index) => (
              <section
                key={product.id}
                className={`product-card group relative ${index === 1 ? "sm:mt-24" : ""}`}
                onMouseEnter={() => !isMobile && setCursor("view")}
                onMouseLeave={() => resetCursor()}
                aria-label={`Product card for ${product.name}`}
              >
                <div className="bg-muted/20 relative mb-8 aspect-3/4 overflow-hidden">
                  <ImageWithSkeleton
                    src={
                      product.image ||
                      FEATURED_PRODUCTS[index % FEATURED_PRODUCTS.length]?.image ||
                      ""
                    }
                    srcSet={
                      product.id
                        ? MediaUrlBuilder.buildSrcSet(
                            Number(product.id),
                            product.imageVariants || undefined,
                          )
                        : undefined
                    }
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    alt={product.name}
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
                      {product.name}
                    </h3>
                    <p className="text-muted-foreground font-mono text-xs tracking-widest md:text-sm">
                      {product.category}
                    </p>
                  </div>
                  <span className="ml-4 rounded-full border border-foreground/20 px-3 py-1 font-mono text-xs whitespace-nowrap">
                    {product.price}
                  </span>
                </div>
              </section>
            ))}
        </div>

        <div className="mt-24 text-center">
          <button
            type="button"
            onClick={handleCatalogueClick}
            aria-label="View the full product catalogue"
            className="hover:border-primary hover:text-primary border-b border-foreground pb-1 text-sm font-bold tracking-widest uppercase transition-colors"
            onMouseEnter={() => !isMobile && setCursor("button")}
            onMouseLeave={() => resetCursor()}
          >
            View Full Catalogue
          </button>
        </div>
      </div>
    </section>
  );
};
