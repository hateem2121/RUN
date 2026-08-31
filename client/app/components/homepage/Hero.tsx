import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, useGSAP } from "@/lib/gsap";
import { HERO_TEXT as FALLBACK_HERO_TEXT } from "./constants";
import type { HomepageHero } from "./types";

interface HeroProps {
  heroData?: HomepageHero | null | undefined;
}

// Shader definitions moved outside component for performance
export const Hero: React.FC<HeroProps> = ({ heroData: propsHeroData }) => {
  const scrollCurveId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isInView, setIsInView] = useState(false);
  const hasAnimatedIntro = useRef(false);

  const heroData = propsHeroData;

  // Split title by | or intelligently chunk long titles if no delimiter is provided
  const heroLines = heroData?.title
    ? heroData.title.includes("|")
      ? heroData.title.split("|").map((t: string) => t.trim())
      : heroData.title.length > 25
        ? [
            heroData.title.slice(
              0,
              heroData.title.lastIndexOf(" ", Math.ceil(heroData.title.length / 2)),
            ),
            heroData.title.slice(
              heroData.title.lastIndexOf(" ", Math.ceil(heroData.title.length / 2)) + 1,
            ),
          ]
        : [heroData.title]
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

      // One-Shot Intro Animation
      const titles = scope.querySelectorAll(".hero-line");

      if (titles.length > 0 && !hasAnimatedIntro.current) {
        hasAnimatedIntro.current = true;
        const subAndCta = gsap.utils.toArray<HTMLElement>(
          scope.querySelectorAll(".hero-subtitle, .hero-cta"),
        );
        if (prefersReducedMotion) {
          gsap.set(titles, { y: 0, opacity: 1, scale: 1 });
          if (subAndCta.length > 0) gsap.set(subAndCta, { y: 0, opacity: 1 });
        } else {
          gsap.fromTo(
            titles,
            {
              y: "110%",
              scale: 0.85,
              rotateX: 15,
              transformOrigin: "center bottom",
            },
            {
              y: "0%",
              scale: 1,
              rotateX: 0,
              duration: 1.6,
              stagger: 0.08,
              ease: "power3.out",
              force3D: true,
            },
          );
          if (subAndCta.length > 0) {
            gsap.fromTo(
              subAndCta,
              { y: 24, opacity: 0 },
              { y: 0, opacity: 1, duration: 1.0, stagger: 0.12, ease: "power2.out", delay: 0.5 },
            );
          }
        }
      }

      // Optimized Mouse Parallax Logic
      if (titles.length > 0 && !prefersReducedMotion) {
        const lineSetters = Array.from(titles).map((line, i) => {
          gsap.set(line, { x: 0, y: 0 });
          return {
            x: gsap.quickTo(line, "x", { duration: 1, ease: "power2.out" }),
            y: gsap.quickTo(line, "y", { duration: 1, ease: "power2.out" }),
            speed: (i + 1) * 15,
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

        if (isInView && window.innerWidth > 768) {
          window.addEventListener("mousemove", handleMouseMove, { passive: true });
          return () => {
            window.removeEventListener("mousemove", handleMouseMove);
          };
        }
      }

      return undefined;
    },
    { dependencies: [isInView, prefersReducedMotion], scope: textContainerRef },
  );

  return (
    <section
      ref={containerRef}
      className="bg-background relative h-screen h-[100dvh] w-full overflow-hidden"
      aria-label="Hero Introduction"
    >
      {/* 
        CSS Gradient Background 
        Replaces the R3F Canvas with a performant CSS animation.
        Uses a mesh-like gradient effect.
      */}
      <div className="absolute inset-0 z-base overflow-hidden bg-background">
        <div className="bg-hero-conic absolute -inset-1/2 opacity-40 blur-hero-conic animate-spin-slow motion-reduce:animate-none" />
        <div className="bg-hero-dots absolute inset-0 opacity-30 bg-hero-dots-size" />
      </div>

      {/* Hero Content */}
      <div className="z-elevated pointer-events-none absolute inset-0 flex items-center justify-center pt-20 md:pt-24 pb-8">
        <div className="flex flex-col items-center justify-center px-4 text-center mb-8 md:mb-0">
          <h1
            ref={textContainerRef}
            className="flex flex-col items-center justify-center perspective-1000"
          >
            {heroLines.map((line: string, i: number) => (
              <span
                key={i}
                className="hero-line block my-0 md:-my-1 max-w-full overflow-visible py-1 text-foreground font-bold tracking-tighter text-display-xl uppercase font-neue-stance break-words text-center"
              >
                {line}
              </span>
            ))}
          </h1>

          {/* CMS Subtitle */}
          {heroData?.subtitle && (
            <p className="hero-subtitle mt-6 md:mt-8 max-w-xl text-muted-foreground text-base md:text-lg leading-relaxed tracking-wide">
              {heroData.subtitle}
            </p>
          )}

          {/* CMS CTA Button */}
          {heroData?.ctaText && heroData?.ctaLink && (
            <Link
              to={heroData.ctaLink}
              className="pointer-events-auto hero-cta mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-accent/10 px-8 py-3 text-sm font-bold tracking-widest text-foreground uppercase backdrop-blur-sm transition-all duration-300 hover:bg-accent/20 hover:border-accent/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              {heroData.ctaText}
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="z-sticky pointer-events-auto absolute right-8 bottom-8 hidden md:block"
        aria-hidden="true"
      >
        <div className="relative h-24 w-24 animate-[spin_10s_linear_infinite] motion-reduce:animate-none">
          <svg viewBox="0 0 100 100" className="h-full w-full fill-black dark:fill-white">
            <title>Scroll Down</title>
            <path
              id={scrollCurveId}
              d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0"
              fill="transparent"
            />
            <text className="text-sm font-bold tracking-widest uppercase">
              <textPath href={`#${scrollCurveId}`}>Scroll Down • Scroll Down •</textPath>
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
