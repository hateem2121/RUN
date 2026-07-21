import type React from "react";
import { memo, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useCursorStore } from "@/stores/useCursorStore";
import { CATEGORIES } from "./constants";
import type { CategoryItem } from "./types";

interface CategoriesProps {
  data: CategoryItem[] | undefined;
}

const CategoryMarqueeItem: React.FC<{
  cat: CategoryItem;
  uniqueIndex: string;
  isHovered: boolean;
  isBlurred: boolean;
  isMobile: boolean;
  onMouseEnter: (index: string, image: string) => void;
  onMouseLeave: () => void;
}> = memo(({ cat, uniqueIndex, isBlurred, onMouseEnter, onMouseLeave }) => {
  return (
    <li
      className={cn(
        "group relative px-8 py-4 transition-all duration-500 ease-out md:px-16",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime/50 rounded-xl",
        isBlurred ? "opacity-20 blur-custom-space-132" : "blur-0 opacity-100",
      )}
      onMouseEnter={() => onMouseEnter(uniqueIndex, cat.image)}
      onMouseLeave={onMouseLeave}
      onFocus={() => onMouseEnter(uniqueIndex, cat.image)}
      onBlur={onMouseLeave}
    >
      <h2 className="stroke-text text-custom-space-133 font-bold tracking-tighter text-transparent uppercase transition-colors duration-300 group-hover:text-foreground group-focus:text-foreground md:text-custom-space-134">
        {cat.name}{" "}
        <span className="text-brand-lime inline-block align-top text-custom-space-135">●</span>
      </h2>
    </li>
  );
});

export const Categories: React.FC<CategoriesProps> = ({ data }) => {
  const { setCursor, resetCursor } = useCursorStore();
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      const marquee = containerRef.current?.querySelector(".marquee-container");
      if (!marquee || isMobile) return;

      let resetTween: gsap.core.Tween | null = null;

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          // Cap the skew between -15 and 15 degrees
          const skewAmount = Math.max(-15, Math.min(15, velocity / -100));
          
          gsap.to(marquee, {
            skewX: skewAmount,
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });
          
          if (resetTween) resetTween.kill();
          resetTween = gsap.to(marquee, {
            skewX: 0,
            duration: 0.8,
            delay: 0.1,
            ease: "power2.out",
          });
        },
      });
    },
    { dependencies: [isMobile], scope: containerRef },
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
      className="relative w-full overflow-hidden bg-background px-4 py-32 md:px-8 content-auto"
      aria-label="Product Categories Catalogue"
    >
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-radial-primary-glow opacity-5" />

      <section
        className="flex flex-col gap-0"
        onMouseLeave={() => setHoveredIndex(null)}
        aria-label="Product categories navigation"
      >
        {/* Optimized Forward Marquee */}
        <div
          className={cn(
            "marquee-container animate-marquee flex whitespace-nowrap will-change-transform hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused] motion-reduce:animate-none",
            !isIntersecting && "[animation-play-state:paused]",
          )}
        >
          {/* Render 4 loops for seamless marquee with fewer layout shifts */}
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
                      isMobile={!!isMobile}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </ul>
            );
          })}
        </div>
      </section>
    </section>
  );
};
