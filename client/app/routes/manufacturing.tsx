import type {
  ManufacturingCapability,
  ManufacturingHero,
  ManufacturingProcess,
  ManufacturingQuality,
  MediaAsset,
} from "@shared/index";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { useLoaderData } from "react-router";
import {
  ManufacturingErrorBoundary,
  ManufacturingLoadingSkeleton,
} from "@/components/error-boundaries/manufacturing-error-boundary";
import { FactoryGallery } from "@/components/public/manufacturing/FactoryGallery";
import { ProductionBlueprint } from "@/components/public/manufacturing/ProductionBlueprint";
import { PublicCapabilitySection } from "@/components/public/manufacturing/PublicCapabilitySection";
import { PublicCaseStudySection } from "@/components/public/manufacturing/PublicCaseStudySection";
import { PublicCTASection } from "@/components/public/manufacturing/PublicCTASection";
import { PublicHeroSection } from "@/components/public/manufacturing/PublicHeroSection";
import { PublicQualitySection } from "@/components/public/manufacturing/PublicQualitySection";
import { MarqueeStrip } from "@/components/ui/marquee-strip";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import type { Route } from "./+types/manufacturing";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Manufacturing | RUN APPAREL - Premium B2B Sportswear Production" },
    {
      name: "description",
      content:
        "World-class sportswear manufacturing facilities in Sialkot, Pakistan. 135+ years of heritage craftsmanship with 1.2M+ annual capacity, end-to-end quality control, sustainable production, and B2B custom apparel solutions for global brands.",
    },
    {
      name: "keywords",
      content:
        "sportswear manufacturing, B2B apparel production, custom sportswear, sustainable manufacturing, Pakistan textile, quality control, teamwear production, activewear manufacturer",
    },
    {
      property: "og:title",
      content: "Manufacturing | RUN APPAREL - Premium B2B Sportswear Production",
    },
    {
      property: "og:description",
      content:
        "World-class sportswear manufacturing with 135+ years of heritage. 1.2M+ annual capacity, sustainable production, and custom B2B solutions for global brands.",
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://wear-run.com/manufacturing" },
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "Manufacturing | RUN APPAREL - Premium B2B Sportswear Production",
    },
    {
      name: "twitter:description",
      content:
        "World-class sportswear manufacturing with 135+ years of heritage. 1.2M+ annual capacity, sustainable production, and custom B2B solutions.",
    },
  ];
}

/**
 * Generates JSON-LD structured data for the Manufacturing page.
 * Includes Organization and ManufacturingBusiness schemas for SEO.
 */
function generateStructuredData(): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://wear-run.com/#organization",
        name: "RUN APPAREL PVT LTD",
        url: "https://wear-run.com",
        logo: {
          "@type": "ImageObject",
          url: "https://wear-run.com/logo.png",
        },
        description:
          "Premium B2B sportswear manufacturing company with 135+ years of heritage craftsmanship in Sialkot, Pakistan.",
        foundingDate: "1889",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Sialkot",
          addressRegion: "Punjab",
          addressCountry: "Pakistan",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          email: "team@wear-run.com",
        },
        sameAs: ["https://www.linkedin.com/company/run-apparel"],
      },
      {
        "@type": "ManufacturingBusiness",
        "@id": "https://wear-run.com/manufacturing#business",
        name: "RUN APPAREL Manufacturing",
        description:
          "World-class sportswear manufacturing facilities with end-to-end quality control, sustainable production practices, and B2B custom apparel solutions.",
        url: "https://wear-run.com/manufacturing",
        isPartOf: { "@id": "https://wear-run.com/#organization" },
        address: {
          "@type": "PostalAddress",
          addressLocality: "Sialkot",
          addressRegion: "Punjab",
          addressCountry: "Pakistan",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: "32.4945",
          longitude: "74.5229",
        },
        openingHours: "Mo-Fr 08:00-18:00",
        priceRange: "$$",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "150",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Sportswear Manufacturing Services",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Custom Teamwear Production",
                description:
                  "Bespoke teamwear and activewear manufacturing for sports teams and corporate clients.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Sustainable Apparel Manufacturing",
                description:
                  "Eco-friendly sportswear production using recycled materials and ethical practices.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Private Label Sportswear",
                description:
                  "Full-service private label manufacturing for global sportswear brands.",
              },
            },
          ],
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://wear-run.com/manufacturing#breadcrumb",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://wear-run.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Manufacturing",
            item: "https://wear-run.com/manufacturing",
          },
        ],
      },
    ],
  };

  return JSON.stringify(structuredData);
}

