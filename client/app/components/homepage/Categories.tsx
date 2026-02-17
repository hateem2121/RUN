import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "./constants";
import { useStore } from "./store";
import { type CategoryItem, CursorVariant } from "./types";

interface CategoriesProps {
  data: CategoryItem[] | undefined;
}

const Categories: React.FC<CategoriesProps> = ({ data }) => {
  const setCursor = useStore((state) => state.setCursor);
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

  return (
    <section
      id="catalogue"
      ref={containerRef}
      className="relative w-full overflow-hidden bg-background px-4 py-32 md:px-8"
      aria-label="Product Categories Catalogue"
    >
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_50%,_var(--color-primary)_0%,_transparent_50%)] opacity-5" />

      <div className="flex flex-col gap-0" onMouseLeave={() => setHoveredIndex(null)}>
        {/* Optimized Forward Marquee */}
        <div
          className={cn(
            "animate-marquee flex whitespace-nowrap will-change-transform hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]",
            !isIntersecting && "[animation-play-state:paused]",
          )}
        >
          {/* Render 4 loops for seamless marquee with fewer layout shifts */}
          {[1, 2, 3, 4].map((loop) => {
            const isLoopHidden = loop > 1;
            return (
              <div
                key={`loop-${loop}`}
                aria-hidden={isLoopHidden}
                className="flex"
                role={isLoopHidden ? "presentation" : "list"}
              >
                {(data || CATEGORIES).map((cat, index) => {
                  const uniqueIndex = `${loop}-${index}`;
                  const isHovered = hoveredIndex === uniqueIndex;
                  const isAnyHovered = hoveredIndex !== null;
                  const isBlurred = isAnyHovered && !isHovered;

                  return (
                    <div
                      key={`${cat.id}-${uniqueIndex}`}
                      role={isLoopHidden ? "presentation" : "listitem"}
                      className={cn(
                        "group relative cursor-none px-8 py-4 transition-all duration-500 ease-out md:px-16",
                        isBlurred ? "opacity-20 blur-[2px]" : "blur-0 opacity-100",
                      )}
                      onMouseEnter={() => {
                        setHoveredIndex(uniqueIndex);
                        if (!isMobile) {
                          setCursor(CursorVariant.VIEW, "", cat.image);
                        }
                      }}
                      onMouseLeave={() => {
                        setCursor(CursorVariant.DEFAULT);
                      }}
                    >
                      <h2 className="stroke-text text-[10vw] font-bold tracking-tighter text-transparent uppercase transition-colors duration-300 group-hover:text-foreground md:text-[10vw]">
                        {cat.name}{" "}
                        <span className="text-brand-lime inline-block align-top text-[2vw]">●</span>
                      </h2>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
