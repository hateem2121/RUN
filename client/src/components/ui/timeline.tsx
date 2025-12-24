import type React from "react";
import { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, []);

  // Optimized scroll progress using Intersection Observer instead of Framer Motion
  useEffect(() => {
    if (!containerRef.current || !progressLineRef.current) return;

    const updateProgress = () => {
      if (!containerRef.current || !progressLineRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate scroll progress based on container position
      const scrollTop = window.pageYOffset;
      const containerTop = containerRect.top + scrollTop;
      const containerHeight = containerRect.height;

      const scrollStart = containerTop - windowHeight * 0.9; // start 10% from top
      const scrollEnd = containerTop + containerHeight - windowHeight * 0.5; // end 50% from top

      const progress = Math.max(
        0,
        Math.min(1, (scrollTop - scrollStart) / (scrollEnd - scrollStart)),
      );

      // Update progress line with CSS transform for better performance
      // const progressHeight = progress * height;
      progressLineRef.current.style.transform = `scaleY(${progress})`;
      progressLineRef.current.style.opacity = progress > 0.1 ? "1" : "0";
    };

    // Throttled scroll listener for better performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateProgress(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full bg-white font-sans md:px-10 dark:bg-neutral-950" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 lg:px-10">
        <h2 className="mb-4 max-w-4xl text-black text-lg md:text-4xl dark:text-white">
          Our Journey Through Time
        </h2>
        <p className="max-w-sm text-neutral-700 text-sm md:text-base dark:text-neutral-300">
          From our founding in 1889 to today, discover the milestones that shaped RUN APPAREL into a
          leading B2B sportswear manufacturer.
        </p>
      </div>

      <div ref={ref} className="relative mx-auto max-w-7xl pb-20">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:gap-10 md:pt-40">
            <div className="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
              <div className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white md:left-3 dark:bg-black">
                <div className="h-4 w-4 rounded-full border border-neutral-300 bg-neutral-200 p-2 dark:border-neutral-700 dark:bg-neutral-800" />
              </div>
              <h3 className="hidden font-bold text-neutral-500 text-xl md:block md:pl-20 md:text-5xl dark:text-neutral-500">
                {item.title}
              </h3>
            </div>

            <div className="relative w-full pr-4 pl-20 md:pl-4">
              <h3 className="mb-4 block text-left font-bold text-2xl text-neutral-500 md:hidden dark:text-neutral-500">
                {item.title}
              </h3>
              {item.content}{" "}
            </div>
          </div>
        ))}
        <div
          style={{
            height: `${height}px`,
          }}
          className="absolute top-0 left-8 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-[0%] from-transparent via-neutral-200 to-[99%] to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8 dark:via-neutral-700"
        >
          <div
            ref={progressLineRef}
            className="absolute inset-x-0 top-0 w-[2px] origin-top rounded-full bg-gradient-to-t from-[0%] from-purple-500 via-[10%] via-blue-500 to-transparent transition-all duration-300 ease-out"
            style={{
              height: `${height}px`,
              transform: "scaleY(0)",
              opacity: 0,
              willChange: "transform, opacity",
              contain: "layout style paint",
            }}
          />
        </div>
      </div>
    </div>
  );
};
