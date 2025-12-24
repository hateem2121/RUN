import { Droplets, Leaf, Recycle, Zap } from "lucide-react";
import { memo } from "react";
import { CircularProgressStatOptimized } from "./circular-progress-stat-optimized";

interface SustainabilityStatsProps {
  statistics?: {
    recycledMaterials: number;
    carbonReduction: number;
    renewableEnergy: number;
    waterSaved: number;
  } | null;
}

export const SustainabilityStats = memo(function SustainabilityStats({
  statistics,
}: SustainabilityStatsProps) {
  if (!statistics) return null;

  const stats = [
    {
      icon: <Recycle className="h-7 w-7 text-emerald-400" />,
      label: "Recycled Materials",
      value: statistics.recycledMaterials,
      suffix: "%",
      color: "bg-emerald-400",
      gradientId: "recycled-gradient",
      delay: 0,
    },
    {
      icon: <Leaf className="h-7 w-7 text-green-400" />,
      label: "Carbon Reduction",
      value: statistics.carbonReduction,
      suffix: "%",
      color: "bg-green-400",
      gradientId: "carbon-gradient",
      delay: 0.15,
    },
    {
      icon: <Zap className="h-7 w-7 text-yellow-400" />,
      label: "Renewable Energy",
      value: statistics.renewableEnergy,
      suffix: "%",
      color: "bg-yellow-400",
      gradientId: "energy-gradient",
      delay: 0.3,
    },
    {
      icon: <Droplets className="h-7 w-7 text-blue-400" />,
      label: "Water Saved",
      value: statistics.waterSaved,
      suffix: "%",
      color: "bg-blue-400",
      gradientId: "water-gradient",
      delay: 0.45,
    },
  ];

  return (
    <div className="mb-16 grid grid-cols-1 gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <CircularProgressStatOptimized key={index} {...stat} />
      ))}
    </div>
  );
});
