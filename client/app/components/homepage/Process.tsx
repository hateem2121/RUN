import type { HomepageProcessCard } from "@shared/schemas/content/home";
import { ArrowRight } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { Link } from "react-router";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { PROCESS_STEPS as FALLBACK_STEPS } from "./constants";

interface ProcessProps {
  data?: HomepageProcessCard[];
}

export const Process: React.FC<ProcessProps> = ({ data }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Use CMS data if available, otherwise fallback to constants
  const steps = data?.length ? data : FALLBACK_STEPS;

  useGSAP(
    () => {
      if (!steps.length || !sectionRef.current || !triggerRef.current || !pathRef.current) {
        return;
      }

      const triggerEl = triggerRef.current;
      const pathEl = pathRef.current;

      // Safe Scoped Selector with explicit Generic Type
      const sections = gsap.utils.toArray<HTMLElement>(triggerEl.querySelectorAll(".process-card"));

      // Prevent GSAP target null warning if empty
      if (sections.length === 0) return;

      // Handle Reduced Motion: Force vertical stack (mobile layout)
      if (prefersReducedMotion) {
        gsap.set(sections, { xPercent: 0 });
        return;
      }

      // Initial set for SVG line
      if (pathEl) {
        const length = pathEl.getTotalLength();
        gsap.set(pathEl, { strokeDasharray: length, strokeDashoffset: length });
      }

      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        const updateWidths = () => {
          if (!triggerEl) return;
          const w = triggerEl.offsetWidth;
          sections.forEach((s) => {
            gsap.set(s, { width: w });
          });
          if (sectionRef.current) {
            gsap.set(sectionRef.current, { width: w * sections.length });
          }
        };
        updateWidths();
        ScrollTrigger.addEventListener("refreshInit", updateWidths);

        // Calculate exact scroll distance dynamically on refresh
        const stepDuration = 1 / Math.max(1, sections.length - 1);

        const tl = gsap.timeline({
          scrollTrigger: {
            id: "process-pin",
            trigger: triggerEl,
            pin: true,
            scrub: 1,
            end: () => `+=${triggerEl.offsetWidth * Math.max(1, sections.length - 1)}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        // Horizontal Scroll: Exact step translation
        tl.to(
          sectionRef.current,
          {
            xPercent: (-100 * (sections.length - 1)) / sections.length,
            ease: "none",
          },
          0,
        );

        // Advanced Horizontal Parallax: Scoped to active fractional window
        sections.forEach((section, i) => {
          const img = section.querySelector("img");
          if (img) {
            gsap.set(img, { scale: 1.15 });

            if (i > 0) {
              const startTime = (i - 1) * stepDuration;
              tl.fromTo(
                img,
                { xPercent: -12 },
                { xPercent: 12, ease: "none", duration: stepDuration },
                startTime,
              );
            }
          }
        });

        // SVG Line Drawing syncs with scroll
        if (pathEl) {
          tl.to(
            pathEl,
            {
              strokeDashoffset: 0,
              ease: "none",
            },
            0,
          );
        }

        return () => {
          ScrollTrigger.removeEventListener("refreshInit", updateWidths);
        };
      });

      mm.add("(max-width: 767px)", () => {
        gsap.set(sections, { xPercent: 0 });

        // Simple reveal for mobile cards
        sections.forEach((section) => {
          const content = section.querySelector(".content-container");
          if (content) {
            gsap.fromTo(
              content,
              { y: 50, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: section,
                  start: "top 85%",
                },
              },
            );
          }
        });
      });
    },
    { dependencies: [steps, prefersReducedMotion], scope: triggerRef },
  );

  const handleCardFocus = (index: number) => {
    if (window.innerWidth >= 768 && triggerRef.current) {
      const scrollTrigger =
        ScrollTrigger.getById("process-pin") ||
        ScrollTrigger.getAll().find((st) => st.trigger === triggerRef.current);
      if (scrollTrigger?.start && scrollTrigger?.end) {
        const totalDist = scrollTrigger.end - scrollTrigger.start;
        const targetScroll = scrollTrigger.start + (index / (steps.length - 1)) * totalDist;
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    }
  };

  return (
    <section
      className="overflow-hidden bg-background text-foreground"
      aria-labelledby="process-heading"
    >
      <div
        ref={triggerRef}
        className="relative flex min-h-screen w-full flex-col overflow-x-hidden md:flex-row md:items-center"
      >
        <div className="absolute top-8 left-8 z-elevated">
          <h2
            id="process-heading"
            className="rounded-full border border-border bg-surface/20 px-4 py-2 text-sm uppercase tracking-widest backdrop-blur-sm md:text-xl"
          >
            Production Pipeline
          </h2>
        </div>

        {/* Decorative Drawing SVG - Desktop Only */}
        <div
          className="pointer-events-none absolute top-1/2 left-0 z-base hidden h-72 w-full -translate-y-1/2 opacity-30 md:block"
          aria-hidden="true"
        >
          <svg className="h-full w-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <title>Decorative Process Line</title>
            <path
              ref={pathRef}
              d="M0,100 C250,200 500,0 1000,100"
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeWidth="5"
            />
          </svg>
        </div>

        {/* Track Container */}
        <div
          className="flex h-auto w-full flex-col pt-24 md:h-full md:w-max md:flex-row md:pt-0"
          ref={sectionRef}
        >
          {steps.map((step, index) => (
            <div
              key={step.id || index}
              className="process-card relative z-default flex min-h-loading-center w-full shrink-0 items-center justify-center border-border border-b p-4 md:h-full md:min-h-0 md:w-full md:shrink-0 md:border-r md:border-b-0 md:p-12"
            >
              <div className="grid w-full max-w-6xl grid-cols-1 gap-8 overflow-hidden rounded-xl border border-border/50 bg-surface/80 p-6 backdrop-blur-md content-container md:grid-cols-2 md:gap-12 md:p-12">
                {/* Image Side */}
                <div className="group relative aspect-square overflow-hidden rounded-lg md:aspect-auto md:h-full">
                  <img
                    src={
                      ("imageUrl" in step && (step as { imageUrl?: string }).imageUrl
                        ? (step as { imageUrl?: string }).imageUrl
                        : undefined) ||
                      ("image" in step && (step as { image?: string }).image
                        ? (step as { image?: string }).image
                        : undefined) ||
                      ("imageId" in step && step.imageId
                        ? `/api/media/${step.imageId}/content`
                        : undefined) ||
                      FALLBACK_STEPS[index % FALLBACK_STEPS.length]?.image ||
                      "/images/placeholders/machinery-placeholder.webp"
                    }
                    alt={step.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = "/images/placeholders/machinery-placeholder.webp";
                    }}
                    className="h-full w-full object-cover grayscale transition-transform duration-700 ease-out group-hover:scale-110 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-surface/20 transition-all duration-500 group-hover:bg-transparent" />

                  {/* Formatted 01 Step Number Overlay */}
                  <span
                    className="absolute top-0 left-0 p-4 font-bold text-9xl text-foreground leading-none opacity-50 mix-blend-overlay md:text-8xl"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Content Side */}
                <div className="relative flex flex-col justify-center">
                  <h3 className="mb-4 font-bold text-display-xl uppercase leading-[0.9] md:mb-8 md:text-4xl">
                    {step.title}
                  </h3>
                  <p className="mb-8 max-w-md font-light text-base text-muted-foreground leading-relaxed md:text-xl">
                    {step.description}
                  </p>
                  <Link
                    to="/manufacturing"
                    onFocus={() => handleCardFocus(index)}
                    aria-label={`Explore manufacturing pipeline: ${step.title}`}
                    className="group flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-foreground transition-all duration-300 hover:bg-foreground hover:text-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:h-16 md:w-16"
                  >
                    <ArrowRight
                      aria-hidden="true"
                      className="h-5 w-5 -rotate-45 transition-transform duration-300 group-hover:rotate-0 md:h-6 md:w-6"
                    />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