export async function loader() {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["/api/manufacturing-hero"],
      queryFn: () => apiRequest("/api/manufacturing-hero"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/manufacturing-processes"],
      queryFn: () => apiRequest("/api/manufacturing-processes"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/manufacturing-capabilities"],
      queryFn: () => apiRequest("/api/manufacturing-capabilities"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/manufacturing-qualities"],
      queryFn: () => apiRequest("/api/manufacturing-qualities"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["/api/media"],
      queryFn: () => apiRequest("/api/media"),
    }),
  ]);

  return { dehydratedState: dehydrate(queryClient) };
}

export default function Manufacturing() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <ManufacturingInner />
    </HydrationBoundary>
  );
}

function ManufacturingInner() {
  // Initialize smooth scroll (Locomotive v5)
  useSmoothScroll();

  // Standardized data fetching using optimized hooks
  const { data: heroData, isPending: isHeroLoading } = useQuery<ManufacturingHero>({
    queryKey: ["/api/manufacturing-hero"],
    queryFn: () => apiRequest("/api/manufacturing-hero"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: processesData, isPending: isProcessesLoading } = useQuery<ManufacturingProcess[]>({
    queryKey: ["/api/manufacturing-processes"],
    queryFn: () => apiRequest("/api/manufacturing-processes"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: capabilitiesData, isPending: isCapabilitiesLoading } = useQuery<
    ManufacturingCapability[]
  >({
    queryKey: ["/api/manufacturing-capabilities"],
    queryFn: () => apiRequest("/api/manufacturing-capabilities"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: qualitiesData, isPending: isQualitiesLoading } = useQuery<ManufacturingQuality[]>({
    queryKey: ["/api/manufacturing-qualities"],
    queryFn: () => apiRequest("/api/manufacturing-qualities"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: mediaData, isPending: isMediaLoading } = useQuery<{ data: MediaAsset[] }>({
    queryKey: ["/api/media"],
    queryFn: () => apiRequest("/api/media"),
    staleTime: 5 * 60 * 1000,
  });

  const isPending =
    isHeroLoading ||
    isProcessesLoading ||
    isCapabilitiesLoading ||
    isQualitiesLoading ||
    isMediaLoading;

  // Global loading state for initial content
  if (isPending) {
    return <ManufacturingLoadingSkeleton />;
  }

  // Safely cast data with fallbacks
  const hero = heroData;
  const processes = processesData || [];
  const capabilities = capabilitiesData || [];
  const qualityItems = qualitiesData || [];
  const mediaAssets = mediaData?.data || [];

  // Calculate real manufacturing stats from database data
  const annualCapacity = capabilities
    .filter((c) => c.unit?.toLowerCase().includes("pcs") || c.unit?.toLowerCase().includes("units"))
    .reduce((sum, c) => sum + (parseFloat(c.capacity || "0") || 0), 0);

  const activeLines = processes.length;

  const derivedStats = [
    {
      label: "Annual Capacity",
      value: annualCapacity > 0 ? annualCapacity / 1000000 : 1.2,
      suffix: "M+",
      icon: "TrendingUp",
    },
    { label: "Active Lines", value: activeLines || 24, suffix: "", icon: "Cpu" },
    {
      label: "QA Checkpoints",
      value: qualityItems.length * 5 || 100,
      suffix: "+",
      icon: "ShieldCheck",
    },
    { label: "Lead Time", value: 15, suffix: " Days", icon: "Zap" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is hardcoded, not user input
        dangerouslySetInnerHTML={{ __html: generateStructuredData() }}
      />
      <div className="dark min-h-screen bg-[#0A0A0A] text-white font-helvetica selection:bg-amber-500/30">
        {/* Hero Section */}
        <ManufacturingErrorBoundary>
          <PublicHeroSection mediaAssets={mediaAssets} hero={hero} stats={derivedStats} />
        </ManufacturingErrorBoundary>

        {/* Brand Marquee */}
        <MarqueeStrip
          text="CUTTING • ASSEMBLY • FINISHING • QUALITY • INNOVATION •"
          accentColor="#FF4D00"
          speed={40}
        />

        {/* Processes Section */}
        <ManufacturingErrorBoundary>
          <ProductionBlueprint mediaAssets={mediaAssets} processes={processes} />
        </ManufacturingErrorBoundary>

        {/* Capabilities Section */}
        <div className="bg-[#121212]">
          <ManufacturingErrorBoundary>
            <PublicCapabilitySection mediaAssets={mediaAssets} capabilities={capabilities} />
          </ManufacturingErrorBoundary>
        </div>

        {/* Factory Gallery */}
        <FactoryGallery />

        {/* Quality Section */}
        <ManufacturingErrorBoundary>
          <PublicQualitySection mediaAssets={mediaAssets} qualities={qualityItems} />
        </ManufacturingErrorBoundary>

        {/* Case Study Section */}
        <PublicCaseStudySection mediaAssets={mediaAssets} />

        {/* Call to Action */}
        <PublicCTASection />
      </div>
    </>
  );
}
