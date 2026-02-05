import type React from "react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { CATEGORIES } from "./constants";
import { useStore } from "./store";
import { type CategoryItem, CursorVariant } from "./types";

interface CategoriesProps {
  data: CategoryItem[] | undefined;
}

const Categories: React.FC<CategoriesProps> = ({ data }) => {
  const setCursor = useStore((state) => state.setCursor);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isMobile = useIsMobile();

  return (
    <section
      id="catalogue"
      className="relative w-full overflow-hidden bg-background py-32"
      aria-label="Product Categories"
    >
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_50%,_var(--color-primary)_0%,_transparent_50%)] opacity-5" />

      <div className="flex flex-col gap-0" onMouseLeave={() => setHoveredIndex(null)}>
        {/* Forward Marquee */}
        <div
          role="list"
          className="animate-marquee flex whitespace-nowrap will-change-transform hover:[animation-play-state:paused] motion-reduce:[animation-play-state:paused]"
        >
          {/* Main Content */}
          {(data || CATEGORIES).map((cat, index) => {
            const isHovered = hoveredIndex === index;
            const isAnyHovered = hoveredIndex !== null;
            const isBlurred = isAnyHovered && !isHovered;

            return (
              <div
                key={`${cat.id}-${index}`}
                role="listitem"
                className={`group relative cursor-none px-8 py-4 transition-all duration-500 ease-out md:px-16 ${isBlurred ? "opacity-20 blur-[2px]" : "blur-0 opacity-100"}`}
                onMouseEnter={() => {
                  setHoveredIndex(index);
                  if (!isMobile) setCursor(CursorVariant.VIEW, "", cat.image);
                }}
                onMouseLeave={() => {
                  setCursor(CursorVariant.DEFAULT);
                }}
              >
                <h2 className="stroke-text text-[10vw] font-bold tracking-tighter text-transparent uppercase transition-colors duration-300 group-hover:text-foreground md:text-[10vw]">
                  {cat.name}{" "}
                  <span className="inline-block align-top text-[2vw] text-blue-600">●</span>
                </h2>
              </div>
            );
          })}
          {/* Duplicate Content for Marquee - Hidden from SR */}
          <div aria-hidden="true" className="flex">
            {(data || CATEGORIES).map((cat, index) => {
              // Offset index for logic
              const virtualIndex = index + 50;
              const isHovered = hoveredIndex === virtualIndex;
              const isAnyHovered = hoveredIndex !== null;
              const isBlurred = isAnyHovered && !isHovered;

              return (
                <div
                  key={`${cat.id}-dup-${index}`}
                  className={`group relative cursor-none px-8 py-4 transition-all duration-500 ease-out md:px-16 ${isBlurred ? "opacity-20 blur-[2px]" : "blur-0 opacity-100"}`}
                  onMouseEnter={() => {
                    setHoveredIndex(virtualIndex);
                    if (!isMobile) setCursor(CursorVariant.VIEW, "", cat.image);
                  }}
                  onMouseLeave={() => {
                    setCursor(CursorVariant.DEFAULT);
                  }}
                >
                  <h2 className="stroke-text text-[10vw] font-bold tracking-tighter text-transparent uppercase transition-colors duration-300 group-hover:text-foreground md:text-[10vw]">
                    {cat.name}{" "}
                    <span className="inline-block align-top text-[2vw] text-blue-600">●</span>
                  </h2>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reverse Marquee - Entirely Decorative/Redundant */}
        <div
          className="animate-marquee-reverse mt-[-2vw] flex whitespace-nowrap will-change-transform"
          aria-hidden="true"
        >
          {[...(data || CATEGORIES), ...(data || CATEGORIES)].reverse().map((cat, index) => {
            // Offset index to avoid conflict with top row state
            const uniqueIndex = index + 100;
            const isHovered = hoveredIndex === uniqueIndex;
            const isAnyHovered = hoveredIndex !== null;
            const isBlurred = isAnyHovered && !isHovered;

            return (
              <div
                key={`${cat.id}-rev-${index}`}
                className={`group relative cursor-none px-8 py-4 transition-all duration-500 ease-out md:px-16 ${isBlurred ? "opacity-20 blur-[2px]" : "blur-0 opacity-100"}`}
                onMouseEnter={() => {
                  setHoveredIndex(uniqueIndex);
                  if (!isMobile) setCursor(CursorVariant.VIEW, "", cat.image);
                }}
                onMouseLeave={() => {
                  setCursor(CursorVariant.DEFAULT);
                }}
              >
                <h2 className="stroke-text text-[10vw] font-bold tracking-tighter text-transparent uppercase transition-colors duration-300 group-hover:text-foreground md:text-[10vw]">
                  {cat.name}{" "}
                  <span className="text-success inline-block align-top text-[2vw]">●</span>
                </h2>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
