import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Unified Skeleton Composites Library
 *
 * A consolidated set of skeleton loading components built on the base Skeleton primitive.
 * These replace scattered hardcoded skeleton implementations across the codebase.
 *
 * Usage:
 * - SkeletonCard: Product cards, feature cards, content cards
 * - SkeletonText: Text-heavy content areas with multiple lines
 * - SkeletonMedia: Images, videos, 3D models with centered icon
 * - SkeletonMetric: Dashboard stats, KPI cards
 * - SkeletonTableRow: Table row placeholders
 * - SkeletonAvatar: User avatars, profile pictures
 */

interface SkeletonCardProps {
  className?: string;
  /** Show image area at top */
  showImage?: boolean;
  /** Number of text lines to show */
  lines?: number;
}

/** Card skeleton for product cards, feature cards */
export function SkeletonCard({ className, showImage = true, lines = 2 }: SkeletonCardProps) {
  return (
    <div className={cn("space-y-3 rounded-lg border p-4", className)}>
      {showImage && <Skeleton className="h-40 w-full rounded-lg" />}
      <Skeleton className="h-5 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

interface SkeletonTextProps {
  className?: string;
  /** Number of lines */
  lines?: number;
  /** Line height class */
  lineHeight?: string;
}

/** Text skeleton for paragraphs, descriptions */
export function SkeletonText({ className, lines = 3, lineHeight = "h-4" }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(lineHeight, i === 0 ? "w-3/4" : i === lines - 1 ? "w-1/2" : "w-full")}
        />
      ))}
    </div>
  );
}

interface SkeletonMediaProps {
  className?: string;
  /** Aspect ratio (CSS aspect-ratio value) */
  aspectRatio?: string;
  /** Show loading spinner overlay */
  showSpinner?: boolean;
  /** Media type for icon */
  type?: "image" | "video" | "model";
}

/** Media skeleton for images, videos, 3D models */
export function SkeletonMedia({
  className,
  aspectRatio = "16/9",
  showSpinner = false,
  type = "image",
}: SkeletonMediaProps) {
  return (
    <div
      className={cn("relative flex items-center justify-center rounded-lg bg-muted", className)}
      style={{ aspectRatio }}
    >
      {showSpinner ? (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted-foreground/20">
          {type === "video" && (
            <svg className="h-6 w-6 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {type === "model" && (
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          )}
          {type === "image" && (
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

interface SkeletonMetricProps {
  className?: string;
  /** Show trend/change indicator */
  showTrend?: boolean;
}

/** Metric skeleton for dashboard stats, KPI cards */
export function SkeletonMetric({ className, showTrend = true }: SkeletonMetricProps) {
  return (
    <div className={cn("space-y-4 rounded-lg border p-6", className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-full" />
        {showTrend && <Skeleton className="h-6 w-12 rounded-full" />}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-8 w-1/3" />
      </div>
    </div>
  );
}

interface SkeletonTableRowProps {
  /** Number of columns */
  columns?: number;
  className?: string;
}

/** Table row skeleton */
export function SkeletonTableRow({ columns = 4, className }: SkeletonTableRowProps) {
  return (
    <tr className={cn("border-b", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

interface SkeletonAvatarProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Show name next to avatar */
  showName?: boolean;
}

/** Avatar skeleton for user profiles */
export function SkeletonAvatar({ size = "md", className, showName = false }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Skeleton className={cn("rounded-full", sizeClasses[size])} />
      {showName && (
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      )}
    </div>
  );
}

interface SkeletonGridProps {
  /** Number of items in grid */
  count?: number;
  /** Grid columns configuration */
  columns?: 1 | 2 | 3 | 4;
  /** Skeleton type for each item */
  type?: "card" | "media" | "metric";
  className?: string;
}

/** Grid of skeleton items */
export function SkeletonGrid({
  count = 6,
  columns = 3,
  type = "card",
  className,
}: SkeletonGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => {
        switch (type) {
          case "media":
            return <SkeletonMedia key={i} aspectRatio="1/1" />;
          case "metric":
            return <SkeletonMetric key={i} />;
          default:
            return <SkeletonCard key={i} />;
        }
      })}
    </div>
  );
}
