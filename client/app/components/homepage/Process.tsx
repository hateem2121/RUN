import type { HomepageProcessCard } from "@shared/schemas/content/home";
import { ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { PROCESS_STEPS as FALLBACK_STEPS } from "./constants";

interface ProcessProps {
  data?: HomepageProcessCard[] | undefined;
}

export const Process: React.FC<ProcessProps> = ({ data }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(1);

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
        const numSections = sections.length;
        if (numSections <= 1) return;

        const updateWidths = () => {
          if (!triggerEl) return;
          const w = triggerEl.offsetWidth;
          sections.forEach((s) => {
            gsap.set(s, { width: w });
          });
          if (sectionRef.current) {
            gsap.set(sectionRef.current, { width: w * numSections });
          }
        };
        updateWidths();
        ScrollTrigger.addEventListener("refreshInit", updateWidths);

        const getMetrics = () => {
          const w = triggerEl.offsetWidth;
          const totalDistance = w * (numSections - 1);
          const bufferDistance = Math.min(800, Math.max(500, w * 0.45));
          const scrollDistance = totalDistance + bufferDistance;
          const moveRatio = totalDistance / scrollDistance;
          const stepDuration = moveRatio / Math.max(1, numSections - 1);
          return { w, totalDistance, bufferDistance, scrollDistance, moveRatio, stepDuration };
        };

        const initialMetrics = getMetrics();

        const tl = gsap.timeline({
          scrollTrigger: {
            id: "process-pin",
            trigger: triggerEl,
            pin: true,
            scrub: 0.8,
            end: () => `+=${getMetrics().scrollDistance}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              const currentMetrics = getMetrics();
              const normalizedProgress = Math.min(1, self.progress / currentMetrics.moveRatio);
              const currentStep = Math.min(
                numSections,
                Math.max(1, Math.round(normalizedProgress * (numSections - 1)) + 1),
              );
              setActiveStep(currentStep);
            },
          },
        });

        // Horizontal Scroll: Exact step translation with lingering room for last card
        tl.to(
          sectionRef.current,
          {
            xPercent: (-100 * (numSections - 1)) / numSections,
            ease: "none",
            duration: initialMetrics.moveRatio,
          },
          0,
        );

        // Gentle buffer before unpinning
        tl.to(
          {},
          { duration: initialMetrics.bufferDistance / initialMetrics.scrollDistance },
          initialMetrics.moveRatio,
        );

        // Advanced Horizontal Parallax: Continuous smooth entrance & exit per card
        sections.forEach((section, i) => {
          const img = section.querySelector("img");
          if (!img) return;

          gsap.set(img, { scale: 1.15, force3D: true });

          if (i === 0) {
            // Card 0 starts in view and exits to the left
            tl.fromTo(
              img,
              { xPercent: 0 },
              { xPercent: 12, ease: "none", duration: initialMetrics.stepDuration },
              0,
            );
          } else if (i < numSections - 1) {
            // Middle cards enter from right and exit to left
            const enterStart = (i - 1) * initialMetrics.stepDuration;
            const exitStart = i * initialMetrics.stepDuration;
            tl.fromTo(
              img,
              { xPercent: -12 },
              { xPercent: 0, ease: "none", duration: initialMetrics.stepDuration },
              enterStart,
            );
            tl.to(
              img,
              { xPercent: 12, ease: "none", duration: initialMetrics.stepDuration },
              exitStart,
            );
          } else {
            // Last card enters from right and settles in center
            const enterStart = (i - 1) * initialMetrics.stepDuration;
            tl.fromTo(
              img,
              { xPercent: -12 },
              { xPercent: 0, ease: "none", duration: initialMetrics.stepDuration },
              enterStart,
            );
          }
        });

        // SVG Line Drawing syncs with horizontal scroll
        if (pathEl) {
          tl.to(
            pathEl,
            {
              strokeDashoffset: 0,
              ease: "none",
              duration: initialMetrics.moveRatio,
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

      return () => {
        mm.revert();
      };
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
        const totalTravel = totalDist * 0.82; // accounts for dwell buffer
        const targetScroll =
          scrollTrigger.start + (index / Math.max(1, steps.length - 1)) * totalTravel;
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
      }
    } else {
      const cards = triggerRef.current?.querySelectorAll(".process-card");
      if (cards?.[index]) {
        cards[index].scrollIntoView({ behavior: "smooth", block: "start" });
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
        className="relative flex min-h-screen md:h-screen w-full flex-col overflow-x-hidden md:flex-row md:items-center"
      >
        {/* Section Header with Interactive Step Indicators */}
        <div className="absolute top-20 left-6 z-elevated flex flex-wrap items-center gap-3 md:top-24 md:left-12">
          <h2
            id="process-heading"
            className="rounded-full border border-border bg-surface/80 px-4 py-2 text-xs uppercase tracking-widest backdrop-blur-md md:text-sm font-bold shadow-xs"
          >
            Production Pipeline
          </h2>

          {/* Interactive Step Navigator */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Process steps">
            {steps.map((s, idx) => {
              const isCurrent = activeStep === idx + 1;
              return (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => handleCardFocus(idx)}
                  aria-label={`Step ${String(idx + 1).padStart(2, "0")}: ${s.title}`}
                  aria-selected={isCurrent}
                  role="tab"
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-xs font-bold transition-all duration-300 cursor-pointer border backdrop-blur-md",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground shadow-xs dark:border-brand-lime dark:bg-brand-lime dark:text-black scale-105"
                      : "border-border/60 bg-surface/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-surface/90",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      isCurrent
                        ? "bg-primary-foreground dark:bg-black animate-pulse"
                        : "bg-muted-foreground/40",
                    )}
                  />
                  <span>{String(idx + 1).padStart(2, "0")}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Track Container */}
        <div
          className="relative flex h-auto w-full flex-col pt-28 md:h-full md:w-max md:flex-row md:pt-0"
          ref={sectionRef}
        >
          {/* Decorative Thread SVG - Spans across all cards */}
          <div
            className="pointer-events-none absolute top-1/2 left-0 z-behind hidden h-72 w-full -translate-y-1/2 opacity-25 md:block"
            aria-hidden="true"
          >
            <svg className="h-full w-full" viewBox="0 0 4000 200" preserveAspectRatio="none">
              <title>Decorative Process Line</title>
              <path
                ref={pathRef}
                d="M 0,100 C 500,220 1000,-20 1500,100 C 2000,220 2500,-20 3000,100 C 3500,220 3800,-20 4000,100"
                fill="none"
                stroke="currentColor"
                className="text-primary dark:text-brand-lime"
                strokeWidth="4"
              />
            </svg>
          </div>
          {steps.map((step, index) => (
            <div
              key={step.id || index}
              className="process-card relative z-default flex min-h-[70vh] w-full shrink-0 items-center justify-center border-border border-b p-4 md:h-full md:min-h-0 md:w-full md:shrink-0 md:border-r md:border-b-0 md:p-12"
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
                    className="pointer-events-none select-none absolute top-4 left-4 font-mono font-black text-6xl sm:text-7xl md:text-8xl text-white/40 drop-shadow-md leading-none"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Content Side */}
                <div className="relative flex flex-col justify-center">
                  {/* Mobile Inline Step Badge */}
                  <span className="inline-flex md:hidden items-center gap-1.5 mb-2 font-mono text-xs font-bold text-primary dark:text-brand-lime">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary dark:bg-brand-lime animate-pulse" />
                    STEP {String(index + 1).padStart(2, "0")} OF{" "}
                    {String(steps.length).padStart(2, "0")}
                  </span>

                  <h3 className="mb-4 font-bold text-2xl sm:text-3xl md:text-4xl uppercase leading-[0.9] md:mb-8">
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
