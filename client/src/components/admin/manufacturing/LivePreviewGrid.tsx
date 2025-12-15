import React from "react";
import { cn } from "@/lib/utils";

interface LivePreviewGridProps {
  children: React.ReactNode;
  className?: string;
}

export function LivePreviewGrid({ children, className }: LivePreviewGridProps) {
  return (
    <div
      className={cn(
        "w-full h-full bg-slate-50/50 rounded-lg border border-dashed border-gray-200 p-4",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Live Preview
        </h3>
        <span className="text-xs text-muted-foreground px-2 py-1 bg-white rounded border">
          Public View Simulation
        </span>
      </div>

      {/* 
        Simulate the public grid layout.
        Using 'grid-cols-1 md:grid-cols-3' to match PublicProcessSection's likely layout 
        (SmartBentoGrid usually calculates cols based on width, but standard is often 3 or 4)
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(200px,auto)]">
        {children}
      </div>
    </div>
  );
}
