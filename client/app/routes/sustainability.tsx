import type { MediaAsset, SustainabilityBatchResponse } from "@shared/index";
import type { Certificate } from "@shared/schemas/catalog";
import type {
  SustainabilityGoal,
  SustainabilityInitiative,
  SustainabilityMetric,
} from "@shared/schemas/content/sustainability";
import { ArrowRight, Download } from "lucide-react";
import { useMemo, useRef } from "react";
import { Link } from "react-router";
import { SEOMeta } from "@/components/seo/seo-meta";
import {
  CertificatesSection,
  FabricPortfolioSection,
  GoalsSection,
  InitiativesSection,
  OptimizedSustainabilityHero,
} from "@/components/sustainability/sections";
import { Button } from "@/components/ui/button";
import { MarqueeStrip } from "@/components/ui/marquee-strip";
import { Typography } from "@/components/ui/typography";
import { gsap, useGSAP } from "@/lib/gsap";
import { getSustainabilityIcon } from "@/lib/sustainability-utils";
import { cn } from "@/lib/utils";
import type { Route } from "./+types/sustainability";

export async function loader({ request }: Route.LoaderArgs) {
  const base = new URL(request.url);
  const get = (path: string) =>
    fetch(new URL(path, base).toString())
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const batchData: SustainabilityBatchResponse | null = await get("/api/sustainability/batch");

  let backgroundMedia = null;
  let fetchedMediaAssets: MediaAsset[] = [];

  if (batchData) {
    const hero = batchData.hero;

    const activeInitiatives = batchData.initiatives?.filter((i) => i.isActive) || [];
    const fabrics = batchData.fabrics || [];
    const ids = new Set<number>();
    if (hero?.backgroundImageId) {
      ids.add(hero.backgroundImageId);
    }
    activeInitiatives.forEach((initiative) => {
      if (initiative.imageId) {
        ids.add(initiative.imageId);
      }
    });
    fabrics.forEach((fabric) => {
      if (fabric.visualSwatchId) {
        ids.add(fabric.visualSwatchId);
      }
    });

    const requiredMediaIds = Array.from(ids);
    const [mediaBatchRes, bgMediaRes] = await Promise.all([
      requiredMediaIds.length > 0
        ? get(`/api/media/batch/content?ids=${requiredMediaIds.join(",")}&prefetch=true`)
        : Promise.resolve(null),
      hero?.backgroundImageId ? get(`/api/media/${hero.backgroundImageId}`) : Promise.resolve(null),
    ]);

    if (mediaBatchRes?.success && Array.isArray(mediaBatchRes.data)) {
      fetchedMediaAssets = mediaBatchRes.data as MediaAsset[];
    }
    if (bgMediaRes) {
      backgroundMedia = bgMediaRes;
    }
  }

  return { batchData, backgroundMedia, fetchedMediaAssets };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sustainability | Run Apparel - Eco-Friendly Sportswear Manufacturing" },
    {
      name: "description",
      content:
        "Discover our dedication to sustainable manufacturing, eco-friendly materials, and environmental responsibility. Leading the future of responsible B2B sportswear production.",
    },
    {
      name: "keywords",
      content:
        "sustainable sportswear, eco-friendly manufacturing, recycled polyester, organic cotton, ethical apparel production, green textile manufacturing",
    },
    { property: "og:title", content: "Sustainability | Run Apparel" },
    {
      property: "og:description",
      content: "Leading the revolution in eco-conscious performance wear.",
    },
    { property: "og:type", content: "website" },
  ];
}

/* ─────────────────────────────────────────────
   Stitch 3-Line Hero Reveal
   ───────────────────────────────────────────── */
