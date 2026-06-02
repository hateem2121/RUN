import type { AboutBatchResponse } from "@shared/index";
import { MessageSquare } from "lucide-react";
import { useRef } from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { Card, CardContent, GlassCardDecorations } from "@/components/ui/card";
import { GlowingShadow } from "@/components/ui/glowing-shadow";
import { LoadingState } from "@/components/ui/loading-state";
import { ClientOnlyMap, type MapLocation } from "@/components/ui/map";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { StackingCards } from "@/components/ui/stacking-cards";
import { Timeline } from "@/components/ui/timeline";
import { Typography } from "@/components/ui/typography";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMediaResolver } from "@/lib/media-resolver";
import { resolveIcon } from "@/utils/icon-resolver";
import type { Route } from "./+types/about";

export async function loader({ request }: Route.LoaderArgs) {
  const base = new URL(request.url);
  const get = (path: string) =>
    fetch(new URL(path, base).toString())
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const [batchData] = await Promise.all([get("/api/about-batch")]);

  return { batchData };
}

type LoaderData = {
  batchData: AboutBatchResponse | null;
};

export function meta({ data }: { data: LoaderData | undefined }) {
  const hero = data?.batchData?.hero;
  return [
    { title: hero?.title || "About Us | Run Apparel" },
    {
      name: "description",
      content:
        hero?.description || "Learn about our history, values, and manufacturing capabilities.",
    },
  ];
}

export default function About({ loaderData }: { loaderData: LoaderData }) {
  const { batchData } = loaderData;

  return <AboutPageContent batchData={batchData} />;
}

interface AboutPageContentProps {
  batchData: AboutBatchResponse | null;
}

