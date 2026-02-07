import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import CustomCursor from "@/components/homepage/CustomCursor";
import Preloader from "@/components/homepage/Preloader";
import { useHomepageData } from "@/hooks/use-homepage-data";
import { useIsMobile } from "@/hooks/use-is-mobile";

// Lazy Load Heavy Components
const Categories = lazy(() => import("@/components/homepage/Categories"));
const FeaturedProducts = lazy(() => import("@/components/homepage/FeaturedProducts"));
const Hero = lazy(() => import("@/components/homepage/Hero"));
const Process = lazy(() => import("@/components/homepage/Process"));
const Stats = lazy(() => import("@/components/homepage/Stats"));
const Values = lazy(() => import("@/components/homepage/Values"));

// Register Plugin Globally
gsap.registerPlugin(ScrollTrigger);

export function meta() {
  return [
    { title: "Run Apparel | Premium Activewear" },
    {
      name: "description",
      content: "Experience the next level of performance with Run Apparel.",
    },
  ];
}

export default function Index() {
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

    // Sync Lenis RAF
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
      gsap.ticker.remove(handleTicker);
    };
  }, [isMobile]);

  return (
    <>
      {!preloaderFinished && <Preloader onComplete={() => setPreloaderFinished(true)} />}
      <CustomCursor />

      <main className="w-full bg-background-alt">
        <Suspense fallback={null}>
          {/* GROUP 1: Skewable Top Section */}
          <div ref={heroRef} className="origin-top will-change-transform">
            <Hero />
          </div>

          {/* STATIC: Stats has sticky elements, kept outside skew to avoid jitter */}
          <Stats />

          {/* GROUP 2: Skewable Middle Content */}
          <div ref={contentRef} className="origin-top will-change-transform">
            <Categories data={homepageData?.categories?.result} />
            <FeaturedProducts products={homepageData?.products?.result} />
            <Values />
          </div>

          {/* STATIC: Process has viewport pinning, MUST be outside transformed container */}
          <Process />

          {/* STATIC: Process has viewport pinning, MUST be outside transformed container */}
          <Process />
        </Suspense>
      </main>
    </>
  );
}
