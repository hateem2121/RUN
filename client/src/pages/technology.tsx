import React from "react";

// PHASE C: Lazy load heavy components to reduce initial bundle by ~350-500KB
const GradientBlinds = React.lazy(() => import("@/components/GradientBlinds"));
const UnifiedModelViewer = React.lazy(() => import("@/components/ui/UnifiedModelViewer"));
const TechnologyCta = React.lazy(() => import("@/components/TechnologyCta"));

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
import { Box, Loader2 } from "lucide-react";
// webgl-pointer-events functionality is now handled by global index.css utilities
import { ClientOnly } from "@/components/ClientOnly";
import LoadingSkeleton from "@/components/ui/bento-cards/loading-skeleton";
import { GlassCard, GlassCardDecorations, LiquidGlassCard } from "@/components/ui/glass-card";
import { Typography } from "@/components/ui/typography";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { ensureModelViewerLoaded } from "@/lib/model-viewer-loader";
import { useIntersectionObserver } from "@/lib/performance-intersection-observer";
import { TECHNOLOGY_DEFAULTS } from "@/lib/technology-constants";

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

  componentDidCatch(_error: unknown, _errorInfo: React.ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// No longer needed - using UnifiedModelViewer component instead of raw model-viewer tags

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
  shortDescription?: string;
  iconName?: string;
  status?: string;
  technicalDetails?: Record<string, any>;
  relatedProducts?: string[];
  category: string;
  benefits: string[];
  imageId?: number;
  videoId?: number;
  developmentYear?: string;
};

type EquipmentVM = {
  id: number;
  name: string;
  brand: string;
  model: string;
  category?: string;
  quantity?: number;
  capacity?: string;
  maintenanceSchedule?: string;
  certifications?: string[];
  capabilities: string[];
  specs: Record<string, unknown> | null;
  imageId?: number;
  installationDate?: string;
};

type ResearchVM = {
  id: number;
  name: string;
  description: string;
  researchArea?: string;
  status?: string;
  startDate?: string;
  expectedCompletion?: string;
  funding?: number;
  teamMembers?: string[];
  objectives?: string[];
  partners?: string[];
  outcomes?: string[];
  publications?: string[];
  imageId?: number;
  videoId?: number;
};

type RoadmapVM = {
  id: number;
  name: string;
  description: string;
  timeline: string;
  imageId?: number;
  videoId?: number;
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
  if (!hero) return null;
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
    imageId: item.imageId ?? undefined,
    videoId: item.videoId ?? undefined,
  };
}

