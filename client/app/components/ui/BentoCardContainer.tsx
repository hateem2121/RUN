import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardContainerProps {
  children: ReactNode;
  className?: string | undefined;
  style?: React.CSSProperties;
  autoRows?: string | undefined;
}

export function BentoCardContainer({
  children,
  className,
  style,
  autoRows,
}: BentoCardContainerProps) {
  return (
    <div
      className={cn(
        // Enhanced Responsive CSS Grid with improved proportions
        "grid gap-6",
        // Mobile: 1 column (full width stacked)
        "grid-cols-1",
        // Tablet: 2 columns (side-by-side pairs)
        "md:grid-cols-2",
        // Desktop: 3 columns (optimized bento layout)
        "lg:grid-cols-3",
        // Ensure all cards stretch to fill grid areas
        "items-stretch",
        // Responsive auto rows (CSS-first, no FOIL)
        "auto-rows-[minmax(280px,auto)] md:auto-rows-[minmax(320px,auto)]",
        // Add performance optimizations
        "bento-grid-container",
        className,
      )}
      style={{
        ...(autoRows ? { gridAutoRows: autoRows } : {}),
        // Enhanced gap for better spacing on mobile
        gap: "clamp(0.75rem, 3vw, 1.5rem)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
