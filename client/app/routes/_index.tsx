import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { lazy, Suspense, useRef, useState } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { Hero } from "@/components/homepage/Hero";
import { Preloader } from "@/components/homepage/Preloader";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { useHomepageData } from "@/hooks/use-homepage-data";
import { useIsMobile } from "@/hooks/use-is-mobile";

// Lazy Load Heavy Components (Below Fold)
const Categories = lazy(() =>
  import("@/components/homepage/Categories").then((m) => ({ default: m.Categories })),
);
const FeaturedProducts = lazy(() =>
  import("@/components/homepage/FeaturedProducts").then((m) => ({ default: m.FeaturedProducts })),
);
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
      content:
        "B2B sportswear, manufacturing, performance apparel, custom teamwear, athletic wear production",
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
  const xToHero = useRef<((val: number) => void) | null>(null);
  const xToContent = useRef<((val: number) => void) | null>(null);

  // Use ScrollTrigger for the kinetic skew effect instead of direct scroll instance events
  // This is more robust and avoids type issues with LocomotiveScroll
  useGSAP(
    () => {
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

      ScrollTrigger.create({
        onUpdate: (self) => {
          // self.getVelocity() returns pixels per second
          // We convert it to a small skew angle
          const velocity = self.getVelocity();
          const targetSkew = Math.min(Math.max(velocity * 0.005, -5), 5);

          xToHero.current?.(targetSkew);
          xToContent.current?.(targetSkew);

          // Return to 0 when scrolling stops
          if (Math.abs(velocity) < 1) {
            xToHero.current?.(0);
            xToContent.current?.(0);
          }
        },
      });
    },
    { dependencies: [isMobile], scope: heroRef },
  );

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      {!preloaderFinished && <Preloader onComplete={() => setPreloaderFinished(true)} />}
      <CustomCursor />

      <main id="main-content" className="w-full bg-background-alt">
        {/* Hero Section - Static to minimize FCP/LCP */}
        <div ref={heroRef} className="origin-top will-change-transform">
          <Hero />
        </div>

        {/* Slogans Ticker: CMS-driven scrolling slogans */}
        <Suspense fallback={null}>
          <Slogans data={homepageData?.slogans?.result} />
        </Suspense>

        {/* Stats Section: High height impact (150vh) */}
        <Suspense fallback={<div className="min-h-150vh bg-background animate-pulse" />}>
          <Stats />
        </Suspense>

        {/* Content Section: Mid-page components */}
        <div ref={contentRef} className="origin-top transform-gpu will-change-transform">
          <Suspense fallback={<div className="min-h-80vh bg-background animate-pulse" />}>
            <Categories data={homepageData?.categories?.result} />
          </Suspense>

          <Suspense fallback={<div className="min-h-screen bg-background-alt animate-pulse" />}>
            <FeaturedProducts
              products={homepageData?.products?.result}
              settings={homepageData?.featuredProductsSettings?.result}
            />
          </Suspense>

          <Suspense fallback={<div className="min-h-60vh bg-background-alt animate-pulse" />}>
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
      <h1 className="mb-2 font-bold text-3xl">
        {isRouteError ? "Page Not Found" : "Something went wrong"}
      </h1>
      <p className="mb-6 max-w-md text-muted-foreground">
        {isRouteError
          ? "We couldn't find the page you're looking for."
          : "We encountered an error while loading the homepage. Please try again later."}
      </p>
      <button
        type="button"
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
