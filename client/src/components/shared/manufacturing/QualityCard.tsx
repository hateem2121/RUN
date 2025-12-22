import type { ManufacturingQuality, MediaAsset } from "@shared/schema";
import { motion } from "framer-motion";
import { CheckCircle2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { analyzeContent, BentoCard, calculateGridSpan } from "@/components/ui/smart-bento-grid";
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
    const timer = setTimeout(() => {
      setIsChecked(true);
    }, 1000 + index * 200);

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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Shield className="size-3" />
                  {quality.category || "Quality Assurance"}
                </span>
                <p
                  className={cn(
                    "mt-2 font-semibold leading-tight manufacturing-title-underline",
                    gridSpan.colSpan >= 2 ? "text-xl" : "text-base",
                  )}
                >
                  {quality.title}
                </p>
              </div>
              {gridSpan.colSpan >= 2 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: isChecked ? 1 : 0, rotate: isChecked ? 0 : -180 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="ml-2"
                >
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </motion.div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 space-y-3">
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
                "text-muted-foreground line-clamp-3",
                gridSpan.colSpan >= 2 ? "text-sm line-clamp-4" : "text-xs",
              )}
            >
              {quality.description}
            </p>
          )}

          {/* Content based on card size */}
          <div className="space-y-2">
            {quality.standards && quality.standards.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase">Standards</p>
                <div className="flex flex-wrap gap-1">
                  {quality.standards.map((standard, idx) => (
                    <div key={idx} className="p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-700 font-medium">{standard}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quality.frequency && (
              <div className="p-2 bg-green-50 rounded text-xs">
                <p className="text-green-700 font-medium">Testing Frequency</p>
                <p className="text-gray-700 mt-1 line-clamp-2">{quality.frequency}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </BentoCard>
  );
}
