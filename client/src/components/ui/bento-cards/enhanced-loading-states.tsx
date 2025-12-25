import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnhancedLoadingSkeletonProps {
  type: "card" | "media" | "text";
  className?: string;
  animated?: boolean;
}

export function EnhancedLoadingSkeleton({
  type,
  className,
  animated = true,
}: EnhancedLoadingSkeletonProps) {
  const baseClasses = "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg";
  const animatedClasses = animated ? "animate-pulse" : "";

  const skeletonVariants = {
    card: "h-64 w-full",
    media: "h-40 w-full",
    text: "h-4 w-3/4",
  };

  return (
    <motion.div
      className={cn(baseClasses, animatedClasses, skeletonVariants[type], className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
}

interface LoadingStateProps {
  isLoading: boolean;
  type: "card" | "media" | "text";
  children: React.ReactNode;
  className?: string;
}

export function LoadingState({ isLoading, type, children, className }: LoadingStateProps) {
  if (isLoading) {
    return <EnhancedLoadingSkeleton type={type} className={className} />;
  }

  return <>{children}</>;
}

export function CardLoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-6", className)}>
      <EnhancedLoadingSkeleton type="media" className="h-32" />
      <EnhancedLoadingSkeleton type="text" className="h-6 w-full" />
      <EnhancedLoadingSkeleton type="text" className="h-4 w-4/5" />
      <EnhancedLoadingSkeleton type="text" className="h-4 w-3/5" />
    </div>
  );
}

export function MediaLoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <EnhancedLoadingSkeleton type="media" className="h-full w-full" />
      <div className="absolute inset-0 center-flex">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      </div>
    </div>
  );
}

export function TextLoadingState({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <EnhancedLoadingSkeleton
          key={i}
          type="text"
          className={cn("h-4", i === lines - 1 ? "w-3/5" : "w-full")}
        />
      ))}
    </div>
  );
}
