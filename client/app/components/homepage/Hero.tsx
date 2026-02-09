import gsap from "gsap";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHomepageData } from "@/hooks/use-homepage-data";
import { HERO_TEXT as FALLBACK_HERO_TEXT } from "./constants";

// Shader definitions moved outside component for performance
const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  const { data: homepageData } = useHomepageData();
  const heroData = homepageData?.hero?.result;

  // Split title by | or use fallback
  const heroLines = useMemo(() => {
    if (heroData?.title) {
      return heroData.title.split("|").map((t: string) => t.trim());
    }
    return FALLBACK_HERO_TEXT;
  }, [heroData]);

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

  useEffect(() => {
    if (!textContainerRef.current) {
      return;
    }

    const scope = textContainerRef.current;

    const ctx = gsap.context(() => {
      // Intro Animation
      const titles = scope.querySelectorAll(".hero-line");

      if (titles.length > 0) {
        gsap.fromTo(
          titles,
          {
            y: "110%",
            opacity: 0,
            scale: 0.85,
            rotateX: 15,
            transformOrigin: "center bottom",
            filter: "blur(12px)",
          },
          {
            y: "0%",
            opacity: 1,
            scale: 1,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 1.8, // Adjusted duration
            stagger: 0.1, // Adjusted stagger
            ease: "power3.out", // Refined ease
            force3D: true,
          },
        );
      }
    }, scope);

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
        if (!isInView) {
          return;
        }

        const xPos = (e.clientX / window.innerWidth - 0.5) * 2;
        const yPos = (e.clientY / window.innerHeight - 0.5) * 2;

        lineSetters.forEach(({ x, y, speed }) => {
          x(xPos * speed);
          y(yPos * speed);
        });
      };

      if (window.innerWidth > 768) {
        window.addEventListener("mousemove", handleMouseMove);
      }

      return () => {
        ctx.revert();
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }

    return () => ctx.revert();
  }, [isInView]);

  return (
    <section
      ref={containerRef}
      className="bg-background-alt relative h-screen w-full overflow-hidden dark"
    >
      {/* 
        CSS Gradient Background 
        Replaces the R3F Canvas with a performant CSS animation.
        Uses a mesh-like gradient effect.
      */}
      <div className="absolute inset-0 z-base overflow-hidden bg-black">
        <div
          className="absolute inset-[-50%] opacity-40 blur-[100px] animate-[spin_20s_linear_infinite]"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, #000000 0deg, #1a1a1a 120deg, #333333 240deg, #000000 360deg)",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Hero Content */}
      <div className="z-elevated pointer-events-none absolute inset-0 flex items-center justify-center md:pt-0 pt-24">
        <h1
          ref={textContainerRef}
          className="flex flex-col items-center justify-center px-4 text-center perspective-[1000px] mb-20 md:mb-0"
        >
          {heroLines.map((line: string, i: number) => (
            <span
              key={i}
              className="hero-line block my-0 md:-my-2 overflow-visible py-2 will-change-transform text-white font-bold tracking-tighter leading-[0.9] md:leading-[0.85] text-[13vw] sm:text-[10vw] md:text-[8vw] lg:text-[7vw] xl:text-[6vw]"
            >
              {line}
            </span>
          ))}
        </h1>
      </div>

      {/* Scroll Indicator */}
      <div
        className="z-sticky pointer-events-auto absolute right-8 bottom-8 hidden md:block"
        aria-hidden="true"
      >
        <div className="relative h-24 w-24 animate-[spin_10s_linear_infinite]">
          <svg viewBox="0 0 100 100" className="h-full w-full fill-black dark:fill-white">
            <path
              id="curve"
              d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0"
              fill="transparent"
            />
            <text className="text-[14px] font-bold tracking-widest uppercase">
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

export default Hero;
