import { Droplets, Leaf, Recycle, Target, TreePine, Wind } from "lucide-react";
import type { JSX } from "react";

type IconSize = "sm" | "md" | "lg";

const sizeClasses: Record<IconSize, string> = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
} as const;

/**
 * Get sustainability icon component by name
 * Consolidated icon mapper for metrics, initiatives, and goals
 */
export function getSustainabilityIcon(iconName: string | null, size: IconSize = "md"): JSX.Element {
  const className = `${sizeClasses[size]} text-custom-misc-471`;

  switch (iconName) {
    case "Droplets":
      return <Droplets className={className} />;
    case "Recycle":
      return <Recycle className={className} />;
    case "TreePine":
      return <TreePine className={className} />;
    case "Wind":
      return <Wind className={className} />;
    case "Leaf":
      return <Leaf className={className} />;
    case "Target":
      return <Target className={className} />;
    default:
      return <Leaf className={className} />;
  }
}

/**
 * Calculate progress percentage for sustainability goals
 */
export function calculateGoalProgress(
  currentValue: string | null,
  targetValue: string | null,
): number {
  if (!currentValue || !targetValue) {
    return 0;
  }

  const currentNum = parseFloat(currentValue);
  const targetNum = parseFloat(targetValue);

  return targetNum > 0 ? Math.min((currentNum / targetNum) * 100, 100) : 0;
}
