// import React from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Factory, Loader2 } from "lucide-react";
import { useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ManufacturingLoadingStateProps {
  variant?: "card" | "skeleton" | "spinner" | "grid";
  count?: number | undefined;
  message?: string | undefined;
  className?: string | undefined;
}

/**
 * Standardized loading states for manufacturing components
 * Provides consistent loading experiences across public and admin interfaces
 */
/** @public */ export function ManufacturingLoadingState({
  variant = "skeleton",
  count = 3,
  message = "Loading manufacturing data...",
  className = "",
}: ManufacturingLoadingStateProps) {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const skeletonContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (variant === "grid" && gridContainerRef.current) {
        gsap.from(gridContainerRef.current.children, {
          opacity: 0,
          y: 20,
          duration: 0.4,
          stagger: 0.1,
        });
      }
    },
    { scope: gridContainerRef, dependencies: [variant] },
  );

  useGSAP(
    () => {
      if (variant === "skeleton" && skeletonContainerRef.current) {
        gsap.from(skeletonContainerRef.current.children, {
          opacity: 0,
          duration: 0.4,
          stagger: 0.1,
        });
      }
    },
    { scope: skeletonContainerRef, dependencies: [variant] },
  );

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div>
              <Factory className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted/20" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (variant === "spinner") {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div
        ref={gridContainerRef}
        className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}
      >
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-32 animate-pulse rounded-lg bg-muted/20" />
            <div className="space-y-2">
              <div className="h-4 animate-pulse rounded bg-muted/20" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: skeleton variant
  return (
    <div ref={skeletonContainerRef} className={`space-y-6 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded bg-muted/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-muted/20" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded bg-muted/20 px-3 py-1" />
                <div className="h-6 w-16 animate-pulse rounded bg-muted/20 px-3 py-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

/**
 * Compact loading skeleton for inline use
 */
/** @public */ export function ManufacturingInlineLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div>
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      </div>
      <span className="text-muted-foreground text-sm">Loading...</span>
    </div>
  );
}
