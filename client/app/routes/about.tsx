import type {
  AboutHero,
  AboutMapLocation,
  AboutSection,
  AboutStatistic,
  AboutTeamMessage,
  AboutTimelineEntry,
  MediaAsset,
} from "@shared/schema";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

import { isRouteErrorResponse, useLoaderData, useRouteError } from "react-router";
import Footer from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { Card, CardContent, GlassCardDecorations } from "@/components/ui/card";
import { GlowingShadow } from "@/components/ui/glowing-shadow";
import { LoadingState } from "@/components/ui/loading-state";
import { ClientOnlyMap, type MapLocation } from "@/components/ui/map";
import { OptimizedImage } from "@/components/ui/optimized-image";
import StackingCards from "@/components/ui/stacking-cards";
import { Timeline } from "@/components/ui/timeline";
import { Typography } from "@/components/ui/typography";
import { useMediaResolver } from "@/lib/media-resolver";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { resolveIcon } from "@/utils/icon-resolver";
import type { Route } from "./+types/about";

export async function loader() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["/api/about-batch"],
    queryFn: () => apiRequest("/api/about-batch"),
  });
  return { dehydratedState: dehydrate(queryClient) };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Us | Run Apparel" },
    {
      name: "description",
      content: "Learn about our history, values, and manufacturing capabilities.",
    },
  ];
}

// Hook to detect mobile devices
import { useIsMobile } from "@/hooks/use-is-mobile";

export default function About() {
  const loaderData = useLoaderData<typeof loader>();
  
  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <AboutPageContent />
    </HydrationBoundary>
  );
}

function AboutPageContent() {
  const isMobile = useIsMobile();
  // Fetch all about data in one optimized batch call
  // This will now correctly find data in the cache from the HydrationBoundary
  const { data: batchData, isLoading: batchLoading } = useQuery<{
    hero: AboutHero | null;
    timeline: AboutTimelineEntry[];
    locations: AboutMapLocation[];
    sections: AboutSection[];
    statistics: AboutStatistic[];
    teamMessage: AboutTeamMessage | null;
    mediaAssets: MediaAsset[];
    _meta: {
      fetchedAt: string;
      totalRequests: number;
      mediaAssetsLoaded: number;
      mediaIdsRequested: number[];
      responseTime: number;
    };
  }>({
    queryKey: ["/api/about-batch"],
    queryFn: () => apiRequest("/api/about-batch"),
    retry: 3,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

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
  const isDataReady = !batchLoading;

  // Sorted arrays
  const sortedTimeline = [...timeline].sort((a, b) => (a.position || 0) - (b.position || 0));
  const sortedSections = [...sections]
    .filter((s) => s.isActive)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
  const sortedStatistics = [...statistics]
    .filter((s) => s.isActive)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

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
    return (
      <LoadingState
        fullScreen
        text={batchLoading ? "Loading about page data..." : "Loading about page..."}
      />
    );
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
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto max-w-4xl"
            >
              <Card variant="glass-premium" className="group">
                <GlassCardDecorations showShimmer={!isMobile} />
                <CardContent className="relative z-elevated p-8 md:p-12">
                  <div className="grid items-center gap-8 md:grid-cols-2">
                    <div>
                      {teamMessage.imageId && getAsset(teamMessage.imageId) && (
                        <div className="mb-6">
                          <OptimizedImage
                            mediaId={teamMessage.imageId}
                            alt="Team"
                            className="h-64 w-full rounded-xl object-cover bg-transparent"
                            quality={90}
                            priority={false}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <MessageSquare className="mb-4 h-8 w-8 text-primary" />
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
            </motion.div>
          </div>
        </section>
      )}

      {sortedSections.length > 0 && (
        <div className="relative">
          <StackingCards
            sections={sortedSections}
            getAssetUrl={getAssetUrl}
            getAsset={getAsset}
          />
        </div>
      )}

      {sortedStatistics.length > 0 && (
        <section className="bg-background py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 text-center"
            >
              <Typography.H2 className="mb-4 font-bold text-3xl tracking-tighter sm:text-4xl md:text-5xl">
                Key Statistics
              </Typography.H2>
              <Typography.P className="mx-auto max-w-reading text-muted-foreground md:text-xl">
                Our impact and achievements in numbers
              </Typography.P>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {sortedStatistics.map((stat, index) => {
                const IconComponent = resolveIcon(stat.icon);
                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="h-full"
                  >
                    <GlowingShadow>
                      <div className="flex h-full flex-col items-center justify-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <IconComponent className="h-8 w-8 text-primary" />
                        </div>
                        <Typography.H3 className="mb-2 font-bold text-3xl text-foreground">
                          {stat.value}
                          {stat.unit && (
                            <span className="ml-1 text-lg text-muted-foreground">
                              {stat.unit}
                            </span>
                          )}
                        </Typography.H3>
                        <Typography.P className="font-medium text-muted-foreground">
                          {stat.label}
                        </Typography.P>
                      </div>
                    </GlowingShadow>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {(clientLocations.length > 0 || facilityLocations.length > 0) && (
        <section className="bg-muted/20 py-20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-16 text-center"
            >
              <Typography.H2 className="mb-4 font-bold text-3xl tracking-tighter sm:text-4xl md:text-5xl">
                Global Presence
              </Typography.H2>
              <Typography.P className="mx-auto max-w-reading text-muted-foreground md:text-xl">
                Our manufacturing facilities and client partnerships span across continents
              </Typography.P>
            </motion.div>
            <ClientOnlyMap locations={mapLocations} />
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-6 rounded-full bg-destructive/10 p-4">
        <svg
          className="h-12 w-12 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <Typography.H1 className="mb-2 font-bold text-3xl">
        {isRouteError ? "Page Not Found" : "Something went wrong"}
      </Typography.H1>
      <Typography.P className="mb-6 max-w-md text-muted-foreground">
        {isRouteError
          ? "We couldn't find the page you're looking for."
          : "We encountered an error while loading the about page content. Please try again later."}
      </Typography.P>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Reload Page
      </button>
      {import.meta.env.DEV && !isRouteError && (
        <div className="mt-8 max-w-2xl overflow-auto rounded-lg bg-neutral-950 p-4 text-left font-mono text-xs text-red-400 border border-red-900/50">
          {error instanceof Error ? error.stack : String(error)}
        </div>
      )}
    </div>
  );
}