function HeroHeadline({ text }: { text: string }) {
  const words = text.split(" ");
  const line1 = words[0] ?? "Sustainability";
  const wovenWord = words[1] ?? "Woven";
  const intoWord = words[2] ?? "Into";
  const line3 = words.slice(3).join(" ") || "Every Thread";
  const containerRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      gsap.from(".hero-line", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.2,
      });
    },
    { scope: containerRef },
  );

  return (
    <h1
      ref={containerRef}
      className="flex flex-col gap-1 font-display text-5xl font-medium tracking-tight md:text-7xl lg:text-8xl"
    >
      <span className="hero-line self-start text-sustainability-head">{line1}</span>
      <span className="hero-line self-start pl-4 md:pl-8">
        <span className="italic text-sustainability-primary">{wovenWord}</span>{" "}
        <span className="text-sustainability-head">{intoWord}</span>
      </span>
      <span className="hero-line self-start pl-8 md:pl-16 text-sustainability-head">{line3}</span>
    </h1>
  );
}

/* ─────────────────────────────────────────────
   Floating Stat Card (bobbing, glassmorphism)
   ───────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string;
  unit: string | null;
  iconName: string | null;
  index: number;
}

const BOB_CLASSES = ["animate-bob-1", "animate-bob-2", "animate-bob-3", "animate-bob-4"] as const;
const MT_OFFSETS = ["mt-0", "md:mt-8", "md:-mt-8", "mt-0"] as const;

function StatCard({ label, value, unit, iconName, index }: StatCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const numericValue = parseFloat(value);
      if (!Number.isNaN(numericValue) && valueRef.current) {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: numericValue,
          duration: 2.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          onUpdate: () => {
            if (valueRef.current) {
              valueRef.current.textContent = Math.floor(obj.val).toLocaleString();
            }
          },
        });
      }
    },
    { scope: cardRef, dependencies: [value] },
  );

  const bobClass = BOB_CLASSES[index % BOB_CLASSES.length];
  const mtOffset = MT_OFFSETS[index % MT_OFFSETS.length];
  const isAccented = index === 3;

  return (
    <article
      ref={cardRef}
      className={cn(
        "stat-card flex flex-col items-center justify-center gap-1.5 rounded-2xl p-6 text-center backdrop-blur-xl",
        "transition-all duration-300 hover:scale-105 hover:border-sustainability-primary/30 hover:bg-white/5",
        "min-w-custom-space-303 max-w-custom-space-304 flex-1",
        bobClass,
        mtOffset,
        isAccented
          ? "border border-sustainability-primary/30 bg-sustainability-primary/5"
          : "border border-sustainability-border bg-sustainability-card",
        "shadow-sustainability-card",
      )}
      aria-label={`${label}: ${value}${unit || ""}`}
    >
      <div className="mb-2">{getSustainabilityIcon(iconName, "md")}</div>
      <span className="text-xs font-medium uppercase tracking-wider whitespace-nowrap text-sustainability-muted">
        {label}
      </span>
      <span className="font-neue-stance text-2xl font-bold text-sustainability-head">
        {!Number.isNaN(parseFloat(value)) ? <span ref={valueRef}>0</span> : value}
        {unit && <span className="text-sm ml-0.5 text-sustainability-primary">{unit}</span>}
      </span>
    </article>
  );
}

/* ─────────────────────────────────────────────
   Impact Counter Card (large, in the grid below)
   ───────────────────────────────────────────── */
interface ImpactCounterCardProps {
  name: string;
  value: string;
  unit: string | null;
  description: string | null;
  iconName: string | null;
}

function ImpactCounterCard({ name, value, unit, description, iconName }: ImpactCounterCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const numericValue = parseFloat(value);
      if (!Number.isNaN(numericValue) && valueRef.current) {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: numericValue,
          duration: 2.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          onUpdate: () => {
            if (valueRef.current) {
              valueRef.current.textContent = Math.floor(obj.val).toLocaleString();
            }
          },
        });
      }
    },
    { scope: cardRef, dependencies: [value] },
  );

  const isNumeric = !Number.isNaN(parseFloat(value));

  return (
    <article
      ref={cardRef}
      className="impact-card group bg-sustainability-card p-8 text-center transition-all duration-300 hover:bg-sustainability-card/10"
      aria-label={`${name}: ${value}${unit || ""}`}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sustainability-primary/5 group-hover:bg-sustainability-primary/20 transition-colors duration-300 text-gray-400 group-hover:text-sustainability-primary">
        {getSustainabilityIcon(iconName, "lg")}
      </div>
      <div className="font-neue-stance text-3xl md:text-4xl font-bold text-sustainability-head mb-1">
        {isNumeric ? <span ref={valueRef}>0</span> : value}
        {unit && <span className="text-xl ml-1 text-sustainability-primary">{unit}</span>}
      </div>
      <p className="text-xs uppercase tracking-wider text-sustainability-primary font-medium">
        {name}
      </p>
      {description && (
        <p className="text-sm text-sustainability-muted leading-relaxed mt-2">{description}</p>
      )}
    </article>
  );
}

