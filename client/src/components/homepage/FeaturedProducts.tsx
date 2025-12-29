import gsap from "gsap";
import type React from "react";
import { useEffect, useRef } from "react";
import { FEATURED_PRODUCTS } from "./constants";
import { useStore } from "./store";
import { CursorVariant } from "./types";

const FeaturedProducts: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setCursor = useStore((state) => state.setCursor);

  useEffect(() => {
    if (!containerRef.current) return;

    // Explicitly use .current
    const scope = containerRef.current;

    const ctx = gsap.context(() => {
      const cards = scope.querySelectorAll(".product-card");

      if (cards.length > 0) {
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
    }, scope);

    return () => ctx.revert();
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const handleCatalogueClick = () => {
    const catalogueSection = document.getElementById("catalogue");
    if (catalogueSection) {
      catalogueSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section ref={containerRef} className="w-full bg-background-alt px-4 py-32 md:px-8">
      <div className="mx-auto max-w-container-2xl">
        <div className="mb-16 flex items-end justify-between border-black/10 border-b pb-8">
          <h2 className="font-bold text-[12vw] uppercase leading-[0.9] md:text-[5vw]">
            Archive <br /> 24/25
          </h2>
          <div className="hidden text-right md:block">
            <p className="mb-2 font-mono text-muted-foreground text-xs tracking-widest">
              SEASON: CURRENT
            </p>
            <p className="font-mono text-muted-foreground text-xs tracking-widest">
              STATUS: PRODUCTION READY
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
          {FEATURED_PRODUCTS.map((product, index) => (
            <div
              key={product.id}
              className={`product-card group relative ${index === 1 ? "md:mt-24" : ""}`}
              onMouseEnter={() => !isMobile && setCursor(CursorVariant.VIEW, "VIEW SPECS")}
              onMouseLeave={() => setCursor(CursorVariant.DEFAULT)}
            >
              <div className="relative mb-8 aspect-3/4 overflow-hidden bg-muted/20">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover grayscale transition-transform duration-700 ease-in-out group-hover:scale-110 group-hover:grayscale-0"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-transparent" />
              </div>

              <div className="flex items-start justify-between border-black/10 border-t pt-6">
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-xl uppercase leading-tight md:text-2xl">
                    {product.name}
                  </h3>
                  <p className="font-mono text-muted-foreground text-xs tracking-widest md:text-sm">
                    {product.category}
                  </p>
                </div>
                <span className="ml-4 whitespace-nowrap rounded-full border border-black/20 px-3 py-1 font-mono text-xs">
                  {product.price}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <button
            onClick={handleCatalogueClick}
            className="border-black border-b pb-1 font-bold text-sm uppercase tracking-widest transition-colors hover:border-brand-accent hover:text-brand-accent"
            onMouseEnter={() => !isMobile && setCursor(CursorVariant.BUTTON)}
            onMouseLeave={() => setCursor(CursorVariant.DEFAULT)}
          >
            View Full Catalogue
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
