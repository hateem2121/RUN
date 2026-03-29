import type React from "react";
import { cn } from "@/lib/utils";

interface LivePreviewGridProps {
  children: React.ReactNode;
  className?: string | undefined;
}

export function LivePreviewGrid({ children, className }: LivePreviewGridProps) {
  return (
    <div
      className={cn(
        "@container h-full w-full rounded-lg border border-border border-dashed bg-slate-50/50 p-4",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wider">
          Live Preview
        </h3>
        <span className="rounded border bg-white px-2 py-1 text-muted-foreground text-xs">
          Public View Simulation
        </span>
      </div>

      {/* 
        Phase 3: Container Query Adoption
        Using @container queries for widget-based responsiveness instead of viewport queries.
        Grid now responds to its container width, not the viewport.
      */}
      <div className="grid auto-rows-[minmax(200px,auto)] @lg:grid-cols-3 @md:grid-cols-2 grid-cols-1 gap-4">
        {children}
      </div>
    </div>
  );
}