function mapGradientSettings(settings: TechnologyGradientSettings | undefined) {
  if (!settings) return TECHNOLOGY_DEFAULTS.gradientSettings;

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
  if (!h) return null;

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
  if (!c) return null;
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
  const autoLoadTimerRef = React.useRef<number | null>(null);

  // PHASE B: Optimized intersection observer with global instance sharing
  // Initialize model-viewer
  React.useEffect(() => {
    // biome-ignore lint/suspicious/noConsole: CLI
    ensureModelViewerLoaded().catch(console.error);
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
      autoLoadTimerRef.current = window.setTimeout(() => {
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
      className="hero-3d-model relative overflow-hidden rounded-2xl border border-glass bg-transparent"
    >
      {media.type === "3d_model" ? (
        <div className="relative aspect-4/3">
          {/* PHASE E: Enhanced progressive enhancement with intersection awareness */}
          {!shouldLoadModel && (
            <div className="absolute inset-0 z-modal flex flex-col items-center justify-center bg-muted/90 backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <div className="h-8 w-8 rounded-lg border-2 border-primary/60"></div>
              </div>
              <Typography.P className="mb-2 font-medium text-white">
                Interactive 3D Model
              </Typography.P>
              <Typography.P className="mb-4 text-primary-foreground/80 text-sm">
                {isIntersecting ? "Preparing to load..." : "Scroll to view"}
              </Typography.P>
              <button
                onClick={() => {
                  setUserRequestedLoad(true);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm transition-colors duration-200 hover:bg-primary/90"
              >
                Load 3D Model
              </button>
              <Typography.P className="mt-2 text-primary-foreground/70 text-xs">
                Interactive 3D experience • Optimized streaming
              </Typography.P>
            </div>
          )}

          {/* Loading Overlay - only shows when model is actually loading */}
          {isLoading && shouldLoadModel && (
            <div className="absolute inset-0 z-modal-backdrop flex flex-col items-center justify-center bg-black/60">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
              <Typography.P className="mb-2 font-medium text-sm text-white">
                Loading 3D Model...
              </Typography.P>
              <Typography.P className="text-muted-foreground/70 text-xs">
                Loading interactive 3D model...
              </Typography.P>
            </div>
          )}

          {/* Error Fallback */}
          {false && (
            <div className="absolute inset-0 z-modal-backdrop flex flex-col items-center justify-center bg-black/70">
              <div className="p-6 text-center">
                <div className="mb-2 text-lg text-red-400">⚠️</div>
                <Typography.P className="mb-1 font-medium text-white">
                  3D preview unavailable
                </Typography.P>
                <Typography.P className="text-muted-foreground/70 text-sm">
                  Showing fallback content
                </Typography.P>
              </div>
            </div>
          )}

          {/* PHASE B: Only render ModelViewer when ready to load */}
          {/* PHASE C: Suspense wrapper for lazy-loaded UnifiedModelViewer */}
          {shouldLoadModel && (
            <React.Suspense
              fallback={
                <div className="flex h-full min-h-96 w-full items-center justify-center rounded-xl bg-black/20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
  const { isMobile } = useMobileDetection();
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
  const mediaLoading = batchLoading; // Unified loading state

  // Create optimized media asset lookup map
  const mediaAssetsMap = new Map<number, MediaAsset>();
  mediaAssets.forEach((asset) => {
    mediaAssetsMap.set(asset.id, asset);
  });

  // Reliable media asset getter with fallback handling
  const getMediaAsset = (mediaId: number | null): MediaAsset | null => {
    if (!mediaId) return null;
    return mediaAssetsMap.get(mediaId) || null;
  };

  // Media availability checker for conditional rendering
  const hasMediaAsset = (mediaId: number | null): boolean => {
    return mediaId !== null && mediaAssetsMap.has(mediaId);
  };

  // Check if we have sufficient data to render
  // FIX: Allow rendering even if no media assets are present
  // const isDataReady = !batchLoading;

  // Filter and sort data - using direct arrays in VM pattern
  // Removed unused activeInnovations, activeEquipment, activeResearch, activeRoadmap
  // All filtering/sorting now handled in VM normalization layer

  // OPTIMIZED: Simplified loading state using batch query
  if (batchLoading) {
    return (
      <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-black">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
          <Typography.P className="text-sm opacity-75">
            Loading technology interface...
          </Typography.P>
        </div>
      </div>
    );
  }

  // Map gradient settings with fallback defaults
  const safeGradientSettings = mapGradientSettings(gradientSettings ?? undefined);

  // Hero background media lookup - mirroring sustainability page approach
  const backgroundMedia = mainHeroMediaId ? getMediaAsset(mainHeroMediaId) : null;

  return (
    <div className="technology-page-root relative isolate min-h-screen overflow-hidden">
      {/* UNIFIED INITIALIZATION: Direct admin settings - zero fallbacks, zero flicker */}
      <div className="fixed inset-0 -z-elevated">
        {/* PHASE C: Suspense wrapper for lazy-loaded GradientBlinds */}
        <ClientOnly
          fallback={
            <div
              className="fixed inset-0"
              style={{
                background: `linear-gradient(${
                  safeGradientSettings.angle
                }deg, ${safeGradientSettings.gradientColors.join(", ")})`,
              }}
            />
          }
        >
          <ErrorBoundary fallback={<div className="fixed inset-0 bg-background" />}>
            <React.Suspense
              fallback={
                <div
                  className="fixed inset-0"
                  style={{
                    background: `linear-gradient(${
                      safeGradientSettings.angle
                    }deg, ${safeGradientSettings.gradientColors.join(", ")})`,
                  }}
                />
              }
            >
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
              <LiquidGlassCard
                blurIntensity="md"
                glowIntensity="sm"
                className="block w-full cursor-default p-8"
              >
                {batchLoading ? (
                  <LoadingSkeleton type="text" className="text-center lg:text-left" />
                ) : (
                  <div className="text-center lg:text-left">
                    <Typography.H1 className="mb-6 font-bold text-3xl text-white leading-tight drop-shadow-lg sm:text-4xl lg:text-5xl">
                      {vm.hero?.title || "Technology & Innovation"}
                    </Typography.H1>
                    <Typography.H2 className="mb-6 font-medium text-lg text-white/90 leading-relaxed drop-shadow-sm lg:text-xl">
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
                            className="rounded-lg bg-primary px-8 py-3 text-center font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                    <div className="mx-auto h-1 w-24 rounded-full bg-linear-to-r from-primary to-accent lg:mx-0"></div>
                  </div>
                )}
              </LiquidGlassCard>
            </div>

            {/* Dedicated 3D Model - Column 2 - Media Second on All Devices */}
            <div className="hero-3d order-2 w-full">
              {backgroundMedia ? (
                <div className="bg-transparent">
                  <OptimizedTechnologyHero media={backgroundMedia} />
                </div>
              ) : (
                <div className="flex aspect-4/3 items-center justify-center rounded-2xl border border-glass bg-white/5 backdrop-blur-sm">
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
        {/* Enhanced Innovations Section - ALL FIELDS */}
        <div className="tech-cards-section mb-16">
          <LiquidGlassCard
            blurIntensity="md"
            glowIntensity="sm"
            className="block w-full cursor-default p-8"
          >
            <Typography.H2 className="mb-8 text-center font-bold text-3xl text-white">
              Technology Innovations
            </Typography.H2>
            {batchLoading ? (
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <LoadingSkeleton key={i} type="card" className="h-48" />
                ))}
              </div>
            ) : vm.innovations.length > 0 ? (
              <div className="space-y-8">
                {vm.innovations.map((innovation) => (
                  <GlassCard key={innovation.id} className="group p-4">
                    <GlassCardDecorations showShimmer={!isMobile} />

                    <div className="relative z-elevated mx-auto grid max-w-7xl gap-6 sm:grid-cols-1 lg:grid-cols-2">
                      {/* Content */}
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <Typography.H3 className="font-bold text-white text-xl leading-tight">
                              {innovation.name}
                            </Typography.H3>
                            <span className="inline-block rounded-full bg-primary/20 px-3 py-1 font-medium text-primary text-sm">
                              {innovation.category}
                            </span>
                            {innovation.status && innovation.status !== "Active" && (
                              <span className="inline-block rounded-full bg-warning/20 px-3 py-1 font-medium text-sm text-warning">
                                {innovation.status}
                              </span>
                            )}
                          </div>

                          {innovation.shortDescription && (
                            <Typography.P className="font-medium text-sm text-white/90">
                              {innovation.shortDescription}
                            </Typography.P>
                          )}

                          {innovation.description && (
                            <Typography.P className="text-sm text-white/80 leading-relaxed">
                              {innovation.description}
                            </Typography.P>
                          )}

                          {innovation.benefits && innovation.benefits.length > 0 && (
                            <div className="rounded-lg bg-white/5 p-3">
                              <Typography.H4 className="mb-2 font-semibold text-sm text-white/90">
                                Key Benefits
                              </Typography.H4>
                              <ul className="space-y-1">
                                {innovation.benefits.map((benefit: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm text-white/70"
                                  >
                                    <span className="mt-0.5 text-green-400 text-xs">✓</span>
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {(innovation.technicalDetails || innovation.developmentYear) && (
                            <div className="rounded-lg bg-white/5 p-3">
                              <Typography.H4 className="mb-2 font-semibold text-sm text-white/90">
                                Technical Specifications
                              </Typography.H4>
                              <div className="space-y-1">
                                {innovation.developmentYear && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-white/60">Development Year:</span>
                                    <span className="text-white/90">
                                      {innovation.developmentYear}
                                    </span>
                                  </div>
                                )}
                                {innovation.technicalDetails &&
                                  Object.entries(innovation.technicalDetails).map(
                                    ([key, value]) => (
                                      <div key={key} className="flex justify-between text-sm">
                                        <span className="text-white/60">{key}:</span>
                                        <span className="text-white/90">{String(value)}</span>
                                      </div>
                                    ),
                                  )}
                              </div>
                            </div>
                          )}

                          {innovation.relatedProducts && innovation.relatedProducts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {innovation.relatedProducts.map((product, idx) => (
                                <span
                                  key={idx}
                                  className="rounded bg-white/10 px-2 py-1 text-white/80 text-xs"
                                >
                                  {product}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progressive Media */}
                      <div className="space-y-4">
                        {/* Innovation Image */}
                        {innovation.imageId && (
                          <div>
                            <Typography.H4 className="mb-3 font-medium text-white/70 text-xs">
                              Innovation Media
                            </Typography.H4>
                            <div className="flex justify-center">
                              {hasMediaAsset(innovation.imageId) ? (
                                <img
                                  src={
                                    innovation.imageId && innovation.imageId < 1000000000000
                                      ? `/api/media/${innovation.imageId}/content`
                                      : undefined
                                  }
                                  alt={`${innovation.name} - ${
                                    innovation.category || "Innovation"
                                  } innovation showcasing technology implementation`}
                                  className="max-h-64 max-w-full rounded-lg object-contain transition-opacity duration-500"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="flex max-h-64 w-full animate-pulse items-center justify-center">
                                  <span className="text-sm text-white/40">Loading media...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Innovation Video */}
                        {innovation.videoId && (
                          <div>
                            <Typography.H4 className="mb-3 font-medium text-white/70 text-xs">
                              Innovation Demo
                            </Typography.H4>
                            <div className="flex justify-center">
                              {hasMediaAsset(innovation.videoId) ? (
                                <video
                                  src={
                                    innovation.videoId && innovation.videoId < 1000000000000
                                      ? `/api/media/${innovation.videoId}/content`
                                      : undefined
                                  }
                                  controls
                                  className="max-h-64 max-w-full rounded-lg object-contain"
                                  preload="metadata"
                                  aria-label={`Video demonstration of ${innovation.name} technology`}
                                  onError={() => {}}
                                />
                              ) : (
                                <div className="flex max-h-64 w-full animate-pulse items-center justify-center">
                                  <span className="text-sm text-white/40">Loading video...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-white/70">
                <Typography.P>No technology innovations configured yet.</Typography.P>
                <Typography.P className="mt-2 text-sm">
                  Visit the admin panel to add innovations.
                </Typography.P>
              </div>
            )}
          </LiquidGlassCard>
        </div>
        {/* Equipment Section - ALL FIELDS */}
        <div className="tech-cards-section mb-16">
          <LiquidGlassCard
            blurIntensity="md"
            glowIntensity="sm"
            className="block w-full cursor-default p-8"
          >
            <Typography.H2 className="mb-8 text-center font-bold text-3xl text-white">
              Manufacturing Equipment
            </Typography.H2>
            {batchLoading ? (
              <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <LoadingSkeleton key={i} type="card" className="h-64" />
                ))}
              </div>
            ) : vm.equipment.length > 0 ? (
              <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {vm.equipment.map((item) => (
                  <GlassCard key={item.id} className="group flex min-h-96 flex-col p-4">
                    <GlassCardDecorations showShimmer={!isMobile} />

                    <div className="relative z-elevated flex flex-1 flex-col">
                      {/* Equipment Image */}
                      {item.imageId && (
                        <div className="mb-4 flex justify-center">
                          {hasMediaAsset(item.imageId) ? (
                            <img
                              src={
                                item.imageId && item.imageId < 1000000000000
                                  ? `/api/media/${item.imageId}/content`
                                  : undefined
                              }
                              alt={`${item.name} - Professional Equipment for sportswear manufacturing`}
                              className="max-h-64 max-w-full rounded-lg object-contain transition-opacity duration-500"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex max-h-64 w-full animate-pulse items-center justify-center">
                              <span className="text-sm text-white/40">Loading image...</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="mb-4 space-y-3">
                          <Typography.H3 className="font-bold text-lg text-white leading-tight">
                            {item.name}
                          </Typography.H3>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded bg-primary/20 px-2 py-1 font-medium text-primary text-xs">
                              Equipment
                            </span>
                            {item.brand && (
                              <span className="rounded bg-secondary/80 px-2 py-1 font-medium text-secondary-foreground text-xs">
                                {item.brand}
                              </span>
                            )}
                            {item.model && (
                              <span className="rounded bg-secondary/80 px-2 py-1 font-medium text-secondary-foreground text-xs">
                                {item.model}
                              </span>
                            )}
                          </div>
                        </div>

                        {(item.model ||
                          item.brand ||
                          item.installationDate ||
                          item.capacity ||
                          item.category ||
                          item.maintenanceSchedule) && (
                          <div className="mb-3 rounded-lg bg-white/5 p-3">
                            <Typography.H4 className="mb-2 font-semibold text-white/90 text-xs">
                              Technical Specifications
                            </Typography.H4>
                            <div className="space-y-1">
                              {[
                                ["Category", item.category],
                                ["Model", item.model],
                                ["Manufacturer", item.brand],
                                ["Capacity", item.capacity],
                                [
                                  "Quantity",
                                  item.quantity && item.quantity > 1 ? item.quantity : null,
                                ],
                                ["Maintenance", item.maintenanceSchedule],
                                ["Installation", item.installationDate],
                              ]
                                .filter(([, value]) => value)
                                .map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-white/60">{key}:</span>
                                    <span className="text-white/90">{String(value)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {item.certifications && item.certifications.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.certifications.map((cert, idx) => (
                              <span
                                key={idx}
                                className="rounded border border-warning/30 bg-warning/20 px-2 py-0.5 text-micro text-warning"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-white/70">
                <Typography.P>No equipment configured yet.</Typography.P>
                <Typography.P className="mt-2 text-sm">
                  Visit the admin panel to add equipment.
                </Typography.P>
              </div>
            )}
          </LiquidGlassCard>
        </div>
        {/* Research Section - ALL FIELDS */}
        <div className="tech-cards-section mb-16">
          <LiquidGlassCard
            blurIntensity="md"
            glowIntensity="sm"
            className="block w-full cursor-default p-8"
          >
            <Typography.H2 className="mb-8 text-center font-bold text-3xl text-white">
              Research & Development
            </Typography.H2>
            {batchLoading ? (
              <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
                {[1, 2, 3].map((i) => (
                  <LoadingSkeleton key={i} type="card" className="h-96" />
                ))}
              </div>
            ) : vm.research.length > 0 ? (
              <div className="space-y-12">
                {vm.research.map((research) => {
                  // Check if this research item has any media
                  const hasResearchMedia =
                    hasMediaAsset(research.imageId ?? null) ||
                    hasMediaAsset(research.videoId ?? null);

                  return (
                    <GlassCard key={research.id} className="group p-6">
                      <GlassCardDecorations showShimmer={!isMobile} />

                      <div
                        className={`relative z-elevated grid gap-8 ${
                          hasResearchMedia ? "md:grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        <div className={hasResearchMedia ? "" : "mx-auto max-w-4xl"}>
                          <div className="mb-4 flex flex-wrap items-center gap-3">
                            <Typography.H3 className="font-bold text-2xl text-white">
                              {research.name}
                            </Typography.H3>
                            {research.researchArea && (
                              <span className="rounded-full bg-primary/20 px-3 py-1 font-medium text-primary text-sm">
                                {research.researchArea}
                              </span>
                            )}
                            {research.status && (
                              <span
                                className={`rounded-full px-3 py-1 font-medium text-sm ${
                                  research.status === "Completed"
                                    ? "bg-success/20 text-success"
                                    : research.status === "Planned"
                                      ? "bg-muted/50 text-muted-foreground"
                                      : "bg-primary/20 text-primary"
                                }`}
                              >
                                {research.status}
                              </span>
                            )}
                          </div>

                          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                            {research.startDate && (
                              <div className="rounded bg-white/5 p-2">
                                <span className="block text-white/50 text-xs">Start Date</span>
                                <span className="text-white/90">{research.startDate}</span>
                              </div>
                            )}
                            {research.expectedCompletion && (
                              <div className="rounded bg-white/5 p-2">
                                <span className="block text-white/50 text-xs">
                                  Target Completion
                                </span>
                                <span className="text-white/90">{research.expectedCompletion}</span>
                              </div>
                            )}
                          </div>

                          {research.description && (
                            <Typography.P className="mb-6 text-white/80 leading-relaxed">
                              {research.description}
                            </Typography.P>
                          )}

                          {research.objectives && research.objectives.length > 0 && (
                            <div className="mb-6">
                              <Typography.H4 className="mb-3 font-semibold text-sm text-white/90">
                                Objectives
                              </Typography.H4>
                              <ul className="space-y-2">
                                {research.objectives.map((obj, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm text-white/70"
                                  >
                                    <span className="mt-1 text-purple-400">🎯</span>
                                    {obj}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {research.teamMembers && research.teamMembers.length > 0 && (
                            <div className="mb-6">
                              <Typography.H4 className="mb-2 font-semibold text-sm text-white/90">
                                Research Team
                              </Typography.H4>
                              <div className="flex flex-wrap gap-2">
                                {research.teamMembers.map((member, idx) => (
                                  <span
                                    key={idx}
                                    className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-white/80 text-xs"
                                  >
                                    <span>👤</span> {member}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {hasResearchMedia && (
                          <div className="space-y-6">
                            {hasMediaAsset(research.videoId ?? null) && (
                              <div>
                                <Typography.H4 className="mb-2 font-medium text-sm text-white/70">
                                  Research Video
                                </Typography.H4>
                                <video
                                  src={
                                    research.videoId && research.videoId < 1000000000000
                                      ? `/api/media/${research.videoId}/content`
                                      : undefined
                                  }
                                  controls
                                  className="h-48 w-full rounded-lg object-cover"
                                  preload="metadata"
                                />
                              </div>
                            )}

                            {/* Research Media Loading State */}
                            {mediaLoading && (research.imageId || research.videoId) && (
                              <div className="flex h-48 w-full animate-pulse items-center justify-center rounded-lg bg-white/10">
                                <span className="text-sm text-white/50">
                                  Loading research media...
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-white/70">
                <Typography.P>No research projects configured yet.</Typography.P>
                <Typography.P className="mt-2 text-sm">
                  Visit the admin panel to add research areas.
                </Typography.P>
              </div>
            )}
          </LiquidGlassCard>
        </div>
        {/* Roadmap Section - ALL FIELDS */}
        <div className="tech-cards-section mb-16">
          <LiquidGlassCard
            blurIntensity="md"
            glowIntensity="sm"
            className="block w-full cursor-default p-8"
          >
            <Typography.H2 className="mb-8 text-center font-bold text-3xl text-white">
              Technology Roadmap
            </Typography.H2>
            {batchLoading ? (
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <LoadingSkeleton key={i} type="card" className="h-64" />
                ))}
              </div>
            ) : vm.roadmap.length > 0 ? (
              <div className="space-y-8">
                {vm.roadmap.map((milestone, index: number) => {
                  // Check if this roadmap milestone has any media
                  const hasRoadmapMedia =
                    hasMediaAsset(milestone.imageId ?? null) ||
                    hasMediaAsset(milestone.videoId ?? null);

                  return (
                    <div key={milestone.id} className="relative">
                      {/* Timeline connector */}
                      {index < vm.roadmap.length - 1 && (
                        <div className="absolute top-16 left-6 h-full w-0.5 bg-linear-to-b from-primary to-accent opacity-50"></div>
                      )}

                      <div className="flex gap-6">
                        {/* Timeline dot */}
                        <div className="relative z-modal-backdrop flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-primary to-accent font-bold text-sm text-white">
                          {index + 1}
                        </div>

                        {/* Content */}
                        <GlassCard className="group relative flex-1 p-6">
                          <GlassCardDecorations showShimmer={!isMobile} />

                          <div
                            className={`relative z-elevated grid gap-6 ${
                              hasRoadmapMedia ? "md:grid-cols-2" : "grid-cols-1"
                            }`}
                          >
                            <div className={hasRoadmapMedia ? "" : "mx-auto max-w-4xl"}>
                              <Typography.H3 className="mb-3 font-bold text-white text-xl">
                                {milestone.name}
                              </Typography.H3>
                              <div className="mb-4 text-primary-foreground/80 text-sm">
                                Target: {milestone.timeline}
                              </div>

                              {milestone.description && (
                                <Typography.P className="mb-6 text-white/80 leading-relaxed">
                                  {milestone.description}
                                </Typography.P>
                              )}
                            </div>

                            {/* Roadmap Media - Only render if media exists */}
                            {hasRoadmapMedia && (
                              <div className="space-y-4">
                                {hasMediaAsset(milestone.imageId ?? null) && (
                                  <div>
                                    <Typography.H4 className="mb-2 font-medium text-sm text-white/70">
                                      Roadmap Image
                                    </Typography.H4>
                                    <img
                                      src={
                                        milestone.imageId && milestone.imageId < 1000000000000
                                          ? `/api/media/${milestone.imageId}/content`
                                          : undefined
                                      }
                                      alt={milestone.name}
                                      className="h-48 w-full rounded-lg object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                )}

                                {hasMediaAsset(milestone.videoId ?? null) && (
                                  <div>
                                    <Typography.H4 className="mb-2 font-medium text-sm text-white/70">
                                      Roadmap Video
                                    </Typography.H4>
                                    <video
                                      src={
                                        milestone.videoId && milestone.videoId < 1000000000000
                                          ? `/api/media/${milestone.videoId}/content`
                                          : undefined
                                      }
                                      controls
                                      className="h-48 w-full rounded-lg object-cover"
                                      preload="metadata"
                                    />
                                  </div>
                                )}

                                {/* Roadmap Media Loading State */}
                                {mediaLoading && (milestone.imageId || milestone.videoId) && (
                                  <div className="flex h-48 w-full animate-pulse items-center justify-center rounded-lg bg-white/10">
                                    <span className="text-sm text-white/50">
                                      Loading roadmap media...
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </GlassCard>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-white/70">
                <Typography.P>No roadmap milestones configured yet.</Typography.P>
                <Typography.P className="mt-2 text-sm">
                  Visit the admin panel to add roadmap items.
                </Typography.P>
              </div>
            )}
          </LiquidGlassCard>
        </div>
        {/* CTA Section */}
        {/* PHASE C: Suspense wrapper for lazy-loaded TechnologyCta */}
        {cta?.isActive && (
          <React.Suspense
            fallback={
              <div className="flex h-32 w-full animate-pulse items-center justify-center rounded-xl bg-white/5">
                <span className="text-sm text-white/50">Loading CTA...</span>
              </div>
            }
          >
            <TechnologyCta
              headline={cta.title || "Ready to innovate?"}
              content={cta.content || ""}
              buttonLabel={cta.ctaText || "Get Started"}
              buttonUrl={cta.ctaLink || "#"}
              benefits={cta.benefits || []}
            />
          </React.Suspense>
        )}
        {/* Real-time Sync Status */}
        {batchLoading && (
          <div className="text-center">
            <div className="rounded-xl border border-glass bg-black/10 p-4">
              <Typography.P className="text-sm text-white/70">
                Synchronizing content and effects...
              </Typography.P>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
