// import React from 'react';

import {
  Award,
  Box,
  Image as ImageIcon,
  Layers,
  Link as LinkIcon,
  Tag,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RelationshipCounts {
  images: number;
  videos: number;
  accessories: number;
  certificates: number;
  relatedProducts: number;
}

interface RelationshipIndicatorsProps {
  counts: RelationshipCounts;
  hasCategory: boolean;
  hasFabric: boolean;
  has3DModel: boolean;
  compact?: boolean | undefined;
}

export function RelationshipIndicators({
  counts,
  hasCategory,
  hasFabric,
  has3DModel,
  compact = false,
}: RelationshipIndicatorsProps) {
  const indicators = [
    {
      icon: ImageIcon,
      count: counts.images,
      label: "Images",
      color: "bg-blue-100 text-blue-700",
      show: counts.images > 0,
    },
    {
      icon: Video,
      count: counts.videos,
      label: "Videos",
      color: "bg-purple-100 text-purple-700",
      show: counts.videos > 0,
    },
    {
      icon: Box,
      count: 1,
      label: "3D Model",
      color: "bg-indigo-100 text-indigo-700",
      show: has3DModel,
    },
    {
      icon: Tag,
      count: 1,
      label: "Category",
      color: "bg-green-100 text-green-700",
      show: hasCategory,
    },
    {
      icon: Layers,
      count: 1,
      label: "Fabric",
      color: "bg-orange-100 text-orange-700",
      show: hasFabric,
    },
    {
      icon: Users,
      count: counts.accessories,
      label: "Accessories",
      color: "bg-yellow-100 text-yellow-700",
      show: counts.accessories > 0,
    },
    {
      icon: Award,
      count: counts.certificates,
      label: "Certificates",
      color: "bg-emerald-100 text-emerald-700",
      show: counts.certificates > 0,
    },
    {
      icon: LinkIcon,
      count: counts.relatedProducts,
      label: "Related",
      color: "bg-muted text-foreground/80",
      show: counts.relatedProducts > 0,
    },
  ];

  const visibleIndicators = indicators.filter((indicator) => indicator.show);

  if (visibleIndicators.length === 0) {
    return <div className="text-muted-foreground/70 text-xs italic">No relationships</div>;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {visibleIndicators.slice(0, 4).map((indicator, index) => {
          const Icon = indicator.icon;
          return (
            <div
              key={index}
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${indicator.color}`}
              title={`${indicator.count} ${indicator.label}`}
            >
              <Icon className="h-3 w-3" />
              {indicator.count > 1 && <span className="ml-1 font-medium">{indicator.count}</span>}
            </div>
          );
        })}
        {visibleIndicators.length > 4 && (
          <Badge variant="outline" className="text-xs">
            +{visibleIndicators.length - 4}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {visibleIndicators.map((indicator, index) => {
        const Icon = indicator.icon;
        return (
          <Badge
            key={index}
            variant="outline"
            className={`text-xs ${indicator.color} border-current`}
          >
            <Icon className="mr-1 h-3 w-3" />
            {indicator.label}
            {indicator.count > 1 && <span className="ml-1 font-medium">({indicator.count})</span>}
          </Badge>
        );
      })}
    </div>
  );
}
