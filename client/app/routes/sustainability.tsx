import type { MediaAsset, SustainabilityBatchResponse } from "@shared/index";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Download } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { isRouteErrorResponse, Link, useLoaderData, useRouteError } from "react-router";
import { SEOMeta } from "@/components/seo/seo-meta";

import {
  CertificatesSection,
  FabricPortfolioSection,
  GoalsSection,
  InitiativesSection,
  OptimizedSustainabilityHero,
} from "@/components/sustainability/sections";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from "@/components/ui/button";
import { MarqueeStrip } from "@/components/ui/marquee-strip";
import { headingVariants, Typography } from "@/components/ui/typography";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { fadeInUp, springTransition } from "@/lib/animations";
import { countUpAnimation } from "@/lib/gsap-animations";
import { apiRequest, batchFetchMediaContent, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { getSustainabilityIcon } from "@/lib/sustainability-utils";
import type { Route } from "./+types/sustainability";

gsap.registerPlugin(ScrollTrigger);

export async function loader() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["/api/sustainability/batch"],
    queryFn: () => apiRequest("/api/sustainability/batch"),
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

/* ─────────────────────────────────────────────
   GSAP Word-by-Word Reveal Hook
   ───────────────────────────────────────────── */
function useWordReveal(text: string, highlightWord?: string) {
  const containerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const words = el.querySelectorAll<HTMLSpanElement>(".gsap-word");
    if (!words.length) return;

    gsap.set(words, { opacity: 0, y: 40 });

    gsap.to(words, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [text]);

  const rendered = text.split(" ").map((word, i) => {
    const isHighlighted = highlightWord && word.toLowerCase().includes(highlightWord.toLowerCase());
    return (
      <span
        key={i}
        className={cn("gsap-word inline-block mr-[0.3em]", isHighlighted && "text-[#00C97B]")}
      >
        {word}
      </span>
    );
  });

  return { containerRef, rendered };
}

/* ─────────────────────────────────────────────
   Floating Stat Pill (Glass-morphism, count-up)
   ───────────────────────────────────────────── */
interface StatPillProps {
  label: string;
  value: string;
  unit: string | null;
  index: number;
}

function StatPill({ label, value, unit, index }: StatPillProps) {
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const numericValue = parseFloat(value);
    if (!Number.isNaN(numericValue) && valueRef.current) {
      countUpAnimation(valueRef.current, numericValue, 2.5);
    }
  }, [value]);

  const numericValue = parseFloat(value);
  const isNumeric = !Number.isNaN(numericValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.8 + index * 0.15 }}
      className="flex flex-col items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.1] backdrop-blur-xl px-5 py-3 md:px-6 md:py-4"
    >
      <span className="font-neue-stance text-xl md:text-2xl font-bold text-[#00C97B]">
        {isNumeric ? <span ref={valueRef}>0</span> : value}
        {unit && <span className="text-sm ml-0.5 text-white/60">{unit}</span>}
      </span>
      <span className="text-xs text-[#E3DFD6]/70 whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Merged Impact Card (large counter)
   ───────────────────────────────────────────── */
interface ImpactCounterCardProps {
  name: string;
  value: string;
  unit: string | null;
  description: string | null;
  iconName: string | null;
  index: number;
}

function ImpactCounterCard({ name, value, unit, description, iconName, index }: ImpactCounterCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const numericValue = parseFloat(value);
    if (!Number.isNaN(numericValue) && valueRef.current) {
      countUpAnimation(valueRef.current, numericValue, 2.5);
    }
  }, [value]);

  const numericValue = parseFloat(value);
  const isNumeric = !Number.isNaN(numericValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ...springTransition, delay: index * 0.1 }}
      className="group rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-6 md:p-8 text-center transition-all duration-300 hover:bg-white/[0.07] hover:border-[#00C97B]/20"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#00C97B]/10">
        {getSustainabilityIcon(iconName, "lg")}
      </div>
      <div className="font-neue-stance text-4xl md:text-5xl font-bold text-white mb-1">
        {isNumeric ? <span ref={valueRef}>0</span> : value}
        {unit && <span className="text-2xl ml-1 text-[#00C97B]">{unit}</span>}
      </div>
      <p className="text-[#E3DFD6] font-medium mb-2">{name}</p>
      {description && (
        <p className="text-sm text-[#68869A] leading-relaxed">{description}</p>
      )}
    </motion.div>
  );
}

