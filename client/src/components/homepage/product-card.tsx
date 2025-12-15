import * as React from "react";
import { ArrowRight, Box } from "lucide-react";
import {
  LiquidGlassCard,
  LiquidButton,
  CardHeader,
  CardContent,
} from "@/components/ui/glass-card";
// CHUNK 6: Use lazy-loaded 3D viewer to reduce initial bundle by ~1MB
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import type { MediaAsset } from "@shared/schema";

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
        className="p-4 sm:p-6 hover:scale-105 transition-transform duration-300"
        onClick={onClick}
      >
        <div className="aspect-square relative overflow-hidden rounded-xl mb-4">
          {modelAsset ? (
            <div className="w-full h-full relative">
              <LazyUnifiedModelViewer
                asset={modelAsset}
                className="w-full h-full"
                config={{
                  autoRotate: true,
                  cameraControls: true,
                  backgroundColorHex: "#1e1e1e",
                  exposure: 1.2,
                  shadowIntensity: 0.8,
                  loading: "auto",
                }}
                showControls={false}
                showLoadingProgress={true}
                showFileInfo={false}
              />
              <div
                className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-semibold rounded-full flex items-center gap-1 sm:gap-1.5"
                data-testid={`model-badge-${id}`}
              >
                <Box className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>3D Model</span>
              </div>
            </div>
          ) : modelUrl ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-xl">
              <div className="text-center space-y-3">
                <Box className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-white/60" />
                <p className="text-white/60 text-xs sm:text-sm font-medium">
                  3D Model
                </p>
              </div>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              data-testid={`product-image-${id}`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-xl">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white/10 animate-pulse" />
            </div>
          )}
        </div>

        <CardHeader title={name} subtitle={description} />

        <CardContent>
          <LiquidButton
            variant="glass"
            className="w-full text-xs sm:text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            data-testid={`button-view-details-${id}`}
          >
            View Details
            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </LiquidButton>
        </CardContent>
      </LiquidGlassCard>
    </div>
  );
});
