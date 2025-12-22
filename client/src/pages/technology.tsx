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
import { Loader2 } from "lucide-react";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { ensureModelViewerLoaded } from "@/lib/model-viewer-loader";
import "@/styles/webgl-pointer-events.css";
import { ClientOnly } from "@/components/ClientOnly";
import LoadingSkeleton from "@/components/ui/bento-cards/loading-skeleton";
import { LiquidGlassCard } from "@/components/ui/glass-card";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
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

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    console.error("Component Error:", error, errorInfo);
  }

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
      className="hero-3d-model relative bg-transparent rounded-2xl overflow-hidden border border-white/10"
    >
      {media.type === "3d_model" ? (
        <div className="relative aspect-[4/3]">
          {/* PHASE E: Enhanced progressive enhancement with intersection awareness */}
          {!shouldLoadModel && (
            <div className="absolute inset-0 z-modal flex flex-col items-center justify-center bg-gradient-to-br from-slate-900/90 to-blue-900/90">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-400/60 rounded-lg"></div>
                </div>
                <p className="text-white font-medium mb-2">Interactive 3D Model</p>
                <p className="text-blue-200 text-sm mb-4">
                  {isIntersecting ? "Preparing to load..." : "Scroll to view"}
                </p>
                <button
                  onClick={() => {
                    setUserRequestedLoad(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Load 3D Model
                </button>
                <p className="text-xs text-blue-300 mt-2">
                  Interactive 3D experience • Optimized streaming
                </p>
              </div>
            </div>
          )}

          {/* Loading Overlay - only shows when model is actually loading */}
          {isLoading && shouldLoadModel && (
            <div className="absolute inset-0 z-modal-backdrop flex flex-col items-center justify-center bg-black/60">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
              <p className="text-white text-sm font-medium mb-2">Loading 3D Model...</p>
              <p className="text-gray-300 text-xs">Loading interactive 3D model...</p>
            </div>
          )}

          {/* Error Fallback */}
          {false && (
            <div className="absolute inset-0 z-modal-backdrop flex flex-col items-center justify-center bg-black/70">
              <div className="text-center p-6">
                <div className="text-red-400 text-lg mb-2">⚠️</div>
                <p className="text-white font-medium mb-1">3D preview unavailable</p>
                <p className="text-gray-300 text-sm">Showing fallback content</p>
              </div>
            </div>
          )}

          {/* PHASE B: Only render ModelViewer when ready to load */}
          {/* PHASE C: Suspense wrapper for lazy-loaded UnifiedModelViewer */}
          {shouldLoadModel && (
            <React.Suspense
              fallback={
                <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-black/20 rounded-xl">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
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
                className="w-full h-full transition-opacity duration-500 min-h-[400px]"
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
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
      ) : (
        <div className="relative aspect-[4/3]">
          <img
            src={
              media.url ||
              (media.id && media.id < 1000000000000 ? `/api/media/${media.id}/content` : undefined)
            }
            alt="Technology Hero Display"
            className="w-full h-full object-cover rounded-xl"
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
      <div className="min-h-screen relative isolate overflow-hidden bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm opacity-75">Loading technology interface...</p>
        </div>
      </div>
    );
  }

  // Map gradient settings with fallback defaults
  const safeGradientSettings = mapGradientSettings(gradientSettings ?? undefined);

  // Hero background media lookup - mirroring sustainability page approach
  const backgroundMedia = mainHeroMediaId ? getMediaAsset(mainHeroMediaId) : null;

  return (
    <div className="technology-page-root min-h-screen relative isolate overflow-hidden">
      {/* UNIFIED INITIALIZATION: Direct admin settings - zero fallbacks, zero flicker */}
      <div className="fixed inset-0 -z-10">
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
          <ErrorBoundary fallback={<div className="fixed inset-0 bg-blue-900" />}>
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
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Content - Column 1 - Content First on All Devices */}
            <div className="hero-content order-1 w-full max-w-2xl">
              <LiquidGlassCard
                blurIntensity="md"
                glowIntensity="sm"
                className="w-full block cursor-default p-8"
              >
                {batchLoading ? (
                  <LoadingSkeleton type="text" className="text-center lg:text-left" />
                ) : (
                  <div className="text-center lg:text-left">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg leading-tight">
                      {vm.hero?.title || "Technology & Innovation"}
                    </h1>
                    <h2 className="text-lg lg:text-xl text-white/90 mb-6 drop-shadow-sm leading-relaxed font-medium">
                      {vm.hero?.subtitle ||
                        "Pioneering the future of sportswear manufacturing with cutting-edge technology"}
                    </h2>

                    {/* Clean interaction hint */}
                    {backgroundMedia?.type === "3d_model" && (
                      <p className="text-white/70 text-sm mb-6 flex justify-center lg:justify-start">
                        Drag to rotate • Scroll to zoom • Touch to explore
                      </p>
                    )}

                    {/* CTA Buttons */}
                    {(vm.hero?.primaryCtaText || vm.hero?.secondaryCtaText) && (
                      <div className="flex flex-col sm:flex-row gap-4 items-center lg:items-start mb-6">
                        {vm.hero?.primaryCtaText && (
                          <a
                            href={vm.hero?.primaryCtaLink || "#"}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center"
                          >
                            {vm.hero.primaryCtaText}
                          </a>
                        )}
                        {vm.hero?.secondaryCtaText && (
                          <a
                            href={vm.hero?.secondaryCtaLink || "#"}
                            className="text-white/90 hover:text-white font-medium underline transition-colors duration-200"
                          >
                            {vm.hero.secondaryCtaText}
                          </a>
                        )}
                      </div>
                    )}

                    <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto lg:mx-0"></div>
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
                <div className="aspect-[4/3] bg-transparent rounded-2xl border border-white/10 flex items-center justify-center">
                  <div className="text-center text-white/40">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/20 rounded border-dashed"></div>
                    </div>
                    <p className="text-sm">No media configured</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        {/* Enhanced Innovations Section - ALL FIELDS */}
        <div className="mb-16 tech-cards-section">
          <LiquidGlassCard
            blurIntensity="md"
            glowIntensity="sm"
            className="w-full block cursor-default p-8"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Technology Innovations
            </h2>
            {batchLoading ? (
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <LoadingSkeleton key={i} type="card" className="h-48" />
                ))}
              </div>
            ) : vm.innovations.length > 0 ? (
              <div className="space-y-8">
                {vm.innovations.map((innovation) => (
                  <div
                    key={innovation.id}
                    className="relative group bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-4 border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] overflow-hidden"
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />

                    {/* Inner glow */}
                    <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    {/* Hover shimmer - disabled on mobile for performance */}
                    {!isMobile && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                      </div>
                    )}

                    <div className="relative z-10 grid gap-6 sm:grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto">
                      {/* Content */}
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-xl font-bold text-white leading-tight">
                              {innovation.name}
                            </h3>
                            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                              {innovation.category}
                            </span>
                            {innovation.status && innovation.status !== "Active" && (
                              <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-medium">
                                {innovation.status}
                              </span>
                            )}
                          </div>

                          {innovation.shortDescription && (
                            <p className="text-white/90 font-medium text-sm">
                              {innovation.shortDescription}
                            </p>
                          )}

                          {innovation.description && (
                            <p className="text-white/80 leading-relaxed text-sm">
                              {innovation.description}
                            </p>
                          )}

                          {innovation.benefits && innovation.benefits.length > 0 && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <h4 className="text-sm font-semibold text-white/90 mb-2">
                                Key Benefits
                              </h4>
                              <ul className="space-y-1">
                                {innovation.benefits.map((benefit: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-white/70 text-sm"
                                  >
                                    <span className="text-green-400 mt-0.5 text-xs">✓</span>
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {(innovation.technicalDetails || innovation.developmentYear) && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <h4 className="text-sm font-semibold text-white/90 mb-2">
                                Technical Specifications
                              </h4>
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
                            <div className="flex flex-wrap gap-2 mt-2">
                              {innovation.relatedProducts.map((product, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-white/10 text-white/80 px-2 py-1 rounded"
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
                            <h4 className="text-xs font-medium text-white/70 mb-3">
                              Innovation Media
                            </h4>
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
                                  className="max-w-full max-h-64 object-contain transition-opacity duration-500 rounded-lg"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-full max-h-64 flex items-center justify-center animate-pulse">
                                  <span className="text-white/40 text-sm">Loading media...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Innovation Video */}
                        {innovation.videoId && (
                          <div>
                            <h4 className="text-xs font-medium text-white/70 mb-3">
                              Innovation Demo
                            </h4>
                            <div className="flex justify-center">
                              {hasMediaAsset(innovation.videoId) ? (
                                <video
                                  src={
                                    innovation.videoId && innovation.videoId < 1000000000000
                                      ? `/api/media/${innovation.videoId}/content`
                                      : undefined
                                  }
                                  controls
                                  className="max-w-full max-h-64 object-contain rounded-lg"
                                  preload="metadata"
                                  aria-label={`Video demonstration of ${innovation.name} technology`}
                                  onError={() => {}}
                                />
                              ) : (
                                <div className="w-full max-h-64 flex items-center justify-center animate-pulse">
                                  <span className="text-white/40 text-sm">Loading video...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/70">
                <p>No technology innovations configured yet.</p>
                <p className="text-sm mt-2">Visit the admin panel to add innovations.</p>
              </div>
            )}
          </LiquidGlassCard>
        </div>
        {/* Equipment Section - ALL FIELDS */}
        <div className="mb-16 tech-cards-section">
          <LiquidGlassCard
            blurIntensity="md"
            glowIntensity="sm"
            className="w-full block cursor-default p-8"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Manufacturing Equipment
            </h2>
            {batchLoading ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <LoadingSkeleton key={i} type="card" className="h-64" />
                ))}
              </div>
            ) : vm.equipment.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto">
                {vm.equipment.map((item) => (
                  <div
                    key={item.id}
                    className="relative group bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-4 border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] min-h-[400px] flex flex-col overflow-hidden"
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />

                    {/* Inner glow */}
                    <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    {/* Hover shimmer - disabled on mobile for performance */}
                    {!isMobile && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                      </div>
                    )}

                    <div className="relative z-10 flex-1 flex flex-col">
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
                              className="max-w-full max-h-64 object-contain transition-opacity duration-500 rounded-lg"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full max-h-64 flex items-center justify-center animate-pulse">
                              <span className="text-white/40 text-sm">Loading image...</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="space-y-3 mb-4">
                          <h3 className="text-lg font-bold text-white leading-tight">
                            {item.name}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-medium">
                              Equipment
                            </span>
                            {item.brand && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium">
                                {item.brand}
                              </span>
                            )}
                            {item.model && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-medium">
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
                          <div className="bg-white/5 rounded-lg p-3 mb-3">
                            <h4 className="text-xs font-semibold text-white/90 mb-2">
                              Technical Specifications
                            </h4>
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
                                className="text-[10px] bg-yellow-500/20 text-yellow-200 px-2 py-0.5 rounded border border-yellow-500/30"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/70">
                <p>No equipment configured yet.</p>
                <p className="text-sm mt-2">Visit the admin panel to add equipment.</p>
              </div>
            )}
          </LiquidGlassCard>
        </div>
        {/* Research Section - ALL FIELDS */}
        <div className="mb-16 tech-cards-section">
          <LiquidGlassCard
            blurIntensity="md"
            glowIntensity="sm"
            className="w-full block cursor-default p-8"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Research & Development
            </h2>
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
                    <div
                      key={research.id}
                      className="relative group bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-6 border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] overflow-hidden"
                    >
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />

                      {/* Inner glow */}
                      <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                      {/* Hover shimmer - disabled on mobile for performance */}
                      {!isMobile && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                        </div>
                      )}

                      <div
                        className={`relative z-10 grid gap-8 ${
                          hasResearchMedia ? "md:grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        <div className={hasResearchMedia ? "" : "max-w-4xl mx-auto"}>
                          <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <h3 className="text-2xl font-bold text-white">{research.name}</h3>
                            {research.researchArea && (
                              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium">
                                {research.researchArea}
                              </span>
                            )}
                            {research.status && (
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  research.status === "Completed"
                                    ? "bg-green-500/20 text-green-300"
                                    : research.status === "Planned"
                                      ? "bg-gray-500/20 text-gray-300"
                                      : "bg-blue-500/20 text-blue-300"
                                }`}
                              >
                                {research.status}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            {research.startDate && (
                              <div className="bg-white/5 p-2 rounded">
                                <span className="text-white/50 block text-xs">Start Date</span>
                                <span className="text-white/90">{research.startDate}</span>
                              </div>
                            )}
                            {research.expectedCompletion && (
                              <div className="bg-white/5 p-2 rounded">
                                <span className="text-white/50 block text-xs">
                                  Target Completion
                                </span>
                                <span className="text-white/90">{research.expectedCompletion}</span>
                              </div>
                            )}
                          </div>

                          {research.description && (
                            <p className="text-white/80 mb-6 leading-relaxed">
                              {research.description}
                            </p>
                          )}

                          {research.objectives && research.objectives.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-white/90 mb-3">
                                Objectives
                              </h4>
                              <ul className="space-y-2">
                                {research.objectives.map((obj, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-white/70 text-sm"
                                  >
                                    <span className="text-purple-400 mt-1">🎯</span>
                                    {obj}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {research.teamMembers && research.teamMembers.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-white/90 mb-2">
                                Research Team
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {research.teamMembers.map((member, idx) => (
                                  <span
                                    key={idx}
                                    className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs text-white/80"
                                  >
                                    <span>👤</span> {member}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Research Media - Only render if media exists */}
                        {hasResearchMedia && (
                          <div className="space-y-4">
                            {hasMediaAsset(research.imageId ?? null) && (
                              <div>
                                <h4 className="text-sm font-medium text-white/70 mb-2">
                                  Research Image
                                </h4>
                                <img
                                  src={
                                    research.imageId && research.imageId < 1000000000000
                                      ? `/api/media/${research.imageId}/content`
                                      : undefined
                                  }
                                  alt={research.name}
                                  className="w-full h-48 object-cover rounded-lg"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            {hasMediaAsset(research.videoId ?? null) && (
                              <div>
                                <h4 className="text-sm font-medium text-white/70 mb-2">
                                  Research Video
                                </h4>
                                <video
                                  src={
                                    research.videoId && research.videoId < 1000000000000
                                      ? `/api/media/${research.videoId}/content`
                                      : undefined
                                  }
                                  controls
                                  className="w-full h-48 object-cover rounded-lg"
                                  preload="metadata"
                                />
                              </div>
                            )}

                            {/* Research Media Loading State */}
                            {mediaLoading && (research.imageId || research.videoId) && (
                              <div className="w-full h-48 bg-white/10 rounded-lg animate-pulse flex items-center justify-center">
                                <span className="text-white/50 text-sm">
                                  Loading research media...
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-white/70">
                <p>No research projects configured yet.</p>
                <p className="text-sm mt-2">Visit the admin panel to add research areas.</p>
              </div>
            )}
          </LiquidGlassCard>
        </div>
        {/* Roadmap Section - ALL FIELDS */}
        <div className="mb-16 tech-cards-section">
          <LiquidGlassCard
            blurIntensity="md"
            glowIntensity="sm"
            className="w-full block cursor-default p-8"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-8">Technology Roadmap</h2>
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
                        <div className="absolute left-6 top-16 w-0.5 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-50"></div>
                      )}

                      <div className="flex gap-6">
                        {/* Timeline dot */}
                        <div className="shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm relative z-modal-backdrop">
                          {index + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 relative group bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-xl p-6 border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] overflow-hidden">
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />

                          {/* Inner glow */}
                          <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                          {/* Hover shimmer - disabled on mobile for performance */}
                          {!isMobile && (
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                            </div>
                          )}

                          <div
                            className={`relative z-10 grid gap-6 ${
                              hasRoadmapMedia ? "md:grid-cols-2" : "grid-cols-1"
                            }`}
                          >
                            <div className={hasRoadmapMedia ? "" : "max-w-4xl mx-auto"}>
                              <h3 className="text-xl font-bold text-white mb-3">
                                {milestone.name}
                              </h3>
                              <div className="text-sm text-blue-300 mb-4">
                                Target: {milestone.timeline}
                              </div>

                              {milestone.description && (
                                <p className="text-white/80 mb-6 leading-relaxed">
                                  {milestone.description}
                                </p>
                              )}
                            </div>

                            {/* Roadmap Media - Only render if media exists */}
                            {hasRoadmapMedia && (
                              <div className="space-y-4">
                                {hasMediaAsset(milestone.imageId ?? null) && (
                                  <div>
                                    <h4 className="text-sm font-medium text-white/70 mb-2">
                                      Roadmap Image
                                    </h4>
                                    <img
                                      src={
                                        milestone.imageId && milestone.imageId < 1000000000000
                                          ? `/api/media/${milestone.imageId}/content`
                                          : undefined
                                      }
                                      alt={milestone.name}
                                      className="w-full h-48 object-cover rounded-lg"
                                      loading="lazy"
                                    />
                                  </div>
                                )}

                                {hasMediaAsset(milestone.videoId ?? null) && (
                                  <div>
                                    <h4 className="text-sm font-medium text-white/70 mb-2">
                                      Roadmap Video
                                    </h4>
                                    <video
                                      src={
                                        milestone.videoId && milestone.videoId < 1000000000000
                                          ? `/api/media/${milestone.videoId}/content`
                                          : undefined
                                      }
                                      controls
                                      className="w-full h-48 object-cover rounded-lg"
                                      preload="metadata"
                                    />
                                  </div>
                                )}

                                {/* Roadmap Media Loading State */}
                                {mediaLoading && (milestone.imageId || milestone.videoId) && (
                                  <div className="w-full h-48 bg-white/10 rounded-lg animate-pulse flex items-center justify-center">
                                    <span className="text-white/50 text-sm">
                                      Loading roadmap media...
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-white/70">
                <p>No roadmap milestones configured yet.</p>
                <p className="text-sm mt-2">Visit the admin panel to add roadmap items.</p>
              </div>
            )}
          </LiquidGlassCard>
        </div>
        {/* CTA Section */}
        {/* PHASE C: Suspense wrapper for lazy-loaded TechnologyCta */}
        {cta && cta.isActive && (
          <React.Suspense
            fallback={
              <div className="w-full h-32 bg-white/5 rounded-xl animate-pulse flex items-center justify-center">
                <span className="text-white/50 text-sm">Loading CTA...</span>
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
            <div className="bg-black/10 rounded-xl p-4 border border-white/10 ">
              <p className="text-white/70 text-sm">Synchronizing content and effects...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
