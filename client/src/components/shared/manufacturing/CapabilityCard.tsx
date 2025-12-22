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
          "group relative rounded-none h-full manufacturing-card-hover manufacturing-focus-glow",
          "border-2 border-gray-200",
        )}
      >
        <CardDecorator />

        <CardHeader className="pb-1">
          <div className="p-3">
            <span className="text-muted-foreground flex items-center gap-2 text-xs">
              <Settings className="size-3" />
              {capability.category || "Manufacturing Capability"}
            </span>
            <p
              className={cn(
                "mt-2 font-semibold leading-tight manufacturing-title-underline",
                gridSpan.colSpan >= 2 ? "text-xl" : "text-base",
              )}
            >
              {capability.title}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 space-y-3">
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
                "text-muted-foreground line-clamp-3",
                gridSpan.colSpan >= 2 ? "text-sm line-clamp-4" : "text-xs",
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
              <div className="p-2 bg-blue-50 rounded text-xs">
                <p className="text-blue-700 font-medium">Equipment</p>
                <p className="text-gray-700 mt-1 line-clamp-2">{capability.equipment}</p>
              </div>
            )}

            {/* Specifications - more in larger cards */}
            {capability.specifications &&
              Array.isArray(capability.specifications) &&
              capability.specifications.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase">Specifications</p>
                  <div className="space-y-1">
                    {capability.specifications
                      .slice(0, gridSpan.colSpan >= 2 ? 6 : 3)
                      .map((spec: any, i: number) => (
                        <div key={i} className="text-xs text-gray-600 flex justify-between">
                          <span className="truncate">
                            {typeof spec === "object" ? spec.label : spec}
                          </span>
                          {typeof spec === "object" && spec.value && (
                            <span className="font-medium ml-2">{spec.value}</span>
                          )}
                        </div>
                      ))}
                    {capability.specifications.length > (gridSpan.colSpan >= 2 ? 6 : 3) && (
                      <span className="text-xs text-blue-600">
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
