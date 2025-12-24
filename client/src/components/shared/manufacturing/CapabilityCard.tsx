import type { ManufacturingCapability, MediaAsset } from "@shared/schema";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { analyzeContent, BentoCard, calculateGridSpan } from "@/components/ui/smart-bento-grid";
import { cn } from "@/lib/utils";
import { CardDecorator } from "./CardDecorator";
import { ManufacturingStatusIndicator } from "./ManufacturingStatusIndicator";

interface CapabilityCardProps {
  capability: ManufacturingCapability;
  index: number;
  mediaAssets: MediaAsset[];
}

export function CapabilityCard({ capability, index, mediaAssets }: CapabilityCardProps) {
  // Analyze content and calculate grid span
  const analysis = analyzeContent(capability);
  const gridSpan = calculateGridSpan(analysis, index);

  // Find media for this capability
  const capabilityMedia = capability.imageId
    ? mediaAssets.find((asset) => asset.id === capability.imageId)
    : null;

  return (
    <BentoCard gridSpan={gridSpan}>
      <Card
        className={cn(
          "group manufacturing-card-hover manufacturing-focus-glow relative h-full rounded-none",
          "border-2 border-gray-200",
        )}
      >
        <CardDecorator />

        <CardHeader className="pb-1">
          <div className="p-3">
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Settings className="size-3" />
              {capability.category || "Manufacturing Capability"}
            </span>
            <p
              className={cn(
                "manufacturing-title-underline mt-2 font-semibold leading-tight",
                gridSpan.colSpan >= 2 ? "text-xl" : "text-base",
              )}
            >
              {capability.title}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3 pt-0">
          {/* Dynamic media with optimized sizing */}
          {capabilityMedia && (
            <OptimizedImage
              mediaId={capabilityMedia.id}
              alt={capability.title || "Manufacturing Capability"}
              className="manufacturing-media-hover rounded-lg"
            />
          )}

          {capability.description && (
            <p
              className={cn(
                "line-clamp-3 text-muted-foreground",
                gridSpan.colSpan >= 2 ? "line-clamp-4 text-sm" : "text-xs",
              )}
            >
              {capability.description}
            </p>
          )}

          {/* Content based on card size */}
          <div className="space-y-2">
            {gridSpan.colSpan >= 2 && capability.capacity && (
              <ManufacturingStatusIndicator
                value={Number(capability.capacity)}
                label="Capacity"
                variant="quality"
                animate={true}
                delay={500 + index * 100}
              />
            )}

            {capability.equipment && (
              <div className="rounded bg-blue-50 p-2 text-xs">
                <p className="font-medium text-blue-700">Equipment</p>
                <p className="mt-1 line-clamp-2 text-gray-700">{capability.equipment}</p>
              </div>
            )}

            {/* Specifications - more in larger cards */}
            {capability.specifications &&
              Array.isArray(capability.specifications) &&
              capability.specifications.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-gray-500 text-xs uppercase">Specifications</p>
                  <div className="space-y-1">
                    {capability.specifications
                      .slice(0, gridSpan.colSpan >= 2 ? 6 : 3)
                      .map((spec: any, i: number) => (
                        <div key={i} className="flex justify-between text-gray-600 text-xs">
                          <span className="truncate">
                            {typeof spec === "object" ? spec.label : spec}
                          </span>
                          {typeof spec === "object" && spec.value && (
                            <span className="ml-2 font-medium">{spec.value}</span>
                          )}
                        </div>
                      ))}
                    {capability.specifications.length > (gridSpan.colSpan >= 2 ? 6 : 3) && (
                      <span className="text-blue-600 text-xs">
                        +{capability.specifications.length - (gridSpan.colSpan >= 2 ? 6 : 3)} more
                      </span>
                    )}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </BentoCard>
  );
}
