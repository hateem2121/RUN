import type { ManufacturingProcess, MediaAsset } from "@shared/schema";
import {
  Activity,
  CheckCircle2,
  Cog,
  Cpu,
  Factory,
  Gauge,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { analyzeContent, BentoGridItem, calculateGridSpan } from "@/components/ui/smart-bento-grid";
import { cn } from "@/lib/utils";
import { CardDecorator } from "./CardDecorator";
import { ManufacturingStatusIndicator } from "./ManufacturingStatusIndicator";

interface ProcessCardProps {
  process: ManufacturingProcess;
  index: number;
  mediaAssets: MediaAsset[];
}

export function ProcessCard({ process, index, mediaAssets }: ProcessCardProps) {
  const iconMap = {
    Factory,
    Cpu,
    Cog,
    Settings,
    Gauge,
    Zap,
    Shield,
    CheckCircle2,
  } as const;

  const IconComponent = iconMap[process.iconName as keyof typeof iconMap] || Factory;

  // Analyze content and calculate grid span
  const analysis = analyzeContent(process);
  const gridSpan = calculateGridSpan(analysis, index);

  // Find primary media for this process using imageId or first mediaId
  const primaryMediaId =
    process.imageId ||
    (Array.isArray(process.mediaIds) && process.mediaIds.length > 0 ? process.mediaIds[0] : null);
  const primaryMedia = primaryMediaId
    ? mediaAssets.find((asset) => asset.id === primaryMediaId)
    : null;

  return (
    <BentoGridItem gridSpan={gridSpan}>
      <Card
        className={cn(
          "group manufacturing-card-hover manufacturing-focus-glow relative h-full rounded-none",
          "border-2 border-border",
        )}
      >
        <CardDecorator />

        <CardHeader className="pb-1">
          <div className="p-3">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <IconComponent className="size-3" />
              Manufacturing Process
            </span>
            <p
              className={cn(
                "manufacturing-title-underline mt-2 font-semibold leading-tight",
                gridSpan.colSpan >= 2 ? "text-xl" : "text-base",
              )}
            >
              {process.name}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3 pt-0">
          {/* Dynamic media with optimized sizing */}
          {primaryMedia && (
            <OptimizedImage
              mediaId={primaryMedia.id}
              alt={process.name}
              className="manufacturing-media-hover rounded-lg"
            />
          )}

          {process.description && (
            <p
              className={cn(
                "line-clamp-3 text-muted-foreground",
                gridSpan.colSpan >= 2 ? "line-clamp-4 text-sm" : "text-xs",
              )}
            >
              {process.description}
            </p>
          )}

          {/* Content based on card size */}
          <div className="space-y-2">
            {gridSpan.colSpan >= 2 && process.efficiency && (
              <ManufacturingStatusIndicator
                value={process.efficiency}
                label="Efficiency"
                variant="progress"
                animate={true}
                delay={index * 200}
              />
            )}

            {process.duration && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Activity className="h-3 w-3" />
                <span>Duration: {process.duration}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </BentoGridItem>
  );
}