function AboutPageContent({ batchData }: AboutPageContentProps) {
  const isMobile = useIsMobile();
  const teamMessageRef = useRef<HTMLDivElement>(null);
  const statsHeadingRef = useRef<HTMLDivElement>(null);
  const statsGridRef = useRef<HTMLDivElement>(null);
  const mapHeadingRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const triggers: ScrollTrigger[] = [];

    if (teamMessageRef.current) {
      const t = ScrollTrigger.create({
        trigger: teamMessageRef.current,
        start: "top 85%",
        onEnter: () => gsap.from(teamMessageRef.current, { opacity: 0, y: 30, duration: 0.8 }),
      });
      triggers.push(t);
    }
    if (statsHeadingRef.current) {
      const t = ScrollTrigger.create({
        trigger: statsHeadingRef.current,
        start: "top 85%",
        onEnter: () => gsap.from(statsHeadingRef.current, { opacity: 0, y: 20, duration: 0.6 }),
      });
      triggers.push(t);
    }
    if (statsGridRef.current) {
      const t = ScrollTrigger.create({
        trigger: statsGridRef.current,
        start: "top 85%",
        onEnter: () =>
          gsap.from(statsGridRef.current!.querySelectorAll(".stat-item"), {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.1,
          }),
      });
      triggers.push(t);
    }
    if (mapHeadingRef.current) {
      const t = ScrollTrigger.create({
        trigger: mapHeadingRef.current,
        start: "top 85%",
        onEnter: () => gsap.from(mapHeadingRef.current, { opacity: 0, y: 20, duration: 0.6 }),
      });
      triggers.push(t);
    }

    return () => {
      for (const t of triggers) t.kill();
    };
  }, []);

  // Extract data from batch response
  const heroData = batchData?.hero;
  const timeline = batchData?.timeline || [];
  const locations = batchData?.locations || [];
  const sections = batchData?.sections || [];
  const statistics = batchData?.statistics || [];
  const teamMessage = batchData?.teamMessage;
  const mediaAssets = batchData?.mediaAssets || [];

  // Only initialize media resolver when we have assets
  const { getAsset, getAssetUrl } = useMediaResolver(mediaAssets);

  // Check if we have sufficient data to render
  const isDataReady = !!batchData;

  // Sorted arrays
  const sortedTimeline = [...timeline].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const sortedSections = [...sections]
    .filter((s) => s.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const sortedStatistics = [...statistics]
    .filter((s) => s.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Transform locations to match the optimized map interface
  const mapLocations: MapLocation[] = locations.map((location) => ({
    id: location.id,
    type:
      location.locationType === "headquarters" ||
      location.locationType === "office" ||
      location.locationType === "distribution"
        ? "facility"
        : "client",
    name: location.name,
    latitude: parseFloat(location.latitude),
    longitude: parseFloat(location.longitude),
    city: location.city || location.address?.split(",")[1]?.trim() || "",
    country: location.country || location.address?.split(",").pop()?.trim() || "",
    details: location.details || location.description || "",
    isActive: location.isActive ?? true,
  }));

  const clientLocations = mapLocations.filter((l) => l.type === "client" && l.isActive);
  const facilityLocations = mapLocations.filter((l) => l.type === "facility" && l.isActive);

  // Timeline data transformation
  const timelineData = sortedTimeline.map((item) => ({
    title: item.year.toString(),
    content: (
      <Card variant="glass-premium" className="group p-6 shadow-inner-sm">
        <GlassCardDecorations showShimmer={!isMobile} />
        <div className="relative z-elevated">
          <Typography.H3 className="mb-3 font-bold text-foreground text-xl">
            {item.title}
          </Typography.H3>
          {item.description && (
            <Typography.P className="mb-4 text-muted-foreground">{item.description}</Typography.P>
          )}
          {item.imageId && getAsset(item.imageId) && (
            <div className="mt-4">
              <OptimizedImage
                mediaId={item.imageId}
                alt={`Historical milestone: ${item.title}`}
                quality={85}
                className="h-40 w-full rounded-lg object-cover bg-transparent"
              />
            </div>
          )}
        </div>
        {!isMobile && (
          <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="shimmer-overlay" />
          </div>
        )}
      </Card>
    ),
  }));

  const heroBackgroundMediaId = heroData?.backgroundMediaId ?? undefined;
  const heroBackgroundAsset = heroBackgroundMediaId ? getAsset(heroBackgroundMediaId) : null;
  const heroBackgroundUrl =
    (heroBackgroundAsset && heroBackgroundMediaId ? getAssetUrl(heroBackgroundMediaId) : null) ??
    "";

  if (!heroData || !isDataReady) {
    return <LoadingState fullScreen text="Loading about page..." />;
  }

  return (
    <div id="main-content" className="min-h-screen bg-background">
      <HeroSection
        heroData={heroData || {}}
        mediaUrl={heroBackgroundUrl}
        mediaType={heroBackgroundAsset?.type === "video" ? "video" : "image"}
      />

      {timelineData.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6">
            <Timeline data={timelineData} />
          </div>
        </section>
      )}

      {teamMessage && (
        <section className="bg-muted/20 py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div ref={teamMessageRef} className="relative mx-auto max-w-4xl">
              <Card variant="glass-premium" className="group">
                <GlassCardDecorations showShimmer={!isMobile} />
                <CardContent className="relative z-elevated p-8 md:p-12">
                  <div className="grid items-center gap-8 md:grid-cols-2">
                    <div>
                      {teamMessage.imageId && getAsset(teamMessage.imageId) && (
                        <div className="mb-6">
                          <OptimizedImage
                            mediaId={teamMessage.imageId}
                            alt="RUN APPAREL Executive Team"
                            className="h-64 w-full rounded-xl object-cover bg-transparent"
                            quality={90}
                            priority={false}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <MessageSquare className="mb-4 h-8 w-8 text-primary" aria-hidden="true" />
                      {teamMessage.title && (
                        <Typography.H3 className="mb-4 font-bold text-2xl">
                          {teamMessage.title}
                        </Typography.H3>
                      )}
                      {teamMessage.message && (
                        <Typography.P className="mb-6 text-muted-foreground leading-relaxed">
                          {teamMessage.message}
                        </Typography.P>
                      )}
                      {(teamMessage.signature || teamMessage.name) && (
                        <div className="border-t pt-4">
                          <Typography.P className="font-semibold text-foreground">
                            {teamMessage.signature || teamMessage.name}
                          </Typography.P>
                          <Typography.P className="text-muted-foreground text-sm">
                            {teamMessage.position || "Executive Team"}
                          </Typography.P>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {sortedSections.length > 0 && (
        <div className="relative">
          <StackingCards sections={sortedSections} getAssetUrl={getAssetUrl} getAsset={getAsset} />
        </div>
      )}

      {sortedStatistics.length > 0 && (
        <section className="bg-background py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div ref={statsHeadingRef} className="mb-16 text-center">
              <Typography.H2 className="mb-4 font-bold text-3xl tracking-tighter sm:text-4xl md:text-5xl">
                Key Statistics
              </Typography.H2>
              <Typography.P className="mx-auto max-w-reading text-muted-foreground md:text-xl">
                Our impact and achievements in numbers
              </Typography.P>
            </div>

            <div
              ref={statsGridRef}
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
            >
              {sortedStatistics.map((stat) => {
                const IconComponent = resolveIcon(stat.iconName || "Activity");
                return (
                  <div key={stat.id} className="h-full stat-item">
                    <GlowingShadow>
                      <div className="flex h-full flex-col items-center justify-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <IconComponent className="h-8 w-8 text-primary" aria-hidden="true" />
                        </div>
                        <Typography.H3 className="mb-2 font-bold text-3xl text-foreground">
                          {stat.value}
                          {stat.unit && (
                            <span className="ml-1 text-lg text-muted-foreground">{stat.unit}</span>
                          )}
                        </Typography.H3>
                        <Typography.P className="font-medium text-muted-foreground">
                          {stat.label}
                        </Typography.P>
                      </div>
                    </GlowingShadow>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {(clientLocations.length > 0 || facilityLocations.length > 0) && (
        <section className="bg-muted/20 py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div ref={mapHeadingRef} className="mb-16 text-center">
              <Typography.H2 className="mb-4 font-bold text-3xl tracking-tighter sm:text-4xl md:text-5xl">
                Global Presence
              </Typography.H2>
              <Typography.P className="mx-auto max-w-reading text-muted-foreground md:text-xl">
                Our manufacturing facilities and client partnerships span across continents
              </Typography.P>
            </div>
            <ClientOnlyMap locations={mapLocations} />
          </div>
        </section>
      )}

      {/* Footer removed here, now handled by _public.tsx layout wrapper */}
    </div>
  );
}

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };
