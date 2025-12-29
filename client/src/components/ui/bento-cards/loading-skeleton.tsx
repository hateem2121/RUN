import { memo } from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  type?: "card" | "media" | "text";
  animated?: boolean;
}

const LoadingSkeleton = memo(function LoadingSkeleton({
  className,
  type = "card",
  animated = true,
}: LoadingSkeletonProps) {
  const baseClasses = cn(
    "bg-linear-to-r from-luxury-gray-200 via-luxury-gray-100 to-luxury-gray-200",
    "bg-[length:200%_100%]",
    animated && "animate-pulse",
    className,
  );

  if (type === "media") {
    return (
      <div className={cn(baseClasses, "h-full w-full rounded-xl")}>
        <div className="center-flex absolute inset-0">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-luxury-gray-300 border-t-luxury-gold" />
        </div>
      </div>
    );
  }

  if (type === "text") {
    return (
      <div className="space-y-3">
        <div className={cn(baseClasses, "h-6 w-3/4 rounded-md")} />
        <div className={cn(baseClasses, "h-4 w-full rounded-md")} />
        <div className={cn(baseClasses, "h-4 w-2/3 rounded-md")} />
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, "h-full w-full rounded-2xl p-6")}>
      <div className="space-y-4">
        <div className={cn(baseClasses, "h-8 w-1/2 rounded-lg")} />
        <div className={cn(baseClasses, "h-32 w-full rounded-xl")} />
        <div className="space-y-2">
          <div className={cn(baseClasses, "h-4 w-full rounded-md")} />
          <div className={cn(baseClasses, "h-4 w-3/4 rounded-md")} />
        </div>
      </div>
    </div>
  );
});

export default LoadingSkeleton;