/* ═════════════════════════════════════════════
   SUSTAINABILITY PAGE
   ═════════════════════════════════════════════ */
type LoaderData = {
  batchData: SustainabilityBatchResponse | null;
  backgroundMedia: MediaAsset | null;
  fetchedMediaAssets: MediaAsset[];
};

export function Component({ loaderData }: { loaderData: LoaderData }) {
  const { batchData, backgroundMedia, fetchedMediaAssets } = loaderData;

  return (
    <SustainabilityInner
      batchData={batchData}
      backgroundMedia={backgroundMedia}
      fetchedMediaAssets={fetchedMediaAssets}
    />
  );
}

function SustainabilityInner({
  batchData,
  backgroundMedia,
  fetchedMediaAssets = [],
}: {
  batchData: SustainabilityBatchResponse | null;
  backgroundMedia: MediaAsset | null;
  fetchedMediaAssets: MediaAsset[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Initial Stat Cards Reveal
      tl.from(".stat-card", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.1,
        delay: 0.8,
      });

      // Reveal Impact Cards on scroll using ScrollTrigger
      gsap.utils.toArray<HTMLElement>(".impact-card").forEach((card) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          y: 30,
          duration: 0.6,
          ease: "power2.out",
        });
      });

      // Reveal Highlighted Features with back.out easing
      gsap.utils.toArray<HTMLElement>(".feature-card").forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          y: 30,
          scale: 0.95,
          duration: 0.6,
          delay: i * 0.1,
          ease: "back.out(1.7)",
        });
      });

      // General fade-ups mapped from previous logic
      gsap.utils.toArray<HTMLElement>(".fade-up-scroll").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          y: 30,
          duration: 0.8,
        });
      });

      // Hero Elements Reveal
      tl.from(".hero-esg", { opacity: 0, y: -15, duration: 0.8 }, 0.2)
        .from(".hero-sub", { opacity: 0, y: 30, duration: 0.8 }, 0.6)
        .from(".hero-btns", { opacity: 0, y: 30, duration: 0.8 }, 0.8);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        tl.progress(1).kill();
        gsap.utils
          .toArray<HTMLElement>(".impact-card, .feature-card, .fade-up-scroll")
          .forEach((card) => {
            gsap.killTweensOf(card);
            gsap.set(card, { clearProps: "all" });
          });
      }
    },
    { scope: containerRef },
  );

  const unifiedData = batchData?.hero;
  const activeImpactMetrics =
    batchData?.metrics?.filter((m: SustainabilityMetric) => m.isActive) || [];
  const activeInitiatives =
    batchData?.initiatives?.filter((i: SustainabilityInitiative) => i.isActive) || [];
  const activeGoals = batchData?.goals?.filter((g: SustainabilityGoal) => g.isActive) || [];
  const allCertificates = batchData?.certificates || [];

  // Extract features data from unified model
  const highlightedFeatures =
    (
      batchData as unknown as {
        features?: Array<{ id?: number; title?: string; description?: string; isActive?: boolean }>;
      }
    )?.features?.filter((f) => f.isActive) || [];
  const featuresData = unifiedData?.featuresTitle
    ? {
        title: unifiedData.featuresTitle,
        description: unifiedData.featuresDescription || "",
        highlightedFeatures: highlightedFeatures,
      }
    : null;

  const fabricPortfolioData = unifiedData?.fabricPortfolioTitle
    ? {
        title: unifiedData.fabricPortfolioTitle,
        description: unifiedData.fabricPortfolioDescription || "",
        selectedFabricIds:
          ((unifiedData.data as Record<string, unknown>)?.selectedFabricIds as number[]) || [],
      }
    : null;

  const metricsDescription =
    unifiedData?.metricsDescription ||
    "Measuring our commitment to environmental sustainability through real metrics and achievements.";

  const certificationsTitle = unifiedData?.certificationsTitle || "Trusted Standards";
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

  const goalsTitle = unifiedData?.goalsTitle || "2030 Sustainability Roadmap";
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

  const mediaAssets = useMemo(() => {
    const combined = [...fetchedMediaAssets];
    if (backgroundMedia) {
      if (!combined.find((m) => m.id === backgroundMedia.id)) {
        combined.push(backgroundMedia);
      }
    }
    return combined;
  }, [fetchedMediaAssets, backgroundMedia]);

  const certificates = unifiedData?.certificationIds
    ? allCertificates.filter((cert: Certificate) => unifiedData.certificationIds?.includes(cert.id))
    : [];

  return (
    <div
      ref={containerRef}
      className="sustainability-page relative min-h-screen overflow-hidden bg-sustainability-bg"
    >
      <SEOMeta
        title="Sustainability & Environmental Responsibility"
        description="Discover our commitment to sustainable manufacturing, eco-friendly materials, and environmental initiatives. Leading the future of responsible sportswear production."
      />

      {/* ─── Hero Section ─── */}
      <header className="relative flex min-h-custom-space-305 items-center justify-center overflow-hidden bg-sustainability-bg text-sustainability-head px-6 py-20 lg:px-10">
        <div
          className="absolute inset-0 z-0 opacity-40 will-change-transform"
          data-scroll
          data-scroll-speed="-0.3"
        >
          {/* Emerald radial gradient background */}
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 70% 30%, color-mix(in srgb, var(--color-sustainability-primary) 15%, transparent) 0%, transparent 60%), radial-gradient(circle at 10% 80%, color-mix(in srgb, var(--color-sustainability-primary) 8%, transparent) 0%, transparent 50%)",
            }}
          />

          {/* Background Media */}
          {backgroundMedia && (
            <div className="absolute inset-0 z-0 opacity-40">
              <OptimizedSustainabilityHero media={backgroundMedia} />
            </div>
          )}
          {/* Leaf-vein organic texture overlay */}
          <div className="absolute inset-0 pointer-events-none leaf-vein-bg opacity-30 z-custom-misc-479" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
          {/* ESG badge */}
          <div
            className="hero-esg mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm"
            style={{
              borderColor:
                "color-mix(in srgb, var(--color-sustainability-primary) 30%, transparent)",
              backgroundColor:
                "color-mix(in srgb, var(--color-sustainability-primary) 10%, transparent)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: "var(--color-sustainability-primary)" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--color-sustainability-primary)" }}
              />
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-sustainability-primary)" }}
            >
              2024 ESG Report Live
            </span>
          </div>

          <div className="mb-8">
            <HeroHeadline text={hero?.headline || "Sustainability Woven Into Every Thread"} />
          </div>

          <p
            className="hero-sub mb-10 max-w-2xl text-lg font-light leading-relaxed md:text-xl"
            style={{ color: "var(--color-sustainability-muted)" }}
          >
            {hero?.subheadline ||
              "Leading the revolution in eco-conscious performance wear. We engineer fabrics that perform for the athlete and protect the planet."}
          </p>

          <div className="hero-btns flex flex-wrap items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="h-14 min-w-custom-space-306 rounded-full bg-sustainability-primary px-8 text-base font-bold text-black shadow-custom-misc-480 transition hover:scale-105 hover:bg-white border-0"
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
              className="h-14 min-w-custom-space-307 rounded-full border-sustainability-border bg-sustainability-card px-8 text-base text-sustainability-head backdrop-blur-md hover:bg-sustainability-card/10"
              asChild
            >
              <Link to="/contact">
                <Download className="mr-2 h-4 w-4" />
                Download ESG Report
              </Link>
            </Button>
          </div>

          {activeImpactMetrics.length > 0 && (
            <div className="grid grid-cols-2 gap-3 w-full md:flex md:flex-row md:flex-wrap md:justify-center md:gap-4 lg:gap-6">
              {activeImpactMetrics
                .slice(0, 4)
                .map((metric: SustainabilityMetric, index: number) => (
                  <StatCard
                    key={metric.id}
                    label={metric.name}
                    value={metric.value}
                    unit={metric.unit}
                    iconName={metric.iconName}
                    index={index}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Animated gradient line */}
        <div className="absolute bottom-0 left-0 w-full h-custom-space-308 animated-gradient-border" />
      </header>

      <main>
        {/* ─── Marquee Strip ─── */}
        <section
          className="relative w-full overflow-hidden bg-sustainability-primary/10 py-4 backdrop-blur-sm border-b border-sustainability-primary/20"
          aria-label="Sustainability practices ticker"
        >
          <MarqueeStrip
            text={
              (unifiedData as unknown as Record<string, string>)?.marqueeText ||
              "Organic Cotton • Recycled Polyester • Regenerative Agriculture • Biodegradable Fibers • Circular Economy •"
            }
            accentColor="var(--color-sustainability-marquee-bg)"
            speed={80}
          />
        </section>

        {/* ─── MERGED: Our Sustainable Impact (Features + Metrics) ─── */}
        <section
          id="impact"
          className="relative py-24 lg:py-28"
          aria-label="Sustainability impact metrics"
          style={{ backgroundColor: "var(--color-sustainability-bg)" }}
        >
          <div className="container mx-auto px-6 lg:px-10">
            <div className="fade-up-scroll mb-12 flex flex-col gap-4">
              <Typography.H2
                className="font-neue-stance text-3xl font-bold md:text-5xl"
                style={{ color: "var(--color-sustainability-head)" }}
              >
                Engineered for{" "}
                <span style={{ color: "var(--color-sustainability-primary)" }}>Impact</span>
              </Typography.H2>
              <Typography.P
                className="max-w-2xl"
                style={{ color: "var(--color-sustainability-muted)" }}
              >
                {featuresData?.description || metricsDescription}
              </Typography.P>
            </div>

            {/* Top Row: Highlighted Features (glass cards with emerald left-border) */}
            {featuresData?.highlightedFeatures && featuresData.highlightedFeatures.length > 0 && (
              <div className="grid gap-6 md:grid-cols-3 mb-16">
                {featuresData.highlightedFeatures.map((feature, index: number) => (
                  <div
                    key={feature.id || index}
                    className="feature-card group relative overflow-hidden rounded-3xl border border-sustainability-border bg-sustainability-card p-8 backdrop-blur-md transition hover:shadow-lg hover:border-sustainability-primary/30"
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-sustainability-primary to-transparent" />
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sustainability-primary/10 text-sustainability-primary transition-colors group-hover:bg-sustainability-primary group-hover:text-black">
                      {getSustainabilityIcon(null, "md")}
                    </div>
                    <Typography.H3 className="mb-2 text-xl font-bold text-sustainability-head">
                      {feature.title}
                    </Typography.H3>
                    <Typography.P className="text-sm leading-relaxed text-sustainability-muted">
                      {feature.description}
                    </Typography.P>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Area: Impact Metric Counters - in a segmented grid */}
            {activeImpactMetrics.length > 0 && (
              <section
                className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-sustainability-border lg:grid-cols-4 bg-sustainability-border"
                aria-label="Sustainability metrics"
              >
                {activeImpactMetrics.map((metric: SustainabilityMetric) => (
                  <ImpactCounterCard
                    key={metric.id}
                    name={metric.name}
                    value={metric.value}
                    unit={metric.unit}
                    description={metric.description}
                    iconName={metric.iconName}
                  />
                ))}
              </section>
            )}

            {activeImpactMetrics.length === 0 && (
              <div className="py-8 text-center">
                <Typography.P className="text-sustainability-muted">
                  No impact metrics configured. Add metrics in the admin panel to display here.
                </Typography.P>
              </div>
            )}
          </div>
        </section>

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

        {/* ─── Sustainability Goals / Roadmap ─── */}
        {activeGoals.length > 0 && (
          <GoalsSection goals={activeGoals} title={goalsTitle} description={goalsDescription} />
        )}

        {/* ─── Fabric Portfolio Section ─── */}
        {fabricPortfolioData && (
          <section className="bg-sustainability-section py-24 relative overflow-hidden">
            {/* Dot pattern background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-5 mix-blend-screen"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%2300c97b' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}
            />

            <div className="container mx-auto px-6 lg:px-10 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
              <div>
                <Typography.H2 className="font-neue-stance text-3xl font-bold text-sustainability-head mb-2">
                  Sustainable <span className="text-sustainability-primary">Material Library</span>
                </Typography.H2>
                <Typography.P className="text-sustainability-muted">
                  {fabricPortfolioData.description || "Browse our top-rated eco-fabrics."}
                </Typography.P>
              </div>
            </div>

            <div className="relative z-10">
              <FabricPortfolioSection
                mediaAssets={mediaAssets || []}
                selectedFabricIds={
                  ((unifiedData?.data as Record<string, unknown>)?.selectedFabricIds as number[]) ||
                  []
                }
                fabrics={batchData?.fabrics || []}
              />
            </div>
          </section>
        )}

        {/* ─── CTA Footer — Dramatic Stitch-Faithful Redesign ─── */}
        <footer className="relative mt-20 overflow-hidden bg-sustainability-bg pt-32 pb-12">
          {/* Dramatic radial gradient backdrop */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--color-sustainability-primary) 30%, transparent) 0%, color-mix(in srgb, var(--color-sustainability-primary) 50%, transparent) 50%, transparent 100%)",
            }}
          />

          <div className="relative z-10 container mx-auto max-w-7xl px-6 lg:px-10">
            {/* CTA Content */}
            <div className="fade-up-scroll mb-20 flex flex-col items-center text-center">
              <h2 className="mb-6 font-display text-5xl font-bold tracking-tight text-sustainability-head md:text-7xl">
                {(callToActionTitle || "Join Our Sustainable Journey").split(" ").length > 2 ? (
                  <>
                    {(callToActionTitle || "Join Our Sustainable Journey")
                      .split(" ")
                      .slice(0, 2)
                      .join(" ")}
                    <br />
                    <span className="italic text-sustainability-primary">
                      {(callToActionTitle || "Join Our Sustainable Journey")
                        .split(" ")
                        .slice(2)
                        .join(" ")}
                    </span>
                  </>
                ) : (
                  callToActionTitle || "Join Our Sustainable Journey"
                )}
              </h2>
              <p className="mb-10 max-w-xl text-lg text-sustainability-muted">
                {callToActionDescription ||
                  "Partner with a manufacturer that prioritizes the planet as much as performance. Let's build the future of sportswear together."}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="h-14 min-w-custom-space-309 rounded-full bg-sustainability-primary px-8 text-lg font-bold text-sustainability-bg shadow-custom-misc-481 transition hover:scale-105 hover:bg-white border-0"
                  asChild
                >
                  <Link to={callToActionButtonLink}>
                    {callToActionButtonText}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-6 border-t border-sustainability-border pt-12 md:flex-row">
              <div className="flex items-center gap-6">
                <img src="/logo.png" alt="RUN Logo" loading="lazy" className="h-8 w-auto invert" />
                <p className="text-sm text-sustainability-muted">
                  © {new Date().getFullYear()} RUN APPAREL (PVT) LTD. All rights reserved.
                </p>
              </div>
              <div className="flex gap-8">
                <Link
                  to="/privacy"
                  className="text-sm text-sustainability-muted transition hover:text-sustainability-primary"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="text-sm text-sustainability-muted transition hover:text-sustainability-primary"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };
