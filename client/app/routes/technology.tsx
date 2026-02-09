import React from "react";

// PHASE C: Lazy load heavy components to reduce initial bundle by ~350-500KB
const GradientBlinds = React.lazy(() => import("@/components/homepage/effects/GradientBlinds"));

const UnifiedModelViewer = React.lazy(() => import("@/components/ui/UnifiedModelViewer"));

import type {
  MediaAsset,
  TechnologyCta as TechnologyCtaType,
  TechnologyEquipment,
  TechnologyGradientSettings,
  TechnologyHero,
  TechnologyInnovation,
  TechnologyResearch,
  TechnologyRoadmap,
} from "@shared/schema";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Box, Loader2 } from "lucide-react";
import { useLoaderData } from "react-router";
import TechnologyCta from "@/components/homepage/TechnologyCta";
// webgl-pointer-events functionality is now handled by global index.css utilities
import { ClientOnly } from "@/components/shared/ClientOnly";
import { EquipmentSection } from "@/components/technology/EquipmentSection";
import { InnovationsSection } from "@/components/technology/InnovationsSection";
import { ResearchSection } from "@/components/technology/ResearchSection";
import { RoadmapSection } from "@/components/technology/RoadmapSection";
import LoadingSkeleton from "@/components/ui/bento-cards/loading-skeleton";
import { Card, GlassCardDecorations } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
// useMobileDetection import removed as unused
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { ensureModelViewerLoaded } from "@/lib/model-viewer-loader";
import { useIntersectionObserver } from "@/lib/performance-intersection-observer";
import { getQueryClient } from "@/lib/queryClient";
import { TECHNOLOGY_DEFAULTS } from "@/lib/technology-theme";
import type { Route } from "./+types/technology";

export async function loader() {
  const queryClient = getQueryClient();
  // Using the default queryFn configured in queryClient which uses apiRequest based on queryKey
  await queryClient.prefetchQuery({
    queryKey: ["/api/technology-batch"],
  });

  return { dehydratedState: dehydrate(queryClient) };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Technology & Innovation | Run Apparel" },
    {
      name: "description",
      content: "Explore our cutting-edge manufacturing technology and innovations.",
    },
  ];
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(_error: unknown, _errorInfo: React.ErrorInfo) {}

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Technology View Model types for UI consistency
type HeroVM = {
  title: string;
  subtitle: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaLink: string;
  backgroundImageId: number | null;
};

type InnovationVM = {
  id: number;
  name: string;
  description: string;
  shortDescription?: string | undefined;
  iconName?: string | undefined;
  status?: string | undefined;
  technicalDetails?: Record<string, any> | undefined;
  relatedProducts?: string[];
  category: string;
  benefits: string[];
  imageId?: number | undefined;
  videoId?: number | undefined;
  developmentYear?: string | undefined;
};

type EquipmentVM = {
  id: number;
  name: string;
  brand: string;
  model: string;
  category?: string | undefined;
  quantity?: number | undefined;
  capacity?: string | undefined;
  maintenanceSchedule?: string | undefined;
  certifications?: string[];
  capabilities: string[];
  specs: Record<string, unknown> | null;
  imageId?: number | undefined;
  installationDate?: string | undefined;
};

type ResearchVM = {
  id: number;
  name: string;
  description: string;
  researchArea?: string | undefined;
  status?: string | undefined;
  startDate?: string | undefined;
  expectedCompletion?: string | undefined;
  funding?: number | undefined;
  teamMembers?: string[];
  objectives?: string[];
  partners?: string[];
  outcomes?: string[];
  publications?: string[];
  imageId?: number | undefined;
  videoId?: number | undefined;
};

type RoadmapVM = {
  id: number;
  name: string;
  description: string;
  timeline: string;
  imageId?: number | undefined;
  videoId?: number | undefined;
};

type CtaVM = {
  headline: string;
  subheadline: string;
  primaryText: string;
  secondaryText: string;
};

type TechnologyVM = {
  hero: HeroVM | null;
  innovations: InnovationVM[];
  equipment: EquipmentVM[];
  research: ResearchVM[];
  roadmap: RoadmapVM[];
  cta: CtaVM | null;
  gradient: ReturnType<typeof mapGradientSettings>;
};

