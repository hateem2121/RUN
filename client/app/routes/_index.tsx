import { lazy, Suspense, useEffect, useRef } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { Hero } from "@/components/homepage/Hero";

import { useIsMobile } from "@/hooks/use-is-mobile";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

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

import type { HomepageBatchResponse } from "@shared/index";
import type { Route } from "./+types/_index";

type LoaderData = {
  homepageData: HomepageBatchResponse | null;
};

export function meta({ data }: { data: LoaderData | undefined }) {
  const hero = data?.homepageData?.hero?.result;
  return [
    { title: hero?.title || "RUN Apparel | Next-Gen B2B Sportswear Manufacturing Partner" },
    {
      name: "description",
      content:
        hero?.subtitle ||
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
    { property: "og:url", content: "https://wear-run.com/" },
    { name: "twitter:card", content: "summary_large_image" },
    { tagName: "link", rel: "canonical", href: "https://wear-run.com/" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const base = new URL(request.url);
  const get = (path: string) =>
    fetch(new URL(path, base).toString())
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const [homepageData] = await Promise.all([get("/api/homepage-batch")]);

  return {
    homepageData,
  };
}

export default function Component({ loaderData }: { loaderData: LoaderData }) {
  const { homepageData } = loaderData;
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  // Page Visibility Sleep: pause GSAP ticker when tab is inactive to preserve 100% idle battery and GPU
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        gsap.ticker.sleep();
      } else {
        gsap.ticker.wake();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Stable refs for skewable sections to avoid ref callback churn
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Optimization: use quickTo for higher performance updates than gsap.set in a ticker
  const xToHero = useRef<((val: number) => void) | null>(null);
  const xToContent = useRef<((val: number) => void) | null>(null);

  // Use ScrollTrigger for the kinetic skew effect instead of direct scroll instance events
  useGSAP(
    () => {
      if (isMobile || prefersReducedMotion) return;

      if (heroRef.current) {
        xToHero.current = gsap.quickTo(heroRef.current, "skewY", { duration: 0.4, ease: "power3" });
      }
      if (contentRef.current) {
        xToContent.current = gsap.quickTo(contentRef.current, "skewY", {
          duration: 0.4,
          ease: "power3",
        });
      }

      let scrollTimeout: ReturnType<typeof setTimeout>;

      ScrollTrigger.create({
        onUpdate: (self) => {
          // Clamped to ±1.5 degrees with calibrated velocity multiplier
          const velocity = self.getVelocity();
          const targetSkew = Math.min(Math.max(velocity * 0.001, -1.5), 1.5);

          xToHero.current?.(targetSkew);
          xToContent.current?.(targetSkew);

          // Return to 0 when scrolling stops (debounced)
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            xToHero.current?.(0);
            xToContent.current?.(0);
          }, 150);
        },
      });

      return () => {
        clearTimeout(scrollTimeout);
        if (heroRef.current) gsap.set(heroRef.current, { skewY: 0, clearProps: "transform" });
        if (contentRef.current) gsap.set(contentRef.current, { skewY: 0, clearProps: "transform" });
      };
    },
    { dependencies: [isMobile, prefersReducedMotion], scope: heroRef },
  );

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="w-full bg-background-alt focus-visible:outline-hidden overflow-x-clip"
    >
      {/* Hero Section - Static to minimize FCP/LCP */}
      <div ref={heroRef} className="origin-top will-change-transform">
        <Hero heroData={homepageData?.hero?.result} />
      </div>

      {/* Slogans Ticker: CMS-driven scrolling slogans */}
      <Suspense fallback={<div className="h-20 w-full bg-background" />}>
        <Slogans data={homepageData?.slogans?.result} />
      </Suspense>

      {/* Stats Section: High height impact (150vh) */}
      <Suspense
        fallback={<div className="min-h-screen md:min-h-[150vh] bg-background animate-pulse" />}
      >
        <Stats />
      </Suspense>

      {/* Content Section: Mid-page components */}
      <div ref={contentRef} className="origin-top transform-gpu will-change-transform">
        <Suspense fallback={<div className="min-h-96 bg-background animate-pulse" />}>
          <Categories data={homepageData?.categories?.result} />
        </Suspense>

        {homepageData?.products?.result && homepageData.products.result.length > 0 && (
          <Suspense
            fallback={
              <div className="min-h-screen lg:min-h-[950px] bg-background-alt animate-pulse" />
            }
          >
            <FeaturedProducts
              products={homepageData.products.result}
              settings={homepageData.featuredProductsSettings?.result}
            />
          </Suspense>
        )}

        <Suspense
          fallback={
            <div className="min-h-screen md:min-h-[850px] bg-background-alt animate-pulse" />
          }
        >
          <Values />
        </Suspense>
      </div>

      {/* CMS Narrative Sections */}
      {homepageData?.sections?.result && homepageData.sections.result.length > 0 && (
        <Suspense
          fallback={<div className="min-h-screen md:min-h-[600px] bg-background animate-pulse" />}
        >
          <Sections data={homepageData.sections.result} />
        </Suspense>
      )}

      {/* Process Section: Viewport pinning needs static context */}
      {homepageData?.processCards?.result && homepageData.processCards.result.length > 0 && (
        <Suspense fallback={<div className="min-h-screen bg-background animate-pulse" />}>
          <Process data={homepageData.processCards.result} />
        </Suspense>
      )}
    </main>
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
        className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
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

export function HydrateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
