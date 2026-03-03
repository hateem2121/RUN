import type { ManufacturingQuality, MediaAsset } from "@shared/index";
import { motion } from "framer-motion";
import { CheckCircle2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { analyzeContent, BentoGridItem, calculateGridSpan } from "@/components/ui/smart-bento-grid";
import { cn } from "@/lib/utils";
import { CardDecorator } from "./CardDecorator";

interface QualityCardProps {
  quality: ManufacturingQuality;
  index: number;
  mediaAssets: MediaAsset[];
}

export function QualityCard({ quality, index, mediaAssets }: QualityCardProps) {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setIsChecked(true);
      },
      1000 + index * 200,
    );

    return () => clearTimeout(timer);
  }, [index]);

  // Analyze content and calculate grid span
  const analysis = analyzeContent(quality);
  const gridSpan = calculateGridSpan(analysis, index);

  // Find media for this quality item
  const qualityMedia = quality.imageId
    ? mediaAssets.find((asset) => asset.id === quality.imageId)
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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Shield className="size-3" />
                  {quality.category || "Quality Assurance"}
                </span>
                <p
                  className={cn(
                    "manufacturing-title-underline mt-2 font-semibold leading-tight",
                    gridSpan.colSpan >= 2 ? "text-xl" : "text-base",
                  )}
                >
                  {quality.title}
                </p>
              </div>
              {gridSpan.colSpan >= 2 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{
                    scale: isChecked ? 1 : 0,
                    rotate: isChecked ? 0 : -180,
                  }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="ml-2"
                >
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </motion.div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3 pt-0">
          {/* Dynamic media with optimized sizing */}
          {qualityMedia && (
            <OptimizedImage
              mediaId={qualityMedia.id}
              alt={quality.title || "Quality standard"}
              className="manufacturing-media-hover rounded-lg"
            />
          )}

          {quality.description && (
            <p
              className={cn(
                "line-clamp-3 text-muted-foreground",
                gridSpan.colSpan >= 2 ? "line-clamp-4 text-sm" : "text-xs",
              )}
            >
              {quality.description}
            </p>
          )}

          {/* Content based on card size */}
          <div className="space-y-2">
            {quality.standards && quality.standards.length > 0 && (
              <div className="space-y-1">
                <p className="font-medium text-muted-foreground text-xs uppercase">Standards</p>
                <div className="flex flex-wrap gap-1">
                  {quality.standards.map((standard, idx) => (
                    <div key={idx} className="rounded bg-blue-50 p-2">
                      <p className="font-medium text-blue-700 text-xs">{standard}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quality.frequency && (
              <div className="rounded bg-green-50 p-2 text-xs">
                <p className="font-medium text-green-700">Testing Frequency</p>
                <p className="mt-1 line-clamp-2 text-foreground/80">{quality.frequency}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </BentoGridItem>
  );
}
