import { useState } from "react";
import { useCategories } from "@/hooks/use-homepage-data";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useStore } from "./store";
import { CursorVariant } from "./types";

const Categories = () => {
  const categories = useCategories(); // Dynamic Data Hook
  const setCursor = useStore((state) => state.setCursor);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <section
      id="catalogue"
      className="relative w-full overflow-hidden bg-white py-32"
      aria-label="Product Categories"
    >
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_50%,_#3300FF_0%,_transparent_50%)] opacity-5" />

      <div className="flex flex-col gap-0" onMouseLeave={() => setHoveredIndex(null)}>
        {/* Forward Marquee */}
        <div className="flex animate-marquee whitespace-nowrap will-change-transform">
          {/* Main Content */}
          <ul className="m-0 flex list-none p-0">
            {categories.map((cat: { id: string; name: string; image: string }, index: number) => {
              const isHovered = hoveredIndex === index;
              const isAnyHovered = hoveredIndex !== null;
              const isBlurred = isAnyHovered && !isHovered;

              return (
                <li
                  key={`${cat.id}-${index}`}
                  className={`group relative cursor-none px-8 py-4 transition-all duration-500 ease-out md:px-16 ${
                    isBlurred ? "opacity-20 blur-[2px]" : "opacity-100 blur-0"
                  }`}
                  onMouseEnter={() => {
                    setHoveredIndex(index);
                    if (!isMobile) setCursor(CursorVariant.VIEW, "", cat.image);
                  }}
                  onMouseLeave={() => {
                    setCursor(CursorVariant.DEFAULT);
                  }}
                >
                  <h2
                    className="font-bold text-[10vw] text-transparent uppercase tracking-tighter transition-colors duration-300 group-hover:text-black md:text-[10vw]"
                    style={{ WebkitTextStroke: "1px #050505" }}
                  >
                    {cat.name}{" "}
                    <span className="inline-block align-top text-[2vw] text-blue-600">●</span>
                  </h2>
                </li>
              );
            })}
          </ul>
          {/* Duplicate Content for Marquee - Hidden from SR */}
          <ul
            aria-hidden="true"
            className="m-0 flex list-none p-0"
            aria-label="Product categories ticker"
          >
            {categories.map((cat: { id: string; name: string; image: string }, index: number) => {
              // Offset index for logic
              const virtualIndex = index + 50;
              const isHovered = hoveredIndex === virtualIndex;
              const isAnyHovered = hoveredIndex !== null;
              const isBlurred = isAnyHovered && !isHovered;

              return (
                <li
                  key={`${cat.id}-dup-${index}`}
                  className={`group relative cursor-none px-8 py-4 transition-all duration-500 ease-out md:px-16 ${
                    isBlurred ? "opacity-20 blur-[2px]" : "opacity-100 blur-0"
                  }`}
                  onMouseEnter={() => {
                    setHoveredIndex(virtualIndex);
                    if (!isMobile) setCursor(CursorVariant.VIEW, "", cat.image);
                  }}
                  onMouseLeave={() => {
                    setCursor(CursorVariant.DEFAULT);
                  }}
                >
                  <h2
                    className="font-bold text-[10vw] text-transparent uppercase tracking-tighter transition-colors duration-300 group-hover:text-black md:text-[10vw]"
                    style={{ WebkitTextStroke: "1px #050505" }}
                  >
                    {cat.name}{" "}
                    <span className="inline-block align-top text-[2vw] text-blue-600">●</span>
                  </h2>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Reverse Marquee - Entirely Decorative/Redundant */}
        <div
          className="mt-[-2vw] flex animate-marquee-reverse whitespace-nowrap will-change-transform"
          aria-hidden="true"
        >
          {[...categories, ...categories].reverse().map((cat, index) => {
            // Offset index to avoid conflict with top row state
            const uniqueIndex = index + 100;
            const isHovered = hoveredIndex === uniqueIndex;
            const isAnyHovered = hoveredIndex !== null;
            const isBlurred = isAnyHovered && !isHovered;

            return (
              <div
                key={`${cat.id}-rev-${index}`}
                className={`group relative cursor-none px-8 py-4 transition-all duration-500 ease-out md:px-16 ${
                  isBlurred ? "opacity-20 blur-[2px]" : "opacity-100 blur-0"
                }`}
                onMouseEnter={() => {
                  setHoveredIndex(uniqueIndex);
                  if (!isMobile) setCursor(CursorVariant.VIEW, "", cat.image);
                }}
                onMouseLeave={() => {
                  setCursor(CursorVariant.DEFAULT);
                }}
              >
                <h2
                  className="font-bold text-[10vw] text-transparent uppercase tracking-tighter transition-colors duration-300 group-hover:text-black md:text-[10vw]"
                  style={{ WebkitTextStroke: "1px #050505" }}
                >
                  {cat.name}{" "}
                  <span className="inline-block align-top text-brand-lime text-[2vw]">●</span>
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
