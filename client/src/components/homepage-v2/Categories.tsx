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
      className="relative w-full py-32 bg-white overflow-hidden"
      aria-label="Product Categories"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5 bg-[radial-gradient(circle_at_50%_50%,_#3300FF_0%,_transparent_50%)]" />

      <div className="flex flex-col gap-0" onMouseLeave={() => setHoveredIndex(null)}>
        {/* Forward Marquee */}
        <div className="flex whitespace-nowrap animate-marquee will-change-transform">
          {/* Main Content */}
          <ul className="flex p-0 m-0 list-none">
            {categories.map((cat: { id: string; name: string; image: string }, index: number) => {
              const isHovered = hoveredIndex === index;
              const isAnyHovered = hoveredIndex !== null;
              const isBlurred = isAnyHovered && !isHovered;

              return (
                <li
                  key={`${cat.id}-${index}`}
                  className={`relative px-8 md:px-16 py-4 group cursor-none transition-all duration-500 ease-out ${
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
                    className="text-[10vw] md:text-[10vw] font-bold uppercase tracking-tighter text-transparent group-hover:text-black transition-colors duration-300"
                    style={{ WebkitTextStroke: "1px #050505" }}
                  >
                    {cat.name}{" "}
                    <span className="text-blue-600 inline-block align-top text-[2vw]">●</span>
                  </h2>
                </li>
              );
            })}
          </ul>
          {/* Duplicate Content for Marquee - Hidden from SR */}
          <ul
            aria-hidden="true"
            className="flex p-0 m-0 list-none"
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
                  className={`relative px-8 md:px-16 py-4 group cursor-none transition-all duration-500 ease-out ${
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
                    className="text-[10vw] md:text-[10vw] font-bold uppercase tracking-tighter text-transparent group-hover:text-black transition-colors duration-300"
                    style={{ WebkitTextStroke: "1px #050505" }}
                  >
                    {cat.name}{" "}
                    <span className="text-blue-600 inline-block align-top text-[2vw]">●</span>
                  </h2>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Reverse Marquee - Entirely Decorative/Redundant */}
        <div
          className="flex whitespace-nowrap animate-marquee-reverse mt-[-2vw] will-change-transform"
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
                className={`relative px-8 md:px-16 py-4 group cursor-none transition-all duration-500 ease-out ${
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
                  className="text-[10vw] md:text-[10vw] font-bold uppercase tracking-tighter text-transparent group-hover:text-black transition-colors duration-300"
                  style={{ WebkitTextStroke: "1px #050505" }}
                >
                  {cat.name}{" "}
                  <span className="text-[#CCFF00] inline-block align-top text-[2vw]">●</span>
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
