import { memo } from "react";
import { Card } from "@/components/ui/card";

export const FloatingDockSkeleton = memo(function FloatingDockSkeleton() {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 px-4 md:px-8 lg:block lg:px-12 hidden">
      <Card
        variant="glass-premium"
        className="mx-auto flex items-center gap-2 px-14 py-5 border border-(--color-border)/50"
      >
        <div className="flex h-11 w-full items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-11 w-11 rounded-full bg-foreground/5 animate-pulse" />
              <div className="h-2.5 w-10 rounded-full bg-foreground/5 animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
});