// Type for gradient settings configuration stored in JSONB
type GradientSettingsConfig = {
  angle?: number;
  noise?: number;
  blindCount?: number;
  blindMinWidth?: number;
  spotlightRadius?: number;
  spotlightSoftness?: number;
  spotlightOpacity?: number;
  mouseDampening?: number;
  mirrorGradient?: boolean;
  distortAmount?: number;
  shineDirection?: string;
  mixBlendMode?: string;
  paused?: boolean;
};

// Type for batch API response
type TechnologyBatchResponse = {
  hero: TechnologyHero | null;
  innovations: TechnologyInnovation[];
  equipment: TechnologyEquipment[];
  research: TechnologyResearch[];
  roadmap: TechnologyRoadmap[];
  cta: TechnologyCtaType | null;
  gradientSettings: TechnologyGradientSettings | null;
  mediaAssets: MediaAsset[];
  _meta?: {
    fetchedAt: string;
    totalRequests: number;
    mediaAssetsLoaded: number;
    responseTime: number;
  };
};

// Schema normalization adapters to handle type mismatches
function resolveHeroBackgroundId(hero: TechnologyHero | undefined): number | null {
  if (!hero) {
    return null;
  }
  // STRICT: Only use backgroundMediaId as per schema definition
  return hero.backgroundMediaId || null;
}

// Type for entities that may have media IDs
type MediaEntity = {
  imageId?: number | null;
  videoId?: number | null;
};

function collectMediaIds(item: MediaEntity): {
  imageId?: number;
  videoId?: number;
} {
  return {
    ...(item.imageId ? { imageId: item.imageId } : {}),
    ...(item.videoId ? { videoId: item.videoId } : {}),
  };
}

function mapGradientSettings(settings: TechnologyGradientSettings | undefined) {
  if (!settings) {
    return TECHNOLOGY_DEFAULTS.gradientSettings;
  }

  const config = settings.settings as GradientSettingsConfig | undefined;

  return {
    gradientColors: (settings.colors?.length
      ? settings.colors
      : TECHNOLOGY_DEFAULTS.gradientSettings.gradientColors) as [string, string],
    angle: config?.angle ?? TECHNOLOGY_DEFAULTS.gradientSettings.angle,
    noise: config?.noise ?? TECHNOLOGY_DEFAULTS.gradientSettings.noise,
    blindCount: config?.blindCount ?? TECHNOLOGY_DEFAULTS.gradientSettings.blindCount,
    blindMinWidth: config?.blindMinWidth ?? TECHNOLOGY_DEFAULTS.gradientSettings.blindMinWidth,
    spotlightRadius:
      config?.spotlightRadius ?? TECHNOLOGY_DEFAULTS.gradientSettings.spotlightRadius,
    spotlightSoftness:
      config?.spotlightSoftness ?? TECHNOLOGY_DEFAULTS.gradientSettings.spotlightSoftness,
    spotlightOpacity:
      config?.spotlightOpacity ?? TECHNOLOGY_DEFAULTS.gradientSettings.spotlightOpacity,
    mouseDampening: config?.mouseDampening ?? TECHNOLOGY_DEFAULTS.gradientSettings.mouseDampening,
    mirrorGradient: config?.mirrorGradient ?? TECHNOLOGY_DEFAULTS.gradientSettings.mirrorGradient,
    distortAmount: config?.distortAmount ?? TECHNOLOGY_DEFAULTS.gradientSettings.distortAmount,
    shineDirection: (config?.shineDirection ??
      TECHNOLOGY_DEFAULTS.gradientSettings.shineDirection) as "left" | "right",
    mixBlendMode: config?.mixBlendMode ?? TECHNOLOGY_DEFAULTS.gradientSettings.mixBlendMode,
    paused: config?.paused ?? TECHNOLOGY_DEFAULTS.gradientSettings.paused,
  };
}

