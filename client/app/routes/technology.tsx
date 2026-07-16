import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };

import type {
  MediaAsset,
  TechnologyCta as TechnologyCtaType,
  TechnologyEquipment,
  TechnologyHero as TechnologyHeroType,
  TechnologyInnovation,
  TechnologyResearch,
  TechnologyRoadmap,
} from "@shared/index";
// Import shared ViewModels
import type {
  CtaVM,
  EquipmentVM,
  HeroVM,
  InnovationVM,
  ResearchVM,
  RoadmapVM,
} from "@shared/viewmodels";
import React, { useRef } from "react";

// import { TechnologyErrorBoundary } from "@/components/error-boundaries/TechnologyErrorBoundary";
import { InteractiveExperienceSection } from "@/components/technology/InteractiveExperienceSection";
import { RoadAheadTimeline } from "@/components/technology/RoadAheadTimeline";
import { TechnologyStackSection } from "@/components/technology/TechnologyStackSection";
import { MarqueeStrip } from "@/components/ui/marquee-strip";
import { Typography } from "@/components/ui/typography";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Route } from "./+types/technology";

export async function loader({ request }: Route.LoaderArgs) {
  const base = new URL(request.url);
  const get = (path: string) =>
    fetch(new URL(path, base).toString())
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const batchData = await get("/api/technology-batch");

  return { batchData };
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

type TechnologyVM = {
  hero: HeroVM | null;
  innovations: InnovationVM[];
  equipment: EquipmentVM[];
  research: ResearchVM[];
  roadmap: RoadmapVM[];
  cta: CtaVM | null;
};

// Type for batch API response
type TechnologyBatchResponse = {
  hero: TechnologyHeroType | null;
  innovations: TechnologyInnovation[];
  equipment: TechnologyEquipment[];
  research: TechnologyResearch[];
  roadmap: TechnologyRoadmap[];
  cta: TechnologyCtaType | null;
  mediaAssets: MediaAsset[];

  _meta?: {
    fetchedAt: string;
    totalRequests: number;
    mediaAssetsLoaded: number;
    responseTime: number;
  };
};

function resolveHeroBackgroundId(hero: TechnologyHeroType | undefined): number | null {
  if (!hero) return null;
  return hero.backgroundMediaId || null;
}

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

function normalizeHero(h: TechnologyHeroType | undefined): HeroVM | null {
  if (!h) return null;
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
    imageId: undefined,
    videoId: undefined,
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
  hero: TechnologyHeroType | undefined,
  innovations: TechnologyInnovation[],
  equipment: TechnologyEquipment[],
  research: TechnologyResearch[],
  roadmap: TechnologyRoadmap[],
  cta: TechnologyCtaType | undefined,
): TechnologyVM {
  return {
    hero: normalizeHero(hero),
    innovations: (innovations || []).map(normalizeInnovation),
    equipment: (equipment || []).map(normalizeEquipment),
    research: (research || []).map(normalizeResearch),
    roadmap: (roadmap || []).map(normalizeRoadmap),
    cta: normalizeCta(cta),
  };
}

type LoaderData = {
  batchData: TechnologyBatchResponse | null;
};

export default function Component({ loaderData }: { loaderData: LoaderData }) {
  const { batchData } = loaderData;

  return <TechnologyInner batchData={batchData} />;
}

// Partner logos for the hero marquee
const TECH_PARTNERS = ["CLO 3D", "OPTITEX", "GERBER", "BROWZWEAR", "LECTRA"];

function TechnologyInner({ batchData }: { batchData: TechnologyBatchResponse | null }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const hero = batchData?.hero;
  const innovations = batchData?.innovations || [];
  const equipment = batchData?.equipment || [];
  const research = batchData?.research || [];
  const roadmap = batchData?.roadmap || [];
  const cta = batchData?.cta;
  const mediaAssets = batchData?.mediaAssets || [];

  const vm: TechnologyVM = React.useMemo(
    () =>
      normalizeTechnologyData(
        hero ?? undefined,
        innovations,
        equipment,
        research,
        roadmap,
        cta ?? undefined,
      ),
    [hero, innovations, equipment, research, roadmap, cta],
  );

  React.useEffect(() => {
    document.documentElement.classList.add("technology-page");
    document.body.classList.add("technology-page");

    return () => {
      document.documentElement.classList.remove("technology-page");
      document.body.classList.remove("technology-page");
    };
  }, []);

  // GSAP Animations
  useGSAP(
    () => {
      // Hero Animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1.2 } });

      tl.from(".hero-badge", { y: 20, opacity: 0, delay: 0.2 })
        .from(".hero-title span", { y: 60, opacity: 0, stagger: 0.2 }, "-=0.8")
        .from(".hero-accent", { scaleX: 0, transformOrigin: "left", opacity: 0 }, "-=0.6")
        .from(".hero-desc", { y: 20, opacity: 0 }, "-=0.8")
        .from(".hero-cta", { y: 20, opacity: 0 }, "-=0.8")
        .from(".hero-hud", { opacity: 0, stagger: 0.2 }, "-=1");

      // Scroll Reveals
      const sections = [".tech-dashboard", ".tech-stack", ".tech-roadmap", ".tech-cta"];

      sections.forEach((section) => {
        gsap.from(section, {
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none none",
          },
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "power2.out",
        });
      });
    },
    { scope: containerRef },
  );

  const mainHeroMediaId = resolveHeroBackgroundId(hero ?? undefined);
  const mediaAssetsMap = new Map<number, MediaAsset>();
  mediaAssets.forEach((asset) => {
    mediaAssetsMap.set(asset.id, asset);
  });

  const getMediaAsset = (mediaId: number | null): MediaAsset | null => {
    if (!mediaId) return null;
    return mediaAssetsMap.get(mediaId) || null;
  };

  const backgroundMedia = mainHeroMediaId ? getMediaAsset(mainHeroMediaId) : null;

  // Title formatting — split into lines for the Stitch layout
  const heroTitle = vm.hero?.title || "Where Science Meets Fabric";
  const titleWords = heroTitle.split(" ");
  // Attempt to split into: first line, gradient word, typewriter line
  // e.g. "Where" | "Science" | "Meets Fabric"
  const firstWord = titleWords.length > 0 ? titleWords[0] : "";
  const gradientWord = titleWords.length > 1 ? titleWords[1] : "";
  const typewriterText = titleWords.length > 2 ? titleWords.slice(2).join(" ") : "";

  return (
    <div
      ref={containerRef}
      className="technology-page-root relative isolate min-h-screen bg-technology-bg"
    >
      {/* Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-grid-arctic dark:bg-grid-tech opacity-30"></div>

      {/* ============================================
              HERO SECTION — Stitch Design
              ============================================ */}
      <header className="relative pt-48 pb-40 px-6 min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-to-b from-technology-bg to-technology-card dark:from-technology-bg dark:to-transparent">
        {/* HUD micro-copy top-right */}
        <div className="hero-hud absolute top-28 right-12 hidden md:flex flex-col items-end gap-1">
          <span className="micro-copy dark:text-technology-accent/70">SYS.STATUS: OPTIMAL</span>
          <span className="micro-copy dark:text-slate-600">LAT: 47.3769° N</span>
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
          {/* Version Badge */}
          <div className="hero-badge mb-12 inline-flex items-center gap-3 px-4 py-1.5 bg-white dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.08] shadow-sm rounded-full dark:backdrop-blur-xl">
            <div className="w-1.5 h-1.5 bg-technology-primary dark:bg-technology-accent rounded-full shadow-custom-misc-482 dark:shadow-custom-misc-483 dark:animate-pulse"></div>
            <span className="text-custom-space-310 font-mono font-bold text-technology-primary dark:text-technology-accent tracking-widest uppercase">
              Version 2.04 Stable
            </span>
          </div>

          {/* Title Block */}
          <div className="hero-title flex flex-col items-center mb-12 space-y-4">
            <Typography.H1 className="text-7xl md:text-display-lg lg:text-display-xl font-neue-stance font-bold text-black dark:text-white leading-custom-misc-484 tracking-tight uppercase flex flex-col items-center">
              {firstWord && (
                <span className="block text-slate-900 dark:text-white opacity-90">{firstWord}</span>
              )}
              {gradientWord && (
                <span className="bg-clip-text text-transparent py-2 bg-gradient-to-br from-technology-primary to-technology-primary/80 dark:from-technology-accent dark:to-technology-accent/70">
                  {gradientWord}
                </span>
              )}
              {typewriterText && (
                <div className="typewriter-text text-black dark:text-white mt-4 text-4xl md:text-6xl tracking-widest opacity-80 dark:font-light">
                  {typewriterText}
                </div>
              )}
            </Typography.H1>
          </div>

          {/* Cobalt/Cyan accent bar */}
          <div className="hero-accent h-1.5 w-24 bg-technology-primary dark:bg-technology-accent mb-14 shadow-sm dark:shadow-custom-misc-485"></div>

          {/* Subtitle */}
          <Typography.P className="hero-desc text-base md:text-xl text-technology-body font-normal leading-relaxed max-w-2xl mb-16 tracking-wide font-helvetica">
            {vm.hero?.subtitle ||
              "Engineering the next generation of athletic skin. We go beyond textiles, diving deep into biotechnology to enhance human performance through reactive materials."}
          </Typography.P>

          {/* CTA Button */}
          <div className="hero-cta flex justify-center group">
            <a
              href={vm.hero?.primaryCtaLink || "#"}
              className="px-12 py-5 bg-technology-primary dark:bg-technology-accent text-white dark:text-black font-bold uppercase tracking-custom-misc-486 text-custom-space-311 shadow-custom-misc-487 dark:shadow-custom-misc-488 hover:shadow-custom-misc-489 dark:hover:shadow-custom-misc-490 dark:hover:bg-white transition-all duration-500 flex items-center gap-4"
            >
              {vm.hero?.primaryCtaText || "Explore Our Innovations"}
              <span className="material-symbols-outlined text-base group-hover:translate-y-1 transition-transform">
                arrow_downward
              </span>
            </a>
          </div>
        </div>

        {/* HUD micro-copy bottom-left */}
        <div className="hero-hud absolute bottom-10 left-12 hidden md:block">
          <span className="micro-copy dark:text-technology-accent/70">UPTIME: 99.99%</span>
        </div>

        {/* Partner Marquee Bar — bottom of hero */}
        <div className="absolute bottom-0 left-0 w-full border-t border-slate-100 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl h-28 flex items-center overflow-hidden z-20">
          <div className="flex whitespace-nowrap w-full opacity-40 dark:opacity-60 hover:opacity-100 transition-opacity duration-700">
            {[0, 1].map((set) => (
              <div key={set} className="flex items-center gap-24 mx-12 animate-marquee">
                {TECH_PARTNERS.map((partner) => (
                  <span
                    key={`${set}-${partner}`}
                    className="text-xl md:text-2xl font-neue-stance text-technology-head dark:text-technology-body font-bold tracking-tighter dark:opacity-70"
                  >
                    {partner}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main>
        {/* Cyan Scrolling Marquee Strip */}
        <MarqueeStrip
          text="INNOVATION • 3D DESIGN • SMART TEXTILES • R&D • BIOMECHANICS • COMPUTATIONAL ANALYSIS"
          accentColor="var(--color-technology-accent)"
        />

        {/* Technical Analysis Dashboard */}
        <div className="tech-dashboard">
          <InteractiveExperienceSection media={backgroundMedia} />
        </div>

        {/* Technology Stack */}
        <div className="tech-stack">
          <TechnologyStackSection
            innovations={vm.innovations}
            equipment={vm.equipment}
            mediaAssets={mediaAssetsMap}
          />
        </div>

        {/* Road Ahead Timeline */}
        <div className="tech-roadmap">
          <RoadAheadTimeline roadmap={vm.roadmap} research={vm.research} />
        </div>

        {/* ============================================
                CTA SECTION — Stitch Design
                ============================================ */}
        {vm.cta && (
          <section className="tech-cta py-48 px-6 relative overflow-hidden flex items-center justify-center border-t border-slate-100 dark:border-white/[0.08] bg-technology-card dark:bg-technology-bg">
            <div className="absolute inset-0 bg-grid-arctic dark:bg-grid-tech opacity-30 dark:opacity-20 z-0"></div>

            {/* HUD micro-copy */}
            <div className="absolute bottom-8 left-8 hidden md:block">
              <span className="micro-copy dark:text-technology-accent">
                LIVE FEED: ENCRYPTED_TUNNEL_CONNECTED
              </span>
            </div>
            <div className="absolute top-8 right-8 hidden md:block">
              <span className="micro-copy dark:text-technology-muted">ID: RUN_APP_LAB_849</span>
            </div>

            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <Typography.H2 className="text-6xl md:text-8xl lg:text-9xl font-neue-stance font-bold text-black dark:text-white mb-10 uppercase italic tracking-tighter leading-custom-misc-491 dark:drop-shadow-custom-misc-492">
                {vm.cta.headline.replace("?", "")} <br />
                <span className="text-technology-primary dark:text-technology-accent dark:drop-shadow-custom-misc-493">
                  Together?
                </span>
              </Typography.H2>

              <Typography.P className="text-lg md:text-2xl text-technology-body mb-16 max-w-2xl mx-auto font-light leading-relaxed tracking-wide font-helvetica">
                {vm.cta.subheadline ||
                  "Equip your team with technology designed for the next century of sport. Partner with us to redefine what is possible."}
              </Typography.P>

              <div className="flex flex-col sm:flex-row gap-8 justify-center">
                <a
                  href="/contact"
                  className="px-14 py-6 bg-technology-primary dark:bg-technology-accent text-white dark:text-black font-bold uppercase tracking-custom-misc-494 shadow-2xl dark:shadow-custom-misc-495 hover:bg-technology-primary/80 dark:hover:bg-white dark:hover:shadow-custom-misc-496 transition-all transform hover:-translate-y-1 text-xs"
                >
                  {vm.cta.primaryText || "Book a Tech Demo"}
                </a>
                <button
                  type="button"
                  className="px-14 py-6 border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-black dark:text-white font-bold uppercase tracking-custom-misc-497 shadow-lg hover:border-technology-primary dark:hover:border-technology-accent hover:text-technology-primary dark:hover:text-technology-accent dark:hover:shadow-custom-misc-498 transition-all text-xs dark:backdrop-blur-xl"
                >
                  View Equipment Specs
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
