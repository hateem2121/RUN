import React from "react";

import type {
  MediaAsset,
  TechnologyCta as TechnologyCtaType,
  TechnologyEquipment,
  TechnologyHero,
  TechnologyInnovation,
  TechnologyResearch,
  TechnologyRoadmap,
} from "@shared/schema";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { useLoaderData } from "react-router";
import { Typography } from "@/components/ui/typography";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { getQueryClient } from "@/lib/queryClient";
import type { Route } from "./+types/technology";


// Import NEW unified sections
import { InteractiveExperienceSection } from "@/components/technology/InteractiveExperienceSection";
import { TechnologyStackSection } from "@/components/technology/TechnologyStackSection";
import { RoadAheadTimeline } from "@/components/technology/RoadAheadTimeline";
import { MarqueeStrip } from "@/components/technology/ui/MarqueeStrip";

export async function loader() {
  const queryClient = getQueryClient();
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

// Import shared ViewModels
import type {
  CtaVM,
  EquipmentVM,
  HeroVM,
  InnovationVM,
  ResearchVM,
  RoadmapVM,
} from "@shared/viewmodels";

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
  hero: TechnologyHero | null;
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

function resolveHeroBackgroundId(hero: TechnologyHero | undefined): number | null {
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



function normalizeHero(h: TechnologyHero | undefined): HeroVM | null {
  if (!h) return null;
  const heroData = h as Record<string, unknown>;
  return {
    title: (typeof heroData.headline === "string" ? heroData.headline : undefined) || h.title || "Technology",
    subtitle: (typeof heroData.subheadline === "string" ? heroData.subheadline : undefined) || h.subtitle || "",
    primaryCtaText: (typeof heroData.primaryCtaText === "string" ? heroData.primaryCtaText : undefined) ||
      (typeof heroData.ctaText === "string" ? heroData.ctaText : undefined) || "Learn more",
    secondaryCtaText: (typeof heroData.secondaryCtaText === "string" ? heroData.secondaryCtaText : undefined) || "",
    primaryCtaLink: (typeof heroData.primaryCtaLink === "string" ? heroData.primaryCtaLink : undefined) || "#",
    secondaryCtaLink: (typeof heroData.secondaryCtaLink === "string" ? heroData.secondaryCtaLink : undefined) || "#",
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
  hero: TechnologyHero | undefined,
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

export default function Technology() {
  const loaderData = useLoaderData<typeof loader>();
  
  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <TechnologyInner />
    </HydrationBoundary>
  );
}

function TechnologyInner() {
  const { data: batchData, isLoading: batchLoading } = useOptimizedQuery<TechnologyBatchResponse>({
    queryKey: ["/api/technology-batch"],
  });

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

  // Title formatting - extracting the last word to apply the cyan highlight
  const titleParts = (vm.hero?.title || "Where Science Meets Fabric").split(" ");
  const lastTitleWord = titleParts.pop();
  const mainTitlePart = titleParts.join(" ");

  return (
    <>
      {batchLoading ? (
        <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(240,5%,96%)]">
          <div className="text-center text-slate-900">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#00D4FF]/30 border-t-[#00D4FF]"></div>
            <Typography.P className="text-sm tracking-widest uppercase font-mono text-[#00D4FF]/70">
              Initializing...
            </Typography.P>
          </div>
        </div>
      ) : (
        <div className="technology-page-root relative isolate min-h-screen overflow-hidden bg-[hsl(240,5%,96%)]">
          {/* Subtle Grid Pattern Adaptated for Light Theme */}
          <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(rgba(0,212,255,0.08)_1px,transparent_1px)] bg-[length:40px_40px] opacity-60"></div>

          {/* Cinematic Hero Section */}
          <header className="relative min-h-screen flex flex-col justify-center overflow-hidden px-6 pt-20 border-b border-black/5">
            {/* Subtle glow behind hero content */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00D4FF]/5 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col items-center text-center mt-12 sm:mt-0">
              
              <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 bg-white/60 border border-black/5 rounded-full backdrop-blur-sm shadow-sm">
                <div className="w-1.5 h-1.5 bg-[#00D4FF] rounded-full animate-pulse"></div>
                <span className="text-[10px] font-mono font-bold text-[#0088AA] tracking-widest uppercase">
                  v.2.04 Stable Release
                </span>
              </div>
              
              <div className="flex flex-col items-center mb-10 space-y-2">
                <Typography.H1 className="text-6xl md:text-[8rem] lg:text-[10rem] font-display font-bold text-slate-900 leading-[0.85] tracking-tight uppercase flex flex-col items-center gap-2 sm:gap-4">
                  {mainTitlePart ? <span className="block">{mainTitlePart}</span> : null}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D4FF] to-[#0088AA] pb-2">
                    {lastTitleWord}
                  </span>
                </Typography.H1>
              </div>
              
              <div className="h-px w-2/5 md:w-1/4 max-w-[200px] bg-[#00D4FF]/40 mb-10"></div>
              
              <Typography.P className="text-base md:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mb-14 tracking-wide">
                {vm.hero?.subtitle || "Engineering the next generation of athletic skin. We go beyond textiles, diving deep into biotechnology to enhance human performance through reactive materials."}
              </Typography.P>
              
              <div className="flex justify-center">
                <a
                  href={vm.hero?.primaryCtaLink || "#"}
                  className="px-8 md:px-10 py-4 bg-[#00D4FF] text-white font-bold uppercase tracking-widest text-xs shadow-[0_10px_20px_rgba(0,212,255,0.2)] hover:bg-[#00E5FF] hover:shadow-[0_15px_30px_rgba(0,212,255,0.3)] transition-all duration-300 flex items-center gap-3 transform hover:-translate-y-1 rounded-sm"
                >
                  {vm.hero?.primaryCtaText || "Explore Our Innovations"}
                  <span className="material-symbols-outlined text-base">arrow_downward</span>
                </a>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 text-[10px] font-mono text-slate-400 tracking-wider hidden md:block">
              LAT: 47.3769° N <br/> LON: 8.5417° E
            </div>
          </header>

          <MarqueeStrip 
            items={["INNOVATION", "3D DESIGN", "SMART TEXTILES", "R&D", "BIOMECHANICS", "COMPUTATIONAL ANALYSIS"]} 
            accentColor="#00D4FF"
          />

          <InteractiveExperienceSection media={backgroundMedia} />

          <TechnologyStackSection innovations={vm.innovations} equipment={vm.equipment} />

          <RoadAheadTimeline roadmap={vm.roadmap} research={vm.research} />

          {/* CTA Section */}
          {vm.cta && (
            <section className="py-32 px-6 relative overflow-hidden flex items-center justify-center bg-white/40 border-t border-black/5 mt-16 backdrop-blur-sm">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-40 hidden md:block z-0"></div>
              
              <div className="absolute bottom-4 left-4 text-[10px] font-mono text-slate-400 hidden md:block">
                LIVE FEED: CONNECTED
              </div>
              <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-400 hidden md:block">
                ENCRYPTION: SECURED
              </div>
              
              <div className="relative z-10 text-center max-w-4xl mx-auto">
                <Typography.H2 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-slate-900 mb-6 uppercase italic tracking-tighter leading-[0.9]">
                  {vm.cta.headline.replace("?", "")} <br/><span className="text-[#00D4FF]">Together?</span>
                </Typography.H2>
                
                <Typography.P className="text-base md:text-lg text-slate-600 mb-12 max-w-xl mx-auto font-light leading-relaxed">
                  {vm.cta.subheadline || "Equip your team with technology designed for the next century of sport. Partner with us to redefine what is possible."}
                </Typography.P>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <a href="/contact" className="px-8 md:px-12 py-4 md:py-5 bg-[#00D4FF] text-white font-bold uppercase tracking-widest rounded-sm shadow-md hover:shadow-xl hover:bg-slate-900 transition-all transform hover:-translate-y-1 text-xs md:text-sm text-center">
                    {vm.cta.primaryText || "Book a Tech Demo"}
                  </a>
                  <button className="px-8 md:px-12 py-4 md:py-5 border border-black/10 bg-white/50 backdrop-blur text-slate-900 font-bold uppercase tracking-widest rounded-sm hover:border-[#00D4FF] hover:text-[#00D4FF] transition-all text-xs md:text-sm">
                    View Equipment Specs
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