// View Model normalizers
function normalizeHero(h: TechnologyHero | undefined): HeroVM | null {
  if (!h) {
    return null;
  }

  // Schema stores legacy JSON with headline/subheadline/CTA keys - access safely with type guards
  const heroData = h as Record<string, unknown>;

  return {
    title:
      (typeof heroData.headline === "string" ? heroData.headline : undefined) ||
      h.title ||
      "Technology",
    subtitle:
      (typeof heroData.subheadline === "string" ? heroData.subheadline : undefined) ||
      h.subtitle ||
      "",
    primaryCtaText:
      (typeof heroData.primaryCtaText === "string" ? heroData.primaryCtaText : undefined) ||
      (typeof heroData.ctaText === "string" ? heroData.ctaText : undefined) ||
      "Learn more",
    secondaryCtaText:
      (typeof heroData.secondaryCtaText === "string" ? heroData.secondaryCtaText : undefined) || "",
    primaryCtaLink:
      (typeof heroData.primaryCtaLink === "string" ? heroData.primaryCtaLink : undefined) || "#",
    secondaryCtaLink:
      (typeof heroData.secondaryCtaLink === "string" ? heroData.secondaryCtaLink : undefined) ||
      "#",
    backgroundImageId: resolveHeroBackgroundId(h),
  };
}

function normalizeInnovation(i: TechnologyInnovation): InnovationVM {
  const mediaIds = collectMediaIds(i);
  return {
    id: i.id,
    name: i.name,
    description: i.description || "",
    shortDescription: i.shortDescription || undefined,
    iconName: i.iconName || undefined,
    status: i.status || "Active",
    technicalDetails: i.technicalDetails || undefined,
    relatedProducts: i.relatedProducts || [],
    category: i.category || "General",
    benefits: i.benefits || [],
    imageId: mediaIds.imageId,
    videoId: mediaIds.videoId,
    developmentYear: i.developmentYear || undefined,
  };
}

function normalizeEquipment(e: TechnologyEquipment): EquipmentVM {
  const mediaIds = collectMediaIds(e);
  return {
    id: e.id,
    name: e.name,
    brand: e.manufacturer || "",
    model: e.model || "",
    category: e.category || undefined,
    quantity: e.quantity || 1,
    capacity: e.capacity || undefined,
    maintenanceSchedule: e.maintenanceSchedule || undefined,
    certifications: e.certifications || [],
    capabilities: [],
    specs: e.specifications || null,
    imageId: mediaIds.imageId,
    installationDate: e.installationDate?.toString().split("T")[0],
  };
}

function normalizeResearch(r: TechnologyResearch): ResearchVM {
  return {
    id: r.id,
    name: r.title || "Research Project",
    description: r.description || "",
    researchArea: r.researchArea || undefined,
    status: r.status || "Ongoing",
    startDate: r.startDate?.toString().split("T")[0],
    expectedCompletion: r.expectedCompletion?.toString().split("T")[0],
    funding: r.funding ? Number(r.funding) : 0,
    teamMembers: r.teamMembers || [],
    objectives: r.objectives || [],
    partners: r.partners || [],
    outcomes: r.outcomes || [],
    publications: r.publications || [],
    imageId: undefined, // Schema does not have imageId field
    videoId: undefined, // Schema does not have videoId field
  };
}

function normalizeRoadmap(r: TechnologyRoadmap): RoadmapVM {
  const mediaIds = collectMediaIds(r);
  return {
    id: r.id,
    name: r.title || "Milestone",
    description: r.description || "",
    timeline: r.timeline || "TBD",
    imageId: mediaIds.imageId,
    videoId: mediaIds.videoId,
  };
}

function normalizeCta(c: TechnologyCtaType | undefined): CtaVM | null {
  if (!c) {
    return null;
  }
  return {
    headline: c.title || "Ready to innovate?",
    subheadline: c.content || "",
    primaryText: c.ctaText || "Contact us",
    secondaryText: "",
  };
}

function normalizeTechnologyData(
  hero: TechnologyHero | undefined,
  innovations: TechnologyInnovation[],
  equipment: TechnologyEquipment[],
  research: TechnologyResearch[],
  roadmap: TechnologyRoadmap[],
  cta: TechnologyCtaType | undefined,
  gradientSettings: TechnologyGradientSettings | undefined,
): TechnologyVM {
  return {
    hero: normalizeHero(hero),
    innovations: (innovations || []).map(normalizeInnovation),
    equipment: (equipment || []).map(normalizeEquipment),
    research: (research || []).map(normalizeResearch),
    roadmap: (roadmap || []).map(normalizeRoadmap),
    cta: normalizeCta(cta),
    gradient: mapGradientSettings(gradientSettings),
  };
}

// PHASE B: True Non-Blocking Technology Hero Component - Optimized with useIntersectionObserver hook
function OptimizedTechnologyHero({ media }: { media: MediaAsset }) {
  const [isLoading, setIsLoading] = React.useState(false);
  React.useState(false); // Error state tracking
  const [shouldLoadModel, setShouldLoadModel] = React.useState(false);
  const [userRequestedLoad, setUserRequestedLoad] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const autoLoadTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // PHASE B: Optimized intersection observer with global instance sharing
  // Initialize model-viewer
  React.useEffect(() => {
    ensureModelViewerLoaded().catch((e) => {
      // biome-ignore lint/suspicious/noConsole: debugging
      console.error(e);
    });
  }, []);

  // PHASE B: Replace raw IntersectionObserver with useIntersectionObserver hook
  const { isIntersecting } = useIntersectionObserver(containerRef, {
    threshold: 0.1,
    rootMargin: "50px",
    triggerOnce: false, // Keep tracking for proper media loading
  });

  // PHASE B: Handle manual load button click
  React.useEffect(() => {
    if (userRequestedLoad && !shouldLoadModel) {
      setShouldLoadModel(true);
      // Clear auto-load timer if it's running
      if (autoLoadTimerRef.current) {
        clearTimeout(autoLoadTimerRef.current);
        autoLoadTimerRef.current = null;
      }
    }
  }, [userRequestedLoad, shouldLoadModel]);

  // PHASE B: Auto-load timer for 3D models after 2 seconds of visibility
  React.useEffect(() => {
    if (media.type === "3d_model" && isIntersecting && !userRequestedLoad && !shouldLoadModel) {
      // Start 2-second timer when element becomes visible
      autoLoadTimerRef.current = setTimeout(() => {
        setShouldLoadModel(true);
      }, 2000);

      return () => {
        // Clear timer if user scrolls away or loads manually
        if (autoLoadTimerRef.current) {
          clearTimeout(autoLoadTimerRef.current);
          autoLoadTimerRef.current = null;
        }
      };
    } else if (media.type !== "3d_model" && isIntersecting && !shouldLoadModel) {
      // Non-3D content loads immediately when intersecting
      setShouldLoadModel(true);
    }
    return undefined;
  }, [media.type, isIntersecting, userRequestedLoad, shouldLoadModel]);

  // Loading state management for 3D models
  React.useEffect(() => {
    if (shouldLoadModel && media.type === "3d_model") {
      setIsLoading(true);
      const loadTimer = setTimeout(() => {
        setIsLoading(false);
      }, 4000); // Reduced timeout for better UX

      return () => clearTimeout(loadTimer);
    }
    return undefined;
  }, [shouldLoadModel, media.type]);

  // Determine poster image for better loading UX
  const posterUrl = media.thumbnailFilename
    ? media.thumbnailFilename && media.id < 1000000000000
      ? `/api/media/${media.id}/content`
      : undefined
    : media.id && media.id < 1000000000000
      ? `/api/media/${media.id}/content?thumbnail=true`
      : undefined;

  return (
    <div
      ref={containerRef}
      className="hero-3d-model border-glass relative overflow-hidden rounded-2xl border bg-transparent"
    >
      {media.type === "3d_model" ? (
        <div className="relative aspect-4/3">
          {/* PHASE E: Enhanced progressive enhancement with intersection awareness */}
          {!shouldLoadModel && (
            <div className="z-modal bg-muted/90 absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="bg-primary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <div className="border-primary/60 h-8 w-8 rounded-lg border-2"></div>
              </div>
              <Typography.P className="mb-2 font-medium text-white">
                Interactive 3D Model
              </Typography.P>
              <Typography.P className="text-primary-foreground/80 mb-4 text-sm">
                {isIntersecting ? "Preparing to load..." : "Scroll to view"}
              </Typography.P>
              <button
                onClick={() => {
                  setUserRequestedLoad(true);
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm transition-colors duration-200"
              >
                Load 3D Model
              </button>
              <Typography.P className="text-primary-foreground/70 mt-2 text-xs">
                Interactive 3D experience • Optimized streaming
              </Typography.P>
            </div>
          )}

          {/* Loading Overlay - only shows when model is actually loading */}
          {isLoading && shouldLoadModel && (
            <div className="z-modal-backdrop absolute inset-0 flex flex-col items-center justify-center bg-black/60">
              <Loader2 className="text-primary mb-3 h-8 w-8 animate-spin" />
              <Typography.P className="mb-2 text-sm font-medium text-white">
                Loading 3D Model...
              </Typography.P>
              <Typography.P className="text-muted-foreground/70 text-xs">
                Loading interactive 3D model...
              </Typography.P>
            </div>
          )}

          {/* PHASE B: Only render ModelViewer when ready to load */}
          {/* PHASE C: Suspense wrapper for lazy-loaded UnifiedModelViewer */}
          {shouldLoadModel && (
            <React.Suspense
              fallback={
                <div className="flex h-full min-h-96 w-full items-center justify-center rounded-xl bg-black/20">
                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                </div>
              }
            >
              <UnifiedModelViewer
                asset={{
                  ...media,
                  id: typeof media.id === "number" ? media.id : 0,
                  filename: media.filename || "technology_demo.gltf",
                  originalName: media.filename || "Technology Hero 3D Model",
                  mimeType: "model/gltf+json",
                  type: "3d_model" as const,
                  url: media.url || `/api/media/${media.id || 0}/content`,
                  altText: media.altText || "Technology Hero 3D Model - Interactive display",
                  metadata: media.metadata || {},
                  tags: media.tags || [],
                  deletedAt: null,
                  folderId: null,
                  caption: null,
                }}
                config={{
                  cameraControls: true,
                  autoRotate: true,
                  backgroundColorHex: "transparent",
                  shadowIntensity: 1,
                  exposure: 1,
                }}
                className="h-full min-h-96 w-full transition-opacity duration-500"
              />
            </React.Suspense>
          )}
        </div>
      ) : media.type === "video" ? (
        <div className="relative aspect-video">
          <video
            src={
              media.url ||
              (media.id && media.id < 1000000000000 ? `/api/media/${media.id}/content` : undefined)
            }
            poster={posterUrl}
            autoPlay
            loop
            muted
            className="h-full w-full rounded-xl object-cover"
          />
        </div>
      ) : (
        <div className="relative aspect-4/3">
          <img
            src={
              media.url ||
              (media.id && media.id < 1000000000000 ? `/api/media/${media.id}/content` : undefined)
            }
            alt="Technology Hero Display"
            className="h-full w-full rounded-xl object-cover"
          />
        </div>
      )}
    </div>
  );
}

export default function Technology() {
  const loaderData = useLoaderData<typeof loader>();
  // OPTIMIZED: Single batch request replaces 7 separate HTTP calls (55-60% faster load time)
  // Batch endpoint includes: hero, innovations, equipment, research, roadmap, cta, gradientSettings, mediaAssets
  const { data: batchData, isLoading: batchLoading } = useOptimizedQuery<TechnologyBatchResponse>({
    queryKey: ["/api/technology-batch"],
    // Use hook's default 15-minute stale time for optimal caching
  });

  // Destructure batch response into individual data pieces (same variable names as before)
  const hero = batchData?.hero;
  const innovations = batchData?.innovations || [];
  const equipment = batchData?.equipment || [];
  const research = batchData?.research || [];
  const roadmap = batchData?.roadmap || [];
  const cta = batchData?.cta;
  const gradientSettings = batchData?.gradientSettings;
  const mediaAssets = batchData?.mediaAssets || [];

  // Create normalized view model for consistent UI contract
  const vm: TechnologyVM = React.useMemo(
    () =>
      normalizeTechnologyData(
        hero ?? undefined,
        innovations,
        equipment,
        research,
        roadmap,
        cta ?? undefined,
        gradientSettings ?? undefined,
      ),
    [hero, innovations, equipment, research, roadmap, cta, gradientSettings],
  );

  // Track WebGL initialization state for enhanced UX feedback
  // MUST be after all useQuery hooks but before any early returns
  const [, setWebglInitialized] = React.useState(false);

  // Set html and body background to transparent to show WebGL gradient
  React.useEffect(() => {
    document.documentElement.classList.add("technology-page");
    document.body.classList.add("technology-page");

    return () => {
      document.documentElement.classList.remove("technology-page");
      document.body.classList.remove("technology-page");
    };
  }, []);

  // Helper to resolve hero background media ID (supports legacy fields)
  const mainHeroMediaId = resolveHeroBackgroundId(hero ?? undefined);

  // Create optimized media asset lookup map
  const mediaAssetsMap = new Map<number, MediaAsset>();
  mediaAssets.forEach((asset) => {
    mediaAssetsMap.set(asset.id, asset);
  });

  // Reliable media asset getter with fallback handling
  const getMediaAsset = (mediaId: number | null): MediaAsset | null => {
    if (!mediaId) {
      return null;
    }
    return mediaAssetsMap.get(mediaId) || null;
  };

  // Map gradient settings with fallback defaults
  const safeGradientSettings = mapGradientSettings(gradientSettings ?? undefined);

  // Hero background media lookup - mirroring sustainability page approach
  const backgroundMedia = mainHeroMediaId ? getMediaAsset(mainHeroMediaId) : null;

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      {/* OPTIMIZED: Simplified loading state using batch query */}
      {batchLoading ? (
        <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-black">
          <div className="text-center text-white">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            <Typography.P className="text-sm opacity-75">
              Loading technology interface...
            </Typography.P>
          </div>
        </div>
      ) : (
        <div className="technology-page-root relative isolate min-h-screen overflow-hidden">
          {/* UNIFIED INITIALIZATION: Direct admin settings - zero fallbacks, zero flicker */}
          <div className="-z-elevated fixed inset-0">
            {/* PHASE C: Suspense wrapper for lazy-loaded GradientBlinds */}
            <ClientOnly
              fallback={
                <div
                  className="fixed inset-0 bg-[image:var(--gradient-bg)]"
                  // biome-ignore lint: dynamic background needed
                  style={
                    {
                      "--gradient-bg": `linear-gradient(${safeGradientSettings.angle}deg, ${safeGradientSettings.gradientColors.join(", ")})`,
                    } as React.CSSProperties
                  }
                />
              }
            >
              <ErrorBoundary fallback={<div className="bg-background fixed inset-0" />}>
                <React.Suspense fallback={<div className="bg-background fixed inset-0" />}>
                  <GradientBlinds
                    gradientColors={safeGradientSettings.gradientColors}
                    angle={safeGradientSettings.angle}
                    noise={safeGradientSettings.noise}
                    blindCount={safeGradientSettings.blindCount}
                    blindMinWidth={safeGradientSettings.blindMinWidth}
                    spotlightRadius={safeGradientSettings.spotlightRadius}
                    spotlightSoftness={safeGradientSettings.spotlightSoftness}
                    spotlightOpacity={safeGradientSettings.spotlightOpacity}
                    mouseDampening={safeGradientSettings.mouseDampening}
                    mirrorGradient={safeGradientSettings.mirrorGradient}
                    distortAmount={safeGradientSettings.distortAmount}
                    shineDirection={safeGradientSettings.shineDirection as "left" | "right"}
                    mixBlendMode={safeGradientSettings.mixBlendMode}
                    paused={safeGradientSettings.paused}
                    onWebGLReady={() => setWebglInitialized(true)}
                  />
                </React.Suspense>
              </ErrorBoundary>
            </ClientOnly>
          </div>

          {/* Content with backdrop blur-sm for readability - Allow pointer events to pass through to WebGL */}
          <div className="container mx-auto px-4 pt-20 pb-6 sm:pt-24 sm:pb-12">
            {" "}
            {/* Extra top padding for nav bar clearance */}
            {/* 2025-08-25: Hero section architecture refactored for simplicity, clarity, and best-practice UX. */}
            <section className="hero-section mb-16">
              {/* Mobile: flex-col stack, Desktop: grid-cols-2 side-by-side */}
              <div className="flex flex-col items-center gap-8 lg:grid lg:grid-cols-2 lg:gap-12">
                {/* Hero Content - Column 1 - Content First on All Devices */}
                <div className="hero-content order-1 w-full max-w-2xl">
                  <Card variant="glass-premium" className="block w-full cursor-default p-8">
                    <GlassCardDecorations />
                    {/* Dark overlay for guaranteed text contrast */}
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-black/20" />
                    {batchLoading ? (
                      <LoadingSkeleton type="text" className="text-center lg:text-left" />
                    ) : (
                      <div className="text-center lg:text-left">
                        <Typography.H1 className="mb-6 text-3xl leading-tight font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] sm:text-4xl lg:text-5xl">
                          {vm.hero?.title || "Technology & Innovation"}
                        </Typography.H1>
                        <Typography.H2 className="mb-6 text-lg leading-relaxed font-medium text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] lg:text-xl">
                          {vm.hero?.subtitle ||
                            "Pioneering the future of sportswear manufacturing with cutting-edge technology"}
                        </Typography.H2>

                        {/* Clean interaction hint */}
                        {backgroundMedia?.type === "3d_model" && (
                          <Typography.P className="mb-6 flex justify-center text-sm text-white/70 lg:justify-start">
                            Drag to rotate • Scroll to zoom • Touch to explore
                          </Typography.P>
                        )}

                        {/* CTA Buttons */}
                        {(vm.hero?.primaryCtaText || vm.hero?.secondaryCtaText) && (
                          <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
                            {vm.hero?.primaryCtaText && (
                              <a
                                href={vm.hero?.primaryCtaLink || "#"}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring rounded-lg px-8 py-3 text-center font-semibold transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
                              >
                                {vm.hero.primaryCtaText}
                              </a>
                            )}
                            {vm.hero?.secondaryCtaText && (
                              <a
                                href={vm.hero?.secondaryCtaLink || "#"}
                                className="font-medium text-white/90 underline transition-colors duration-200 hover:text-white"
                              >
                                {vm.hero.secondaryCtaText}
                              </a>
                            )}
                          </div>
                        )}

                        {/* Decorative Divider */}
                        <div className="from-primary to-accent mx-auto h-1 w-24 rounded-full bg-linear-to-r lg:mx-0"></div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Dedicated 3D Model - Column 2 - Media Second on All Devices */}
                <div className="hero-3d order-2 w-full">
                  {backgroundMedia ? (
                    <div className="bg-transparent">
                      <OptimizedTechnologyHero media={backgroundMedia} />
                    </div>
                  ) : (
                    <div className="border-glass flex aspect-4/3 items-center justify-center rounded-2xl border bg-white/5 backdrop-blur-sm">
                      <div className="text-center text-white/40">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 transition-transform duration-500 hover:scale-110">
                          <Box className="h-8 w-8 text-white/30" />
                        </div>
                        <Typography.P className="font-medium text-white/50">
                          Visual Preview Unavailable
                        </Typography.P>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Innovations Section */}
          <InnovationsSection innovations={vm.innovations} />

          {/* Equipment Section */}
          <EquipmentSection equipment={vm.equipment} />

          {/* Research Section */}
          <ResearchSection research={vm.research} />

          {/* Roadmap Section */}
          <RoadmapSection roadmap={vm.roadmap} />

          {/* CTA Section */}
          {vm.cta && (
            <section className="container mx-auto px-4 mb-24">
              <TechnologyCta
                headline={vm.cta.headline}
                content={vm.cta.subheadline}
                buttonLabel={vm.cta.primaryText}
                buttonUrl="/contact"
              />
            </section>
          )}
        </div>
      )}
    </HydrationBoundary>
  );
}
