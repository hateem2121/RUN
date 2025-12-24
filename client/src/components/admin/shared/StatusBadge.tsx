import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isActive: boolean;
  activeColor?: "green" | "blue" | "purple" | "indigo";
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}

/**
 * Standardized status badge component for manufacturing management
 * Ensures consistent styling and accessibility across all components
 */
export const StatusBadge = React.memo(function StatusBadge({
  isActive,
  activeColor = "green",
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  className,
}: StatusBadgeProps) {
  const colorClasses = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };

  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 font-medium text-xs",
        isActive ? colorClasses[activeColor] : "bg-gray-100 text-gray-700",
        className,
      )}
      role="status"
      aria-label={`Status: ${isActive ? activeLabel : inactiveLabel}`}
    >
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
});
