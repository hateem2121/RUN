import { Suspense, lazy } from "react";

import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { useMotionValue, useTransform } from "framer-motion";
import {
  ManufacturingErrorBoundary,
  ManufacturingLoadingSkeleton,
} from "@/components/manufacturing-error-boundary";
import { PublicHeroSection } from "@/components/public/manufacturing/PublicHeroSection";
import { PublicProcessSection } from "@/components/public/manufacturing/PublicProcessSection";
import { PublicCapabilitySection } from "@/components/public/manufacturing/PublicCapabilitySection";
import { PublicQualitySection } from "@/components/public/manufacturing/PublicQualitySection";
// CHUNK 6: Lazy-load CallToAction to defer lottie-web (168KB) from main bundle
const CallToAction = lazy(() =>
  import("@/components/public/manufacturing/CallToAction").then((m) => ({
    default: m.CallToAction,
  })),
);
import type {
  ManufacturingHero,
  ManufacturingProcess,
  ManufacturingCapability,
  ManufacturingQuality,
} from "@shared/schema";

export default function Manufacturing() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [0, window.innerHeight], [5, -5]);
  const rotateY = useTransform(mouseX, [0, window.innerWidth], [-5, 5]);

  // Standardized data fetching using optimized hooks
  const {
    data: heroData,
    isPending: isHeroLoading,
    error: heroError,
  } = useOptimizedQuery<ManufacturingHero>({
    queryKey: ["/api/manufacturing-hero"],
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: processesData,
    isPending: isProcessesLoading,
    error: processesError,
  } = useOptimizedQuery<ManufacturingProcess[]>({
    queryKey: ["/api/manufacturing-processes"],
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: capabilitiesData,
    isPending: isCapabilitiesLoading,
    error: capabilitiesError,
  } = useOptimizedQuery<ManufacturingCapability[]>({
    queryKey: ["/api/manufacturing-capabilities"],
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: qualitiesData,
    isPending: isQualitiesLoading,
    error: qualitiesError,
  } = useOptimizedQuery<ManufacturingQuality[]>({
    queryKey: ["/api/manufacturing-qualities"],
    staleTime: 5 * 60 * 1000,
  });

  const isPending =
    isHeroLoading || isProcessesLoading || isCapabilitiesLoading || isQualitiesLoading;
  const error = heroError || processesError || capabilitiesError || qualitiesError;

  if (isPending) {
    return <ManufacturingLoadingSkeleton />;
  }

  if (error) {
    throw error; // Let ErrorBoundary handle it
  }

  // Safely cast data with fallbacks
  const hero = heroData!;
  const processes = processesData || [];
  const capabilities = capabilitiesData || [];
  const qualityItems = qualitiesData || [];
  const mediaAssets: any[] = []; // Endpoints don't return aggregated media anymore

  return (
    <ManufacturingErrorBoundary>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <PublicHeroSection
          mouseX={mouseX}
          mouseY={mouseY}
          rotateX={rotateX}
          rotateY={rotateY}
          mediaAssets={mediaAssets} // Note: Empty array in new pattern
          hero={hero}
        />

        {/* Processes Section */}
        <PublicProcessSection mediaAssets={mediaAssets} processes={processes} />

        {/* Capabilities Section */}
        <PublicCapabilitySection mediaAssets={mediaAssets} capabilities={capabilities} />

        {/* Quality Section */}
        <PublicQualitySection mediaAssets={mediaAssets} qualities={qualityItems} />

        {/* Call to Action - CHUNK 6: Lazy-loaded to defer lottie-web */}
        <Suspense fallback={<div className="h-24" />}>
          <CallToAction hero={hero} />
        </Suspense>
      </div>
    </ManufacturingErrorBoundary>
  );
}
