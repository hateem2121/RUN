import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";

import { HeroSection } from "@/components/sections/HeroSection";

import { Timeline } from "@/components/ui/timeline";
import StackingCards from "@/components/ui/stacking-cards";
import { GlowingShadow } from "@/components/ui/glowing-shadow";
// Removed dependency on manufacturing-stacking-cards - using simple card layout instead
import {
  Globe2,
  Factory,
  Package,
  Users,
  Award,
  TrendingUp,
  MessageSquare,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaResolver } from "@/lib/media-resolver";
// REMOVED: media-migration utility no longer needed after consolidation
import { OptimizedMapContainer, type MapLocation } from "@/components/ui/map";
import type {
  AboutHero,
  AboutTimelineEntry,
  AboutMapLocation,
  AboutSection,
  AboutStatistic,
  AboutTeamMessage,
  MediaAsset,
} from "@shared/schema";

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
    queryFn: async () => {
      const response = await fetch("/api/about-batch");
      if (!response.ok) throw new Error("Failed to fetch about data");
      return response.json();
    },
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
  // REMOVED: Migration utility no longer needed after Phase 2 consolidation

  // Check if we have sufficient data to render
  // const hasMediaAssets = mediaAssets.length > 0;
  // FIX: Allow rendering even if no media assets are present (e.g. after fresh seed)
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
    details: location.details || undefined,
    isActive: location.isActive ?? true,
  }));

  // Filter locations by type for legend counts
  const clientLocations = mapLocations.filter((l) => l.type === "client" && l.isActive);
  const facilityLocations = mapLocations.filter((l) => l.type === "facility" && l.isActive);

  // Media assets are now properly loaded - no migration needed

  // Show loading state until all data is ready
  if (!heroData || !isDataReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading about page...</p>
          {batchLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Loading about page data...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Timeline data transformation
  const timelineData = sortedTimeline.map((item) => ({
    title: item.year.toString(),
    content: (
      <div className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-gray-800/60 dark:border-gray-900/70 p-6 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.15)] shadow-[inset_0_2px_4px_rgba(255,255,255,0.15)] group relative overflow-hidden">
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none rounded-xl" />

        {/* Inner glow */}
        <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-3 text-neutral-900 dark:text-neutral-100">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-neutral-700 dark:text-neutral-300 mb-4">{item.description}</p>
          )}
          {item.imageId && getAsset(item.imageId) && (
            <div className="mt-4">
              <OptimizedImage
                mediaId={item.imageId}
                alt={item.title}
                quality={85}
                className="w-full h-40 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Hover shimmer effect - disabled on mobile for performance */}
        {!isMobile && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        )}
      </div>
    ),
  }));

  // Services data transformation

  // Calculate hero media properties with proper null checks
  const heroBackgroundMediaId = heroData?.backgroundMediaId ?? undefined;
  const heroBackgroundAsset = heroBackgroundMediaId ? getAsset(heroBackgroundMediaId) : null;
  const heroBackgroundUrl =
    (heroBackgroundAsset && heroBackgroundMediaId ? getAssetUrl(heroBackgroundMediaId) : null) ??
    "";

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Scroll Expansion Hero Section with Overlay Content */}
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
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-white/10 dark:bg-white/5 backdrop-blur-md border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] shadow-[inset_0_2px_4px_rgba(255,255,255,0.15)] overflow-hidden group relative">
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />

                {/* Inner glow */}
                <div className="absolute inset-[1px] rounded-[calc(0.5rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                {/* Hover shimmer effect - disabled on mobile for performance */}
                {!isMobile && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  </div>
                )}

                <CardContent className="p-8 md:p-12 relative z-10">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      {teamMessage.imageId && getAsset(teamMessage.imageId) && (
                        <div className="mb-6">
                          <OptimizedImage
                            mediaId={teamMessage.imageId}
                            alt="Team"
                            className="w-full h-64 object-cover rounded-xl"
                            quality={90}
                            priority={false}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <MessageSquare className="h-8 w-8 text-primary mb-4" />
                      {teamMessage.title && (
                        <h3 className="text-2xl font-bold mb-4">{teamMessage.title}</h3>
                      )}
                      {teamMessage.message && (
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                          {teamMessage.message}
                        </p>
                      )}
                      {teamMessage.signature && (
                        <div className="border-t pt-4">
                          <p className="font-semibold text-foreground">{teamMessage.signature}</p>
                          <p className="text-sm text-muted-foreground">Executive Team</p>
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
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                Key Statistics
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Our impact and achievements in numbers
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-3xl font-bold mb-2 text-white">
                          {stat.value}
                          {stat.unit && (
                            <span className="text-lg text-white/70 ml-1">{stat.unit}</span>
                          )}
                        </h3>
                        <p className="text-white/80 font-medium">{stat.label}</p>
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
        <section className="py-20 bg-muted/20">
          <div className="container mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
                Global Presence
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Our manufacturing facilities and client partnerships span across continents
              </p>
            </motion.div>

            <OptimizedMapContainer locations={mapLocations} />
          </div>
        </section>
      )}

      {/* Back to Top Button */}
      <div className="fixed bottom-8 right-8 z-modal">
        <Button
          size="icon"
          className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow-sm"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
