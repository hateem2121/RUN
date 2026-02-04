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
import { Award, Factory, Globe2, MessageSquare, Package, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import { HeroSection } from "@/components/sections/HeroSection";
import { ClientOnly } from "@/components/shared/ClientOnly";
import { Card, CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowingShadow } from "@/components/ui/glowing-shadow";
import { type MapLocation, OptimizedMapContainer } from "@/components/ui/map";
import { OptimizedImage } from "@/components/ui/optimized-image";
import StackingCards from "@/components/ui/stacking-cards";
import { Timeline } from "@/components/ui/timeline";
import { Typography } from "@/components/ui/typography";
import { useMediaResolver } from "@/lib/media-resolver";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
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
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export default function About() {
  const loaderData = useLoaderData<typeof loader>();
  const isMobile = useIsMobile();
  // Fetch all about data in one optimized batch call
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
    type: location.type as "client" | "facility",
    name: location.name,
    latitude: parseFloat(location.latitude), // Convert decimal string to number
    longitude: parseFloat(location.longitude), // Convert decimal string to number
    city: location.city || "",
    country: location.country || "", // Handle null country values
    details: location.details || "",
    isActive: location.isActive ?? true,
  }));

  // Filter locations by type for legend counts
  const clientLocations = mapLocations.filter((l) => l.type === "client" && l.isActive);
  const facilityLocations = mapLocations.filter((l) => l.type === "facility" && l.isActive);

  // Show loading state until all data is ready
  if (!heroData || !isDataReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2"></div>
          <Typography.P className="text-muted-foreground">Loading about page...</Typography.P>
          {batchLoading && (
            <Typography.P className="mt-2 text-muted-foreground/70 text-sm">
              Loading about page data...
            </Typography.P>
          )}
        </div>
      </div>
    );
  }

  // Timeline data transformation
  const timelineData = sortedTimeline.map((item) => ({
    title: item.year.toString(),
    content: (
      <GlassCard className="group p-6 shadow-inner-sm">
        {/* Gradient overlay for depth */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-br from-white/10 via-transparent to-black/10" />

        {/* Inner glow */}
        <div className="card-border-overlay rounded-[calc(0.75rem-1px)]" />

        {/* Content */}
        <div className="relative z-elevated">
          <Typography.H3 className="mb-3 font-bold text-neutral-900 text-xl dark:text-neutral-100">
            {item.title}
          </Typography.H3>
          {item.description && (
            <Typography.P className="mb-4 text-neutral-700 dark:text-neutral-300">
              {item.description}
            </Typography.P>
          )}
          {item.imageId && getAsset(item.imageId) && (
            <div className="mt-4">
              <OptimizedImage
                mediaId={item.imageId}
                alt={item.title}
                quality={85}
                className="h-40 w-full rounded-lg object-cover bg-transparent"
              />
            </div>
          )}
        </div>

        {/* Hover shimmer effect - disabled on mobile for performance */}
        {!isMobile && (
          <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="shimmer-overlay" />
          </div>
        )}
      </GlassCard>
    ),
  }));

  // Calculate hero media properties with proper null checks
  const heroBackgroundMediaId = heroData?.backgroundMediaId ?? undefined;
  const heroBackgroundAsset = heroBackgroundMediaId ? getAsset(heroBackgroundMediaId) : null;
  const heroBackgroundUrl =
    (heroBackgroundAsset && heroBackgroundMediaId ? getAssetUrl(heroBackgroundMediaId) : null) ??
    "";

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <div className="min-h-screen bg-background">
        {/* Unified Scroll Expansion Hero Section with Overlay Content */}
        <HeroSection
          heroData={heroData || {}}
          mediaUrl={heroBackgroundUrl}
          mediaType={heroBackgroundAsset?.type === "video" ? "video" : "image"}
        />

        {/* Modern Timeline Section */}
        {timelineData.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4 md:px-6">
              <Timeline data={timelineData} />
            </div>
          </section>
        )}

        {/* Executive Team Message - Providing Context */}
        {teamMessage && (
          <section className="bg-muted/20 py-20">
            <div className="container mx-auto px-4 md:px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mx-auto max-w-4xl"
              >
                <Card className="group relative overflow-hidden border border-border/60 bg-background/10 shadow-glow-lg shadow-inner-sm backdrop-blur-md dark:border-border/70 dark:bg-background/5">
                  {/* Gradient overlay for depth */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/10" />

                  {/* Inner glow */}
                  <div className="card-border-overlay rounded-[calc(0.5rem-1px)]" />

                  {/* Hover shimmer effect - disabled on mobile for performance */}
                  {!isMobile && (
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <div className="shimmer-overlay" />
                    </div>
                  )}

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
                        {teamMessage.signature && (
                          <div className="border-t pt-4">
                            <Typography.P className="font-semibold text-foreground">
                              {teamMessage.signature}
                            </Typography.P>
                            <Typography.P className="text-muted-foreground text-sm">
                              Executive Team
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

        {/* Manufacturing Capabilities - Stacking Cards Effect */}
        {sortedSections.length > 0 && (
          <StackingCards sections={sortedSections} getAssetUrl={getAssetUrl} getAsset={getAsset} />
        )}

        {/* Key Statistics Section */}
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
                  const iconName = stat.icon || "Package";
                  const IconComponent =
                    iconName === "Globe2"
                      ? Globe2
                      : iconName === "Factory"
                        ? Factory
                        : iconName === "Package"
                          ? Package
                          : iconName === "Users"
                            ? Users
                            : iconName === "Award"
                              ? Award
                              : iconName === "TrendingUp"
                                ? TrendingUp
                                : Package;

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
                          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                            <IconComponent className="h-8 w-8 text-white" />
                          </div>
                          <Typography.H3 className="mb-2 font-bold text-3xl text-white">
                            {stat.value}
                            {stat.unit && (
                              <span className="ml-1 text-lg text-white/70">{stat.unit}</span>
                            )}
                          </Typography.H3>
                          <Typography.P className="font-medium text-white/80">
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

        {/* Global Presence Map Section */}
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

              <ClientOnly
                fallback={
                  <div className="flex h-modal-sm w-full animate-pulse items-center justify-center rounded-2xl bg-muted">
                    Loading map...
                  </div>
                }
              >
                <OptimizedMapContainer locations={mapLocations} />
              </ClientOnly>
            </div>
          </section>
        )}
      </div>
    </HydrationBoundary>
  );
}
