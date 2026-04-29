import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Hero } from "@/components/homepage/Hero";
import { Preloader } from "@/components/homepage/Preloader";
import CustomCursor from "@/components/ui/CustomCursor";
import { useHomepageData } from "@/hooks/use-homepage-data";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

// Lazy Load Heavy Components (Below Fold)
const Categories = lazy(() =>
  import("@/components/homepage/Categories").then((m) => ({ default: m.Categories })),
);
const FeaturedProducts = lazy(() =>
  import("@/components/homepage/FeaturedProducts").then((m) => ({ default: m.FeaturedProducts })),
);
// Hero moved to static import
const Process = lazy(() =>
  import("@/components/homepage/Process").then((m) => ({ default: m.Process })),
);
const Sections = lazy(() =>
  import("@/components/homepage/Sections").then((m) => ({ default: m.Sections })),
);
const Slogans = lazy(() =>
  import("@/components/homepage/Slogans").then((m) => ({ default: m.Slogans })),
);
const Stats = lazy(() => import("@/components/homepage/Stats").then((m) => ({ default: m.Stats })));
const Values = lazy(() =>
  import("@/components/homepage/Values").then((m) => ({ default: m.Values })),
);

// Register Plugin Globally
gsap.registerPlugin(ScrollTrigger);

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { useLoaderData } from "react-router";
import { apiRequest, getQueryClient, queryKeys } from "@/lib/queryClient";

import type { Route } from "./+types/_index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RUN Apparel | Next-Gen B2B Sportswear Manufacturing Partner" },
    {
      name: "description",
      content:
        "High-performance B2B sportswear manufacturing with precision engineering since 1889. Sustainable, scalable, and state-of-the-art apparel solutions for global brands.",
    },
    {
      name: "keywords",
      content: "B2B sportswear, manufacturing, performance apparel, custom teamwear, athletic wear production",
    },
    { property: "og:title", content: "RUN Apparel | B2B Sportswear Manufacturing" },
    {
      property: "og:description",
      content: "Premium sportswear manufacturing with 135+ years of heritage craftsmanship.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}

export async function loader() {
  const queryClient = getQueryClient();

  // Prefetch the homepage batch data to eliminate hydration waterfalls
  await queryClient.prefetchQuery({
    queryKey: queryKeys.homepage.batch(),
    queryFn: () => apiRequest(queryKeys.homepage.batch()[0]),
  });

  return {
    dehydratedState: dehydrate(queryClient),
  };
}

export function headers() {
  return {
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
  };
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const [preloaderFinished, setPreloaderFinished] = useState(false);
  const { data: homepageData } = useHomepageData();
  const isMobile = useIsMobile();

  // Stable refs for skewable sections to avoid ref callback churn
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Optimization: use quickTo for higher performance updates than gsap.set in a ticker
  // We'll initialize these inside an effect to ensure refs are ready
  const xToHero = useRef<((val: number) => void) | null>(null);
  const xToContent = useRef<((val: number) => void) | null>(null);

  useEffect(() => {
    if (isMobile) return;

    if (heroRef.current) {
      xToHero.current = gsap.quickTo(heroRef.current, "skewY", { duration: 0.4, ease: "power3" });
    }
    if (contentRef.current) {
      xToContent.current = gsap.quickTo(contentRef.current, "skewY", {
        duration: 0.4,
        ease: "power3",
      });
    }
  }, [isMobile]);

  // Use the unified smooth scroll hook with the kinetic skew effect
  const handleScroll = useCallback(
    ({ velocity }: { velocity: number }) => {
      if (isMobile) return;

      // Clamp velocity
      const targetSkew = Math.min(Math.max(velocity * 0.08, -5), 5);

      // Update via quickTo for smoother, more efficient transforms
      xToHero.current?.(targetSkew);
      xToContent.current?.(targetSkew);
    },
    [isMobile],
  );

  useSmoothScroll({
    duration: 1.2, // Reduced from 1.5 for better responsiveness
    touchMultiplier: 2.5,
    onScroll: handleScroll,
  });

  // No longer need the manual ticker, quickTo handles the animation loop internally

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      {!preloaderFinished && <Preloader onComplete={() => setPreloaderFinished(true)} />}
      <CustomCursor />

      <main id="main-content" className="w-full bg-background-alt">
        {/* Hero Section - Static to minimize FCP/LCP */}
        <div ref={heroRef} className="origin-top will-change-transform">
          <Hero />
        </div>

        {/* 
            Performance Optimization: Independent Suspense Boundaries 
            Prevents "Waterfall Pop-in" and cumulative layout shift (CLS).
        */}

        {/* Slogans Ticker: CMS-driven scrolling slogans */}
        <Suspense fallback={null}>
          <Slogans data={homepageData?.slogans?.result} />
        </Suspense>

        {/* Stats Section: High height impact (150vh) */}
        <Suspense fallback={<div className="min-h-[150vh] bg-background animate-pulse" />}>
          <Stats />
        </Suspense>

        {/* Content Section: Mid-page components */}
        <div ref={contentRef} className="origin-top transform-gpu will-change-transform">
          <Suspense fallback={<div className="min-h-[80vh] bg-background animate-pulse" />}>
            <Categories data={homepageData?.categories?.result} />
          </Suspense>

          <Suspense fallback={<div className="min-h-[100vh] bg-background-alt animate-pulse" />}>
            <FeaturedProducts
              products={homepageData?.products?.result}
              settings={homepageData?.featuredProductsSettings?.result}
            />
          </Suspense>

          <Suspense fallback={<div className="min-h-[60vh] bg-background-alt animate-pulse" />}>
            <Values />
          </Suspense>
        </div>

        {/* CMS Narrative Sections */}
        <Suspense fallback={null}>
          <Sections data={homepageData?.sections?.result} />
        </Suspense>

        {/* Process Section: Viewport pinning needs static context */}
        <Suspense fallback={<div className="min-h-screen bg-background animate-pulse" />}>
          <Process />
        </Suspense>
      </main>
    </HydrationBoundary>
  );
}
