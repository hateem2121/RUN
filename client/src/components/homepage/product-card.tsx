import type { MediaAsset } from "@shared/schema";
import { ArrowRight, Box } from "lucide-react";
import * as React from "react";
import { CardContent, CardHeader, LiquidGlassCard } from "@/components/ui/glass-card";
import { Button } from "../ui/button";
// CHUNK 6: Use lazy-loaded 3D viewer to reduce initial bundle by ~1MB
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";

interface ProductCardProps {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  modelUrl?: string;
  modelAsset?: MediaAsset;
  onClick?: () => void;
  className?: string;
}

export const ProductCard = React.memo(function ProductCard({
  id,
  name,
  description,
  imageUrl,
  modelUrl,
  modelAsset,
  onClick,
  className,
}: ProductCardProps) {
  return (
    <div className={className} data-testid={`product-card-${id}`}>
      <LiquidGlassCard
        blurIntensity="lg"
        glowIntensity="md"
        shadowIntensity="lg"
        borderRadius="24px"
        className="p-4 transition-transform duration-300 hover:scale-105 sm:p-6"
        onClick={onClick}
      >
        <div className="relative mb-4 aspect-square overflow-hidden rounded-xl">
          {modelAsset ? (
            <div className="relative h-full w-full">
              <LazyUnifiedModelViewer
                asset={modelAsset}
                className="h-full w-full"
                config={{
                  autoRotate: true,
                  cameraControls: true,
                  backgroundColorHex: "var(--color-neutral-900)",
                  exposure: 1.2,
                  shadowIntensity: 0.8,
                  loading: "auto",
                }}
                showControls={false}
                showLoadingProgress={true}
                showFileInfo={false}
              />
              <div
                className="absolute top-2 right-2 flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1 font-semibold text-[10px] text-white backdrop-blur-md sm:top-3 sm:right-3 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
                data-testid={`model-badge-${id}`}
              >
                <Box className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span>3D Model</span>
              </div>
            </div>
          ) : modelUrl ? (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl">
              <div className="space-y-3 text-center">
                <Box className="mx-auto h-12 w-12 text-white/60 sm:h-16 sm:w-16" />
                <p className="font-medium text-white/60 text-xs sm:text-sm">3D Model</p>
              </div>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              data-testid={`product-image-${id}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl">
              <div className="h-16 w-16 animate-pulse rounded-full bg-white/10 sm:h-24 sm:w-24" />
            </div>
          )}
        </div>

        <CardHeader title={name} subtitle={description} />

        <CardContent>
          <Button variant="glass" size="lg" className="w-full">
            Configure{" "}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardContent>
      </LiquidGlassCard>
    </div>
  );
});
