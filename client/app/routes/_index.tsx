import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Hero } from "@/components/homepage/Hero";
import { Preloader } from "@/components/homepage/Preloader";
import CustomCursor from "@/components/ui/CustomCursor";
import { useHomepageData } from "@/hooks/use-homepage-data";
import { useIsMobile } from "@/hooks/use-is-mobile";

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
    { title: "RUN Apparel | B2B Sportswear Manufacturing Partner" },
    {
      name: "description",
      content:
        "Next-generation B2B sportswear manufacturing. Sustainable, high-performance athletic apparel with precision engineering since 1889.",
    },
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

  // Proxy object to hold animation values - avoids quickTo strictness warnings
  const skewProxy = useRef({ val: 0 });

  // Store Lenis instance to control it later
  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis Smooth Scroll with Skew Effect
  useEffect(() => {
    // Respect user preference for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Skip smooth scroll and skew effects for users who prefer reduced motion or on mobile devices
    if (prefersReducedMotion || isMobile) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2.5,
    });

    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    // Kinetic Scroll Skew Effect via Proxy Pattern
    lenis.on("scroll", ({ velocity }: { velocity: number }) => {
      // Clamp velocity
      const targetSkew = Math.min(Math.max(velocity * 0.1, -5), 5);

      // Tween the proxy value - this handles the smoothing/easing
      gsap.to(skewProxy.current, {
        val: targetSkew,
        duration: 0.5,
        ease: "power3.out",
        overwrite: true,
      });
    });

    // Single Ticker Loop to apply values to DOM
    const handleTicker = () => {
      const val = skewProxy.current.val;

      // Apply to explicit refs
      const targets = [heroRef.current, contentRef.current];

      targets.forEach((el) => {
        if (el) {
          gsap.set(el, {
            skewY: val,
            rotateY: val * 0.2, // Subtle 3D rotation
            force3D: true, // Force GPU layer
            transformOrigin: "center center",
          });
        }
      });
    };

    gsap.ticker.add(handleTicker);

    // Sync Lenis RAF — store reference for proper cleanup
    const lenisRaf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(lenisRaf);

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenisRaf);
      gsap.ticker.remove(handleTicker);
    };
  }, [isMobile]);

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
