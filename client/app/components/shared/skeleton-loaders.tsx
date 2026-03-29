/**
 * Legacy Skeleton Loaders
 *
 * DEPRECATION NOTICE: These components are being replaced by the unified
 * skeleton-composites library in @/components/ui/skeleton-composites.tsx
 *
 * Use the new composites instead:
 * - MetricCardSkeleton → SkeletonMetric
 * - ProcessCardSkeleton → SkeletonCard with custom styling
 * - InnovationCardSkeleton → SkeletonCard
 * - DashboardStatSkeleton → SkeletonMetric
 * - ChartSkeleton → SkeletonMedia with aspectRatio
 * - TableRowSkeleton → SkeletonTableRow
 *
 * These exports are maintained for backward compatibility during migration.
 */

import React from "react";
import {
  SkeletonCard,
  SkeletonMedia,
  SkeletonMetric,
  SkeletonTableRow,
} from "@/components/ui/skeleton-composites";

/** @deprecated Use SkeletonMetric from @/components/ui/skeleton-composites */
export const MetricCardSkeleton = React.memo(function MetricCardSkeleton() {
  return <SkeletonMetric className="border-green-200 bg-linear-to-br from-white to-green-50" />;
});

/** @deprecated Use SkeletonCard from @/components/ui/skeleton-composites */
export const ProcessCardSkeleton = React.memo(function ProcessCardSkeleton() {
  return (
    <SkeletonCard className="border-blue-200 bg-linear-to-br from-white to-blue-50" lines={3} />
  );
});

/** @deprecated Use SkeletonCard from @/components/ui/skeleton-composites */
export const InnovationCardSkeleton = React.memo(function InnovationCardSkeleton() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-lg bg-linear-to-r from-purple-500 to-cyan-500 opacity-20 blur-xl" />
      <SkeletonCard
        className="relative border-purple-200 bg-linear-to-br from-white to-purple-50"
        lines={4}
      />
    </div>
  );
});

/** @deprecated Use SkeletonMetric from @/components/ui/skeleton-composites */
export const DashboardStatSkeleton = React.memo(function DashboardStatSkeleton() {
  return (
    <SkeletonMetric
      showTrend={false}
      className="bg-linear-to-br from-background to-muted text-center"
    />
  );
});

/** @deprecated Use SkeletonMedia from @/components/ui/skeleton-composites */
export const ChartSkeleton = React.memo(function ChartSkeleton() {
  return <SkeletonMedia aspectRatio="2/1" showSpinner className="h-96 p-8" />;
});

/** @deprecated Use SkeletonTableRow from @/components/ui/skeleton-composites */
export { SkeletonTableRow as TableRowSkeleton };
