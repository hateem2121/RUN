import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";
import Categories from "@/components/homepage/Categories";
import CustomCursor from "@/components/homepage/CustomCursor";
import FeaturedProducts from "@/components/homepage/FeaturedProducts";
import Hero from "@/components/homepage/Hero";
import Preloader from "@/components/homepage/Preloader";
import Process from "@/components/homepage/Process";
import Stats from "@/components/homepage/Stats";
import { useStore } from "@/components/homepage/store";
import Values from "@/components/homepage/Values";
import Footer from "@/components/layout/Footer";
import { useLenis } from "@/components/layout/LenisContext";

// Register Plugin Globally
gsap.registerPlugin(ScrollTrigger);

export default function Homepage() {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const setIsLoading = useStore((state) => state.setIsLoading);

  // Stable refs for skewable sections
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { lenis } = useLenis();
  const skewProxy = useRef({ val: 0 });

  useGSAP(
    () => {
      if (!lenis) return;

      const onScroll = ({ velocity }: { velocity: number }) => {
        const targetSkew = Math.min(Math.max(velocity * 0.1, -5), 5);
        gsap.to(skewProxy.current, {
          val: targetSkew,
          duration: 0.5,
          ease: "power3.out",
          overwrite: true,
        });
      };

      const onTicker = () => {
        const val = skewProxy.current.val;
        // Footer removed from skew targets to support Sticky Reveal
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

      lenis.on("scroll", onScroll);
      gsap.ticker.add(onTicker);

      return () => {
        lenis.off("scroll", onScroll);
        gsap.ticker.remove(onTicker);
      };
    },
    { dependencies: [lenis] },
  );

  const handlePreloadComplete = () => {
    setIsPreloaded(true);
    setIsLoading(false);
  };

  return (
    <>
      {/* Global Cursor */}
      <CustomCursor />

      {/* Preloader */}
      {!isPreloaded && <Preloader onComplete={handlePreloadComplete} />}

      {/* 
        MAIN CONTENT: 
        Needs relative positioning, z-index > 0, and a background color
        to cover the fixed footer until the end.
      */}
      <main
        className={`relative z-elevated w-full bg-background transition-opacity duration-500 ${
          isPreloaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* GROUP 1: Skewable Top Section */}
        <div ref={heroRef} className="origin-top">
          <Hero />
        </div>

        {/* STATIC: Stats has sticky elements, kept outside skew to avoid jitter */}
        <Stats />

        {/* GROUP 2: Skewable Middle Content */}
        <div ref={contentRef} className="origin-top">
          <Categories />
          <FeaturedProducts />
          <Values />
        </div>

        {/* STATIC: Process has viewport pinning, MUST be outside transformed container */}
        <Process />

        {/* 
          Footer component now handles its own Spacer div internally.
          We just render it here at the end of the flow.
          The Spacer will take up space in this main container,
          pushing the scroll height down, allowing the fixed footer 
          (rendered by this same component) to be revealed.
        */}
        <Footer />
      </main>
    </>
  );
}
