import type { MediaAsset } from "@shared/schema";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import { SEOMeta } from "@/components/seo/seo-meta";

import { MetricCard } from "@/components/sustainability/cards";
import {
  CertificatesSection,
  FabricPortfolioSection,
  GoalsSection,
  InitiativesSection,
  OptimizedSustainabilityHero,
} from "@/components/sustainability/sections";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from "@/components/ui/button";
import { headingVariants, Typography } from "@/components/ui/typography";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { fadeInUp, springTransition } from "@/lib/animations";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Route } from "./+types/sustainability";

export async function loader() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["/api/sustainability/batch"],
    queryFn: async () => {
      const res = await apiRequest("/api/sustainability/batch");
      return res.json();
    },
  });
  return { dehydratedState: dehydrate(queryClient) };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sustainability | Run Apparel" },
    {
      name: "description",
      content:
        "Discover our dedication to sustainable manufacturing and environmental responsibility.",
    },
  ];
}

export default function Sustainability() {
  const loaderData = useLoaderData<typeof loader>();
  const { scrollY } = useScroll();
  const { isMobile } = useMobileDetection();

  // Parallax transforms - disabled opacity fade on mobile to prevent invisible background
  const heroY = useTransform(scrollY, [0, 500], [0, isMobile ? -50 : -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, isMobile ? 1 : 0]);

  // Queries for unified sustainability data (Batch Request)
  const { data: batchData } = useQuery({
    queryKey: ["/api/sustainability/batch"],
    queryFn: async () => {
      const res = await apiRequest("/api/sustainability/batch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const unifiedData = batchData?.hero;
  const activeImpactMetrics = batchData?.metrics?.filter((m: any) => m.isActive) || [];
  const activeInitiatives = batchData?.initiatives?.filter((i: any) => i.isActive) || [];
  const activeGoals = batchData?.goals?.filter((g: any) => g.isActive) || [];
  // Use certificates from batch data directly
  const allCertificates = batchData?.certificates || [];

  // Extract features data from unified model
  const featuresData = unifiedData?.featuresTitle
    ? {
        title: unifiedData.featuresTitle,
        description: unifiedData.featuresDescription || "",
        highlightedFeatures: (unifiedData.data?.highlightedFeatures as any[]) || [],
      }
    : null;

  // Extract fabric portfolio data from unified model
  const fabricPortfolioData = unifiedData?.fabricPortfolioTitle
    ? {
        title: unifiedData.fabricPortfolioTitle,
        description: unifiedData.fabricPortfolioDescription || "",
      }
    : null;

  // Extract section content with fallbacks from unified data
  const metricsTitle = unifiedData?.metricsTitle || "Our Impact";
  const metricsDescription =
    unifiedData?.metricsDescription ||
    "Measuring our commitment to environmental sustainability through real metrics and achievements.";

  const certificationsTitle = unifiedData?.certificationsTitle || "Our Certifications";
  const certificationsDescription =
    unifiedData?.certificationsDescription ||
    "We're proud to hold industry-leading certifications that validate our commitment to sustainable and ethical manufacturing practices.";
  const certificationsFooterNote =
    unifiedData?.certificationsFooterNote ||
    "These certifications represent our ongoing commitment to environmental responsibility, social accountability, and quality excellence in everything we do.";

  const initiativesTitle = unifiedData?.initiativesTitle || "Our Sustainability Initiatives";
  const initiativesDescription =
    unifiedData?.initiativesDescription ||
    "Discover our comprehensive sustainability programs and initiatives driving positive environmental impact.";

  const goalsTitle = unifiedData?.goalsTitle || "Our Sustainability Goals";
  const goalsDescription =
    unifiedData?.goalsDescription ||
    "Track our progress toward achieving ambitious sustainability targets and environmental commitments.";

  const callToActionTitle = unifiedData?.callToActionTitle || "Join Our Sustainable Journey";
  const callToActionDescription =
    unifiedData?.callToActionDescription ||
    "Partner with us to create eco-friendly sportswear that performs as well as it protects our planet";
  const callToActionButtonText = unifiedData?.callToActionButtonText || "Get Started";
  const callToActionButtonLink = unifiedData?.callToActionButtonLink || "/contact";

  // Extract hero data from unified model
  const hero = unifiedData
    ? {
        headline: unifiedData.headline,
        subheadline: unifiedData.subheadline,
        backgroundImageId: unifiedData.backgroundImageId,
        ctaText: unifiedData.ctaText,
        ctaLink: unifiedData.ctaLink,
      }
    : null;

  // OPTIMIZED: Fetch specific background media only if ID exists
  const { data: backgroundMedia } = useQuery<MediaAsset>({
    queryKey: ["/api/media", hero?.backgroundImageId],
    queryFn: () => apiRequest(`/api/media/${hero?.backgroundImageId}`).then((res) => res.json()),
    enabled: !!hero?.backgroundImageId,
    staleTime: 10 * 60 * 1000,
  });

  // NOTE: For other sections that need media, we should ideally resolve them on the backend
  // or use the media resolver utility. For now, we rely on passed props or separate optimized queries.
  // The original code fetched ALL media which is performance suicide.
  // Passing empty array for mediaAssets to children for now, unless they strictly need it.
  // If children need specific media, they should fetch it by ID or we should include relevant media in batch response.
  const mediaAssets: MediaAsset[] = [];

  // Filter certificates based on selected certificationIds from unified data
  const certificates = unifiedData?.certificationIds
    ? allCertificates.filter((cert: any) => unifiedData.certificationIds?.includes(cert.id!))
    : [];

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <div className="relative min-h-screen overflow-hidden bg-stone-100">
        <SEOMeta
          title="Sustainability & Environmental Responsibility"
          description="Discover our commitment to sustainable manufacturing, eco-friendly materials, and environmental initiatives. Leading the future of responsible sportswear production."
        />

        <BackgroundRippleEffect />

        {/* Hero Section with Parallax */}
        <motion.section
          className="relative flex h-[70vh] items-center justify-center overflow-hidden text-white md:h-screen"
          style={{ y: heroY, opacity: heroOpacity }}
          role="banner"
          aria-label="Sustainability hero section with interactive water ripple effects"
        >
          {/* Background Media */}
          {backgroundMedia && <OptimizedSustainabilityHero media={backgroundMedia} />}

          {/* Hero Content */}
          <div className="z-modal relative mx-auto max-w-4xl px-4 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, duration: 1 }}
              className={cn(headingVariants({ variant: "h1" }), "mb-6 text-white md:text-5xl")}
            >
              {hero?.headline || "Sustainable Future"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.3 }}
              className="mb-8 text-lg text-stone-200 md:text-xl"
            >
              {hero?.subheadline || "Leading the way in eco-friendly sportswear manufacturing"}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.6 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="group relative overflow-hidden border-stone-300 text-stone-900 hover:bg-stone-100 hover:text-stone-900"
                asChild
              >
                <Link to={hero?.ctaLink || "/contact"} className="z-modal-backdrop relative">
                  <span className="absolute inset-0 -top-2 -bottom-2 -translate-x-full -skew-x-12 transform bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"></span>
                  {hero?.ctaText || "Learn More"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* Sustainability Features Section */}
        {featuresData && (
          <section className="relative bg-white py-20">
            <div className="container mx-auto px-4">
              <motion.div {...fadeInUp} className="mb-16 text-center">
                <Typography.H2 className="font-neue-stance mb-6 text-3xl font-bold text-stone-900">
                  {featuresData.title}
                </Typography.H2>
                <Typography.P className="mx-auto max-w-4xl text-lg text-stone-600">
                  {featuresData.description}
                </Typography.P>
              </motion.div>

              {featuresData.highlightedFeatures && (
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {featuresData.highlightedFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ ...springTransition, delay: index * 0.1 }}
                      className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-xs"
                    >
                      <Typography.H3 className="mb-3 text-xl font-semibold text-stone-900">
                        {feature.title}
                      </Typography.H3>
                      <Typography.P className="leading-relaxed text-stone-600">
                        {feature.description}
                      </Typography.P>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Our Impact Section */}
        <section
          className="relative bg-stone-50 py-20"
          role="main"
          aria-label="Sustainability impact metrics"
        >
          <div className="container mx-auto px-4">
            <motion.div {...fadeInUp} className="mb-16 text-center">
              <Typography.H2 className="font-neue-stance mb-4 text-3xl font-bold text-stone-900">
                {metricsTitle}
              </Typography.H2>
              <Typography.P className="mx-auto max-w-3xl text-lg text-stone-600">
                {metricsDescription}
              </Typography.P>
            </motion.div>

            <div
              className={`mx-auto grid max-w-5xl grid-cols-1 gap-8 ${
                activeImpactMetrics.length === 1
                  ? "md:grid-cols-1"
                  : activeImpactMetrics.length === 2
                    ? "md:grid-cols-2"
                    : activeImpactMetrics.length === 3
                      ? "md:grid-cols-3"
                      : "md:grid-cols-4"
              }`}
              role="group"
              aria-label="Sustainability metrics"
            >
              {activeImpactMetrics.map((metric: any, index: number) => (
                <MetricCard key={metric.id} metric={metric} index={index} />
              ))}
            </div>

            {/* Show fallback message if no metrics */}
            {activeImpactMetrics.length === 0 && (
              <div className="py-8 text-center">
                <Typography.P className="text-stone-600">
                  No impact metrics configured. Add metrics in the admin panel to display here.
                </Typography.P>
              </div>
            )}
          </div>
        </section>

        {/* Sustainability Initiatives Section */}
        {activeInitiatives.length > 0 && (
          <InitiativesSection
            initiatives={activeInitiatives}
            mediaAssets={mediaAssets}
            title={initiativesTitle}
            description={initiativesDescription}
          />
        )}

        {/* Certificates Section */}
        {certificates.length > 0 && (
          <CertificatesSection
            certificates={certificates}
            title={certificationsTitle}
            description={certificationsDescription}
            footerNote={certificationsFooterNote}
          />
        )}

        {/* Sustainability Goals Section */}
        {activeGoals.length > 0 && (
          <GoalsSection goals={activeGoals} title={goalsTitle} description={goalsDescription} />
        )}

        {/* Fabric Portfolio Section */}
        {fabricPortfolioData && (
          <section className="bg-stone-50 py-20">
            <div className="container mx-auto px-4">
              <motion.div {...fadeInUp} className="mb-16 text-center">
                <Typography.H2 className="font-neue-stance mb-6 text-3xl font-bold text-stone-900">
                  {fabricPortfolioData.title}
                </Typography.H2>
                {fabricPortfolioData.description && (
                  <Typography.P className="mx-auto max-w-4xl text-lg text-stone-600">
                    {fabricPortfolioData.description}
                  </Typography.P>
                )}
              </motion.div>

              <FabricPortfolioSection mediaAssets={mediaAssets} />
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="relative overflow-hidden bg-stone-800 py-20 text-stone-100">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-stone-700" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-stone-700" />
          </div>

          <div className="z-modal-backdrop relative container mx-auto px-4 text-center">
            <motion.div {...fadeInUp}>
              <Typography.H2 className="font-neue-stance mb-4 text-3xl font-bold text-stone-100">
                {callToActionTitle}
              </Typography.H2>
              <Typography.P className="mx-auto mb-8 max-w-2xl text-lg text-stone-300">
                {callToActionDescription}
              </Typography.P>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-emerald-500 hover:bg-emerald-50"
                asChild
              >
                <Link to={callToActionButtonLink}>
                  {callToActionButtonText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </HydrationBoundary>
  );
}
