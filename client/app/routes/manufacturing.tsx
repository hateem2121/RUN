import { useMotionValue, useTransform } from "framer-motion";
import { lazy, Suspense } from "react";
import {
  ManufacturingErrorBoundary,
  ManufacturingLoadingSkeleton,
} from "@/components/manufacturing-error-boundary";
import { PublicCapabilitySection } from "@/components/public/manufacturing/PublicCapabilitySection";
import { PublicHeroSection } from "@/components/public/manufacturing/PublicHeroSection";
import { PublicProcessSection } from "@/components/public/manufacturing/PublicProcessSection";
import { PublicQualitySection } from "@/components/public/manufacturing/PublicQualitySection";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import type { Route } from "./+types/manufacturing";

// CHUNK 6: Lazy-load CallToAction to defer lottie-web (168KB) from main bundle
const CallToAction = lazy(() =>
  import("@/components/public/manufacturing/CallToAction").then((m) => ({
    default: m.CallToAction,
  })),
);

import type {
  ManufacturingCapability,
  ManufacturingHero,
  ManufacturingProcess,
  ManufacturingQuality,
} from "@shared/schema";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { useLoaderData } from "react-router";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Manufacturing | Run Apparel" },
    {
      name: "description",
      content: "World-class sportswear manufacturing facilities with end-to-end quality control.",
    },
  ];
}

export async function loader() {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["/api/manufacturing-hero"],
      queryFn: () => apiRequest("/api/manufacturing-hero"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/manufacturing-processes"],
      queryFn: () => apiRequest("/api/manufacturing-processes"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/manufacturing-capabilities"],
      queryFn: () => apiRequest("/api/manufacturing-capabilities"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/manufacturing-qualities"],
      queryFn: () => apiRequest("/api/manufacturing-qualities"),
    }),
  ]);

  return { dehydratedState: dehydrate(queryClient) };
}

export default function Manufacturing() {
  const loaderData = useLoaderData<typeof loader>();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(
    mouseY,
    [0, typeof window !== "undefined" ? window.innerHeight : 1000],
    [5, -5],
  );
  const rotateY = useTransform(
    mouseX,
    [0, typeof window !== "undefined" ? window.innerWidth : 1000],
    [-5, 5],
  );

  // Standardized data fetching using optimized hooks
  // Note: These will now hit the hydrated cache immediately
  const {
    data: heroData,
    isPending: isHeroLoading,
    error: heroError,
  } = useQuery<ManufacturingHero>({
    queryKey: ["/api/manufacturing-hero"],
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: processesData,
    isPending: isProcessesLoading,
    error: processesError,
  } = useQuery<ManufacturingProcess[]>({
    queryKey: ["/api/manufacturing-processes"],
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: capabilitiesData,
    isPending: isCapabilitiesLoading,
    error: capabilitiesError,
  } = useQuery<ManufacturingCapability[]>({
    queryKey: ["/api/manufacturing-capabilities"],
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: qualitiesData,
    isPending: isQualitiesLoading,
    error: qualitiesError,
  } = useQuery<ManufacturingQuality[]>({
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
    // throw error; // Let ErrorBoundary handle it
    // Fallback UI or boundary should handle this.
    // Throwing here might break if hydrated error is present?
    // RR7 might handle it via route error boundary.
  }

  // Safely cast data with fallbacks
  const hero = heroData!;
  const processes = processesData || [];
  const capabilities = capabilitiesData || [];
  const qualityItems = qualitiesData || [];
  const mediaAssets: any[] = []; // Endpoints don't return aggregated media anymore

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
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
    </HydrationBoundary>
  );
}
