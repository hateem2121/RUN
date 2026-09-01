import type React from "react";
import { memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useCursorStore } from "@/stores/useCursorStore";
import { CATEGORIES } from "./constants";
import type { CategoryItem } from "./types";

interface CategoriesProps {
  data: CategoryItem[] | undefined;
}

const CategoryMarqueeItem: React.FC<{
  cat: CategoryItem | Record<string, unknown>;
  uniqueIndex: string;
  isHovered: boolean;
  isBlurred: boolean;
  isHidden?: boolean;
  onMouseEnter: (index: string, image: string) => void;
  onMouseLeave: () => void;
}> = memo(({ cat, uniqueIndex, isHovered, isBlurred, isHidden, onMouseEnter, onMouseLeave }) => {
  const { resetCursor } = useCursorStore();
  const catImage =
    (cat as { imageUrl?: string; mediaUrl?: string; image?: string }).imageUrl ||
    (cat as { imageUrl?: string; mediaUrl?: string; image?: string }).mediaUrl ||
    (cat as { imageUrl?: string; mediaUrl?: string; image?: string }).image ||
    "/images/placeholders/category-placeholder.webp";

  const catSlug = (cat as { slug?: string }).slug || String(cat.id || "");
  const targetUrl = catSlug ? `/categories/${catSlug}` : "/categories";
  const catName = String(cat.name || "Apparel");

  return (
    <li
      className={cn(
        "group relative px-8 py-4 transition-all duration-500 ease-out md:px-16",
        isBlurred ? "opacity-70" : "opacity-100",
        isHovered && "scale-105",
      )}
    >
      <Link
        to={targetUrl}
        tabIndex={isHidden ? -1 : undefined}
        onClick={() => resetCursor()}
        className="block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
        onMouseEnter={() => onMouseEnter(uniqueIndex, catImage)}
        onMouseLeave={onMouseLeave}
        onFocus={() => onMouseEnter(uniqueIndex, catImage)}
        onBlur={onMouseLeave}
        aria-label={`Explore category: ${catName}`}
      >
        <span
          className={cn(
            "stroke-text block text-display-xl font-bold tracking-tighter uppercase transition-all duration-300 font-neue-stance",
            "group-hover:[-webkit-text-stroke:2px_var(--color-primary)] dark:group-hover:[-webkit-text-stroke:2px_var(--color-brand-lime)]",
            "group-hover:text-foreground/15 dark:group-hover:text-foreground/25",
            "group-hover:drop-shadow-[0_0_25px_rgba(99,102,241,0.35)] dark:group-hover:drop-shadow-[0_0_25px_rgba(179,230,0,0.4)]",
            "group-focus:[-webkit-text-stroke:2px_var(--color-primary)] dark:group-focus:[-webkit-text-stroke:2px_var(--color-brand-lime)]",
            "group-focus:text-foreground/15 dark:group-focus:text-foreground/25",
            "group-focus:drop-shadow-[0_0_25px_rgba(99,102,241,0.35)] dark:group-focus:drop-shadow-[0_0_25px_rgba(179,230,0,0.4)]",
          )}
        >
          {catName}{" "}
          <span
            className="text-primary dark:text-brand-lime inline-block align-top text-xl md:text-2xl"
            aria-hidden="true"
          >
            ●
          </span>
        </span>
      </Link>
    </li>
  );
});

export const Categories: React.FC<CategoriesProps> = ({ data }) => {
  const { setCursor, resetCursor } = useCursorStore();
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const skewWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry && setIsIntersecting(entry.isIntersecting),
      { threshold: 0.01 },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const skewWrapper = skewWrapperRef.current;
      if (!skewWrapper || isMobile || prefersReducedMotion) return;

      let resetTween: gsap.core.Tween | null = null;

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          // Cap the skew between -1.5 and 1.5 degrees for smooth performance
          const skewAmount = Math.max(-1.5, Math.min(1.5, velocity * -0.001));

          gsap.to(skewWrapper, {
            skewX: skewAmount,
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });

          if (resetTween) resetTween.kill();
          resetTween = gsap.to(skewWrapper, {
            skewX: 0,
            duration: 0.8,
            delay: 0.1,
            ease: "power2.out",
          });
        },
      });

      return () => {
        if (resetTween) resetTween.kill();
        if (skewWrapper) gsap.set(skewWrapper, { skewX: 0, clearProps: "transform" });
      };
    },
    { dependencies: [isMobile, prefersReducedMotion], scope: containerRef },
  );

  const handleMouseEnter = (index: string, image: string) => {
    setHoveredIndex(index);
    if (!isMobile) {
      setCursor("view", image);
    }
  };

  const handleMouseLeave = () => {
    resetCursor();
    setHoveredIndex(null);
  };

  return (
    <section
      id="catalogue"
      ref={containerRef}
      className="relative w-full overflow-hidden bg-background px-4 py-32 md:px-8"
      aria-labelledby="categories-heading"
    >
      <h2 id="categories-heading" className="sr-only">
        Product Categories Catalogue
      </h2>

      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-radial-primary-glow opacity-5" />

      <section
        className="flex flex-col gap-0"
        onMouseLeave={() => setHoveredIndex(null)}
        aria-label="Product categories ticker"
      >
        {/* Outer Skew Wrapper */}
        <div
          ref={skewWrapperRef}
          className="marquee-skew-wrapper w-full overflow-hidden transform-gpu will-change-transform"
        >
          {/* Inner TranslateX Marquee Track */}
          <div
            className={cn(
              "marquee-container animate-marquee flex whitespace-nowrap transform-gpu will-change-transform hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:[animation-play-state:paused] motion-reduce:animate-none",
              !isIntersecting && "[animation-play-state:paused]",
            )}
          >
            {/* Render 4 loops for seamless marquee */}
            {[1, 2, 3, 4].map((loop) => {
              const isLoopHidden = loop > 1;
              return (
                <ul key={`loop-${loop}`} aria-hidden={isLoopHidden} className="flex">
                  {(data && data.length > 0 ? data : CATEGORIES).map((cat, index) => {
                    const uniqueIndex = `${loop}-${index}`;
                    return (
                      <CategoryMarqueeItem
                        key={`${cat.id}-${uniqueIndex}`}
                        cat={cat}
                        uniqueIndex={uniqueIndex}
                        isHovered={hoveredIndex === uniqueIndex}
                        isBlurred={hoveredIndex !== null && hoveredIndex !== uniqueIndex}
                        isHidden={isLoopHidden}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      />
                    );
                  })}
                </ul>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
};
