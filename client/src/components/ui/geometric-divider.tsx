import { useScroll, useTransform } from "framer-motion";
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GeometricDividerProps {
  categoryIndex?: number;
  nextCategoryName?: string;
  className?: string;
}

export function GeometricDivider({
  // categoryIndex,
  // nextCategoryName,
  className,
  // animationDelay = 0
}: GeometricDividerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Animation for line only - expands on scroll down, collapses on scroll up
  const lineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const lineOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // React state for DOM reactivity
  const [currentWidth, setCurrentWidth] = React.useState("0%");
  const [currentOpacity, setCurrentOpacity] = React.useState(0);

  // Update React state for DOM reactivity
  useEffect(() => {
    const unsubscribeWidth = lineWidth.on("change", setCurrentWidth);
    const unsubscribeOpacity = lineOpacity.on("change", setCurrentOpacity);
    return () => {
      unsubscribeWidth();
      unsubscribeOpacity();
    };
  }, [lineWidth, lineOpacity]);

  return (
    <div
      ref={containerRef}
      className={cn("relative flex items-center justify-center px-4 py-16", className)}
      style={{ willChange: "transform", position: "relative" }}
    >
      {/* Main divider line */}
      <div className="relative h-px w-full max-w-2xl">
        {/* Animated luxury line */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-px transition-all duration-300 ease-out"
            style={{
              width: currentWidth,
              opacity: currentOpacity,
              willChange: "transform",
              background:
                "linear-gradient(to right, transparent, rgba(26, 26, 26, 0.2), rgba(26, 26, 26, 0.4), rgba(26, 26, 26, 0.2), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Export as default as well for easier imports
export default GeometricDivider;
