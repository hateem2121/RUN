import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useHomepageData } from "@/hooks/use-homepage-data";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { HERO_TEXT as FALLBACK_HERO_TEXT } from "./constants";

// Shader definitions moved outside component for performance
export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isInView, setIsInView] = useState(false);

  const { data: homepageData } = useHomepageData();
  const heroData = homepageData?.hero?.result;

  // Split title by | or use fallback
  const heroLines = heroData?.title
    ? heroData.title.split("|").map((t: string) => t.trim())
    : FALLBACK_HERO_TEXT;

  // Performance: Detect if Hero is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInView(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      if (!textContainerRef.current) return;

      const scope = textContainerRef.current;

      // Intro Animation
      const titles = scope.querySelectorAll(".hero-line");

      if (titles.length > 0) {
        if (prefersReducedMotion) {
          gsap.set(titles, { y: 0, opacity: 1, scale: 1 });
        } else {
          gsap.fromTo(
            titles,
            {
              y: "110%",
              scale: 0.85,
              rotateX: 15,
              transformOrigin: "center bottom",
              filter: "blur(12px)",
            },
            {
              y: "0%",
              scale: 1,
              rotateX: 0,
              filter: "blur(0px)",
              duration: 1.8,
              stagger: 0.1,
              ease: "power3.out",
              force3D: true,
            },
          );
        }
      }

      // Optimized Mouse Parallax Logic
      const lines = scope.querySelectorAll(".hero-line");
      if (lines.length > 0) {
        const lineSetters = Array.from(lines).map((line, i) => {
          gsap.set(line, { x: 0, y: 0 });
          return {
            x: gsap.quickTo(line, "x", { duration: 1, ease: "power2.out" }),
            y: gsap.quickTo(line, "y", { duration: 1, ease: "power2.out" }),
            speed: (i + 1) * 20,
          };
        });

        const handleMouseMove = (e: MouseEvent) => {
          if (!isInView) return;

          const xPos = (e.clientX / window.innerWidth - 0.5) * 2;
          const yPos = (e.clientY / window.innerHeight - 0.5) * 2;

          lineSetters.forEach(({ x, y, speed }) => {
            x(xPos * speed);
            y(yPos * speed);
          });
        };

        if (window.innerWidth > 768) {
          window.addEventListener("mousemove", handleMouseMove);
          return () => window.removeEventListener("mousemove", handleMouseMove);
        }
        return () => {};
      }
      return () => {};
    },
    { dependencies: [isInView, prefersReducedMotion], scope: textContainerRef },
  );

  return (
    <section ref={containerRef} className="bg-background relative h-screen w-full overflow-hidden">
      {/* 
        CSS Gradient Background 
        Replaces the R3F Canvas with a performant CSS animation.
        Uses a mesh-like gradient effect.
      */}
      <div className="absolute inset-0 z-base overflow-hidden bg-background">
        <div className="bg-hero-conic absolute -inset-1/2 opacity-40 blur-hero-conic animate-spin-slow" />
        <div className="bg-hero-dots absolute inset-0 opacity-30 bg-hero-dots-size" />
      </div>

      {/* Hero Content */}
      <div className="z-elevated pointer-events-none absolute inset-0 flex items-center justify-center md:pt-0 pt-24">
        <div className="flex flex-col items-center justify-center px-4 text-center mb-20 md:mb-0">
          <h1
            ref={textContainerRef}
            className="flex flex-col items-center justify-center perspective-1000"
          >
            {heroLines.map((line: string, i: number) => (
              <span
                key={i}
                className="hero-line block my-0 md:-my-2 overflow-visible py-2 will-change-transform text-foreground font-bold tracking-tighter leading-custom-misc-151 md:leading-custom-misc-152 text-custom-space-138 sm:text-custom-space-139 md:text-custom-space-140 lg:text-custom-space-141 xl:text-custom-space-142"
              >
                {line}
              </span>
            ))}
          </h1>

          {/* CMS Subtitle */}
          {heroData?.subtitle && (
            <p className="hero-subtitle mt-6 max-w-xl text-muted-foreground text-base md:text-lg leading-relaxed tracking-wide">
              {heroData.subtitle}
            </p>
          )}

          {/* CMS CTA Button */}
          {heroData?.ctaText && heroData?.ctaLink && (
            <a
              href={heroData.ctaLink}
              className="pointer-events-auto hero-cta mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-accent/10 px-8 py-3 text-sm font-bold tracking-widest text-foreground uppercase backdrop-blur-sm transition-all duration-300 hover:bg-accent/20 hover:border-accent/40"
            >
              {heroData.ctaText}
              <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="z-sticky pointer-events-auto absolute right-8 bottom-8 hidden md:block"
        aria-hidden="true"
      >
        <div className="relative h-24 w-24 animate-custom-misc-153">
          <svg viewBox="0 0 100 100" className="h-full w-full fill-black dark:fill-white">
            <title>Scroll Down</title>
            <path
              id="curve"
              d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0"
              fill="transparent"
            />
            <text className="text-sm font-bold tracking-widest uppercase">
              <textPath href="#curve">Scroll Down • Scroll Down •</textPath>
            </text>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-black dark:bg-white" />
          </div>
        </div>
      </div>
    </section>
  );
};