/* ═════════════════════════════════════════════
   SUSTAINABILITY PAGE
   ═════════════════════════════════════════════ */
export default function Sustainability() {
  const loaderData = useLoaderData<typeof loader>();
  
  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <SustainabilityInner />
    </HydrationBoundary>
  );
}

function SustainabilityInner() {
  const { scrollY } = useScroll();
  const isMobile = useIsMobile();

  // Parallax transforms
  const heroY = useTransform(scrollY, [0, 500], [0, isMobile ? -50 : -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, isMobile ? 1 : 0]);

  // Queries for unified sustainability data (Batch Request)
  const { data: batchData } = useQuery<SustainabilityBatchResponse>({
    queryKey: ["/api/sustainability/batch"],
    queryFn: () => apiRequest("/api/sustainability/batch"),
    staleTime: 5 * 60 * 1000,
  });

  const unifiedData = batchData?.hero;
  const activeImpactMetrics = batchData?.metrics?.filter((m) => m.isActive) || [];
  const activeInitiatives = batchData?.initiatives?.filter((i) => i.isActive) || [];
  const activeGoals = batchData?.goals?.filter((g) => g.isActive) || [];
  const allCertificates = batchData?.certificates || [];

  // Extract features data from unified model
  const featuresData = unifiedData?.featuresTitle
    ? {
        title: unifiedData.featuresTitle,
        description: unifiedData.featuresDescription || "",
        highlightedFeatures:
          (unifiedData.data?.highlightedFeatures as { title: string; description: string }[]) || [],
      }
    : null;

  const fabricPortfolioData = unifiedData?.fabricPortfolioTitle
    ? {
        title: unifiedData.fabricPortfolioTitle,
        description: unifiedData.fabricPortfolioDescription || "",
        selectedFabricIds: (unifiedData.data?.selectedFabricIds as number[]) || [],
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

  // GSAP word-by-word reveal for hero headline
  const headlineText = hero?.headline || "Pioneering Sustainable Future";
  const { containerRef: headlineRef, rendered: headlineWords } = useWordReveal(
    headlineText,
    "Sustainable"
  );

  // OPTIMIZED: Fetch specific background media only if ID exists
  const { data: backgroundMedia } = useQuery<MediaAsset>({
    queryKey: ["/api/media", hero?.backgroundImageId],
    queryFn: () => apiRequest(`/api/media/${hero?.backgroundImageId}`),
    enabled: !!hero?.backgroundImageId,
    staleTime: 10 * 60 * 1000,
  });

  // PHASE 4 REMEDIATION: Correctly populate media assets for the page
  const requiredMediaIds = useMemo(() => {
    const ids = new Set<number>();

    if (hero?.backgroundImageId) {
      ids.add(hero.backgroundImageId);
    }

    activeInitiatives.forEach((initiative) => {
      if (initiative.imageId) {
        ids.add(initiative.imageId);
      }
    });

    const fabricsToCollect = batchData?.fabrics || [];
    fabricsToCollect.forEach((fabric) => {
      if (fabric.visualSwatchId) {
        ids.add(fabric.visualSwatchId);
      }
    });

    return Array.from(ids);
  }, [hero?.backgroundImageId, activeInitiatives, batchData?.fabrics]);

  const { data: fetchedMediaAssets = [] } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media", "batch", requiredMediaIds],
    queryFn: async () => {
      if (requiredMediaIds.length === 0) {
        return [];
      }
      const results = await batchFetchMediaContent(requiredMediaIds);
      return results.map((r) => ({
        id: r.id,
        url: r.url || "",
        mimeType: r.mimeType || "image/jpeg",
        filename: r.filename || "",
        type: r.type || "image",
        storagePath: "",
        bucketName: "",
        metadata: {},
      })) as MediaAsset[];
    },
    enabled: requiredMediaIds.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const mediaAssets = useMemo(() => {
    const combined = [...fetchedMediaAssets];
    if (backgroundMedia) {
      if (!combined.find((m) => m.id === backgroundMedia.id)) {
        combined.push(backgroundMedia);
      }
    }
    return combined;
  }, [fetchedMediaAssets, backgroundMedia]);

  // Filter certificates based on selected certificationIds
  const certificates = unifiedData?.certificationIds
    ? allCertificates.filter((cert) => unifiedData.certificationIds?.includes(cert.id))
    : [];

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
        <SEOMeta
          title="Sustainability & Environmental Responsibility"
          description="Discover our commitment to sustainable manufacturing, eco-friendly materials, and environmental initiatives. Leading the future of responsible sportswear production."
        />

        <BackgroundRippleEffect />

        {/* ─── Hero Section ─── */}
        <motion.section
          className="relative flex h-hero-mobile items-center justify-center overflow-hidden bg-[#0A0A0A] text-white md:h-screen"
          style={{ y: heroY, opacity: heroOpacity }}
          role="banner"
          aria-label="Sustainability hero section"
        >
          {/* Background Media */}
          {backgroundMedia && <OptimizedSustainabilityHero media={backgroundMedia} />}

          {/* Leaf-vein organic texture overlay */}
          <div className="absolute inset-0 pointer-events-none bg-sustainability-hero-overlay" />

          {/* Hero Content */}
          <div className="z-elevated relative mx-auto max-w-5xl px-4 text-center">
            <h1
              ref={headlineRef}
              className={cn(headingVariants({ variant: "h1" }), "mb-6 text-white md:text-5xl lg:text-6xl flex flex-wrap justify-center")}
            >
              {headlineWords}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.6 }}
              className="mb-10 text-lg text-[#E3DFD6] md:text-xl max-w-3xl mx-auto"
            >
              {hero?.subheadline || "Leading the way in eco-friendly sportswear manufacturing"}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="bg-[#00C97B] text-white hover:bg-[#00C97B]/90 border-0"
                asChild
              >
                <Link to="#impact">
                  See Our Impact
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
                asChild
              >
                <Link to="/contact">
                  <Download className="mr-2 h-4 w-4" />
                  Download ESG Report
                </Link>
              </Button>
            </motion.div>

            {/* Floating Stat Badges */}
            {activeImpactMetrics.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-3 md:gap-4">
                {activeImpactMetrics.slice(0, 4).map((metric, index) => (
                  <StatPill
                    key={metric.id}
                    label={metric.name}
                    value={metric.value}
                    unit={metric.unit}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* ─── MERGED: Our Sustainable Impact (Features + Metrics) ─── */}
        <section
          id="impact"
          className="relative bg-[#0A0A0A] py-20 md:py-28 bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,201,123,0.03)_0%,transparent_70%)]"
          role="main"
          aria-label="Sustainability impact metrics"
        >
          <div className="container mx-auto px-4">
            <motion.div {...fadeInUp} className="mb-16 text-center">
              <Typography.H2 className="font-neue-stance mb-4 text-3xl font-bold text-white md:text-4xl">
                {featuresData?.title || metricsTitle}
              </Typography.H2>
              <Typography.P className="mx-auto max-w-3xl text-lg text-[#E3DFD6]">
                {featuresData?.description || metricsDescription}
              </Typography.P>
            </motion.div>

            {/* Top Row: Highlighted Features (glass cards with emerald left-border) */}
            {featuresData?.highlightedFeatures && featuresData.highlightedFeatures.length > 0 && (
              <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
                {featuresData.highlightedFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...springTransition, delay: index * 0.1 }}
                    className="rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-6 border-l-4 border-l-[#00C97B] transition-all duration-300 hover:bg-white/[0.07]"
                  >
                    <Typography.H3 className="mb-3 text-xl font-semibold text-white">
                      {feature.title}
                    </Typography.H3>
                    <Typography.P className="leading-relaxed text-[#E3DFD6]">
                      {feature.description}
                    </Typography.P>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Bottom Area: Impact Metric Counters */}
            <div
              className={cn(
                "mx-auto grid max-w-5xl grid-cols-1 gap-6",
                activeImpactMetrics.length === 1
                  ? "md:grid-cols-1"
                  : activeImpactMetrics.length === 2
                    ? "md:grid-cols-2"
                    : activeImpactMetrics.length === 3
                      ? "md:grid-cols-3"
                      : "md:grid-cols-2 lg:grid-cols-4"
              )}
              role="group"
              aria-label="Sustainability metrics"
            >
              {activeImpactMetrics.map((metric, index) => (
                <ImpactCounterCard
                  key={metric.id}
                  name={metric.name}
                  value={metric.value}
                  unit={metric.unit}
                  description={metric.description}
                  iconName={metric.iconName}
                  index={index}
                />
              ))}
            </div>

            {activeImpactMetrics.length === 0 && (
              <div className="py-8 text-center">
                <Typography.P className="text-[#68869A]">
                  No impact metrics configured. Add metrics in the admin panel to display here.
                </Typography.P>
              </div>
            )}
          </div>
        </section>

        {/* ─── Marquee Strip ─── */}
        <MarqueeStrip
          text="ORGANIC • RECYCLED • BIODEGRADABLE • ETHICAL • CERTIFIED • ZERO-WASTE •"
          accentColor="#00C97B"
          speed={80}
        />

        {/* ─── Sustainability Initiatives Section ─── */}
        {activeInitiatives.length > 0 && (
          <InitiativesSection
            initiatives={activeInitiatives}
            mediaAssets={mediaAssets}
            title={initiativesTitle}
            description={initiativesDescription}
          />
        )}

        {/* ─── Certificates Section ─── */}
        {certificates.length > 0 && (
          <CertificatesSection
            certificates={certificates}
            title={certificationsTitle}
            description={certificationsDescription}
            footerNote={certificationsFooterNote}
          />
        )}

        {/* ─── Sustainability Goals Section ─── */}
        {activeGoals.length > 0 && (
          <GoalsSection goals={activeGoals} title={goalsTitle} description={goalsDescription} />
        )}

        {/* ─── Fabric Portfolio Section ─── */}
        {fabricPortfolioData && (
          <section className="bg-[#0F0F0F] py-20">
            <div className="container mx-auto px-4">
              <motion.div {...fadeInUp} className="mb-16 text-center">
                <Typography.H2 className="font-neue-stance mb-6 text-3xl font-bold text-white">
                  {fabricPortfolioData.title}
                </Typography.H2>
                {fabricPortfolioData.description && (
                  <Typography.P className="mx-auto max-w-4xl text-lg text-[#E3DFD6]">
                    {fabricPortfolioData.description}
                  </Typography.P>
                )}
              </motion.div>

              <FabricPortfolioSection
                mediaAssets={mediaAssets || []}
                selectedFabricIds={unifiedData?.data?.selectedFabricIds || []}
                fabrics={batchData?.fabrics || []}
              />
            </div>
          </section>
        )}

        {/* ─── Call to Action ─── */}
        <section className="relative overflow-hidden bg-[#0A0A0A] py-20 text-white border-t border-white/[0.08]">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#00C97B]" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#00C97B]" />
          </div>

          <div className="z-elevated relative container mx-auto px-4 text-center">
            <motion.div {...fadeInUp}>
              <Typography.H2 className="font-neue-stance mb-4 text-3xl font-bold text-white">
                {callToActionTitle}
              </Typography.H2>
              <Typography.P className="mx-auto mb-8 max-w-2xl text-lg text-[#E3DFD6]">
                {callToActionDescription}
              </Typography.P>
              <Button
                size="lg"
                className="bg-[#00C97B] text-white hover:bg-[#00C97B]/90 border-0"
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
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let message = "Oops! Something went wrong.";
  let details = "An unexpected error occurred while loading this page.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Content Not Found" : "Error";
    details = error.statusText || details;
  }

  return (
    <div className="flex bg-[#0A0A0A] text-white min-h-[50vh] items-center justify-center p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{message}</h1>
        <p className="text-[#68869A]">{details}</p>
        <Button
          asChild
          variant="outline"
          className="text-white border-white/20 hover:bg-white/10"
        >
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
