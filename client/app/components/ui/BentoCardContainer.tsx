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
        "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch bento-grid-container",
        "auto-rows-custom-misc-343 md:auto-rows-custom-misc-344",
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
