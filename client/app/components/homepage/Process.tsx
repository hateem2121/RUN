import type { HomepageProcessCard } from "@shared/schemas/content/home";
import { ArrowRight } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, useGSAP } from "@/lib/gsap";
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
        // Calculate exact scroll distance needed for 1:1 mapping
        const totalWidth = triggerEl.offsetWidth * (sections.length - 1);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: triggerEl,
            pin: true,
            scrub: 1,
            end: () => `+=${totalWidth}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        // Horizontal Scroll
        tl.to(
          sections,
          {
            xPercent: -100 * (sections.length - 1),
            ease: "none",
          },
          0,
        );

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
          <h3
            id="process-heading"
            className="rounded-full border border-border bg-surface/20 px-4 py-2 text-sm uppercase tracking-widest backdrop-blur-sm md:text-xl"
          >
            Production Pipeline
          </h3>
        </div>

        {/* Decorative Drawing SVG - Desktop Only */}
        <div
          className="pointer-events-none absolute top-1/2 left-0 z-base hidden h-custom-space-146 w-full -translate-y-1/2 opacity-30 md:block"
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

        {/* Container */}
        <div
          className="flex h-auto w-full flex-col pt-24 will-change-transform md:h-full md:flex-row md:pt-0"
          ref={sectionRef}
        >
          {steps.map((step, index) => (
            <div
              key={index}
              className="process-card relative z-default flex min-h-loading-center w-full flex-shrink-0 items-center justify-center border-border border-b p-4 md:h-full md:min-h-0 md:w-screen md:border-r md:border-b-0 md:p-12"
            >
              <div className="grid w-full max-w-6xl grid-cols-1 gap-8 overflow-hidden rounded-xl border border-border/50 bg-surface/80 p-6 backdrop-blur-md content-container md:grid-cols-2 md:gap-12 md:p-12">
                {/* Image Side */}
                <div className="group relative aspect-square overflow-hidden rounded-lg md:aspect-auto md:h-full">
                  <img
                    src={
                      ("image" in step ? step.image : undefined) ||
                      ("imageId" in step && step.imageId
                        ? `/api/media/${step.imageId}/content`
                        : undefined) ||
                      FALLBACK_STEPS[index % FALLBACK_STEPS.length]?.image ||
                      ""
                    }
                    alt={step.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover grayscale transition-transform duration-700 ease-out group-hover:scale-110 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-surface/20 transition-all duration-500 group-hover:bg-transparent" />

                  {/* Big Number Overlay */}
                  <span className="absolute top-0 left-0 p-4 font-bold text-custom-space-147 text-foreground leading-none opacity-50 mix-blend-overlay md:text-custom-space-148">
                    {step.id}
                  </span>
                </div>

                {/* Content Side */}
                <div className="relative flex flex-col justify-center">
                  <h2 className="mb-4 font-bold text-custom-space-149 uppercase leading-custom-misc-155 md:mb-8 md:text-custom-space-150">
                    {step.title}
                  </h2>
                  <p className="mb-8 max-w-md font-light text-base text-muted-foreground leading-relaxed md:text-xl">
                    {step.description}
                  </p>
                  <button
                    type="button"
                    aria-label={`Proceed to next step: ${step.title}`}
                    className="group flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-foreground transition-all duration-300 hover:bg-foreground hover:text-background md:h-16 md:w-16"
                  >
                    <ArrowRight
                      aria-hidden="true"
                      className="h-5 w-5 -rotate-45 transition-transform duration-300 group-hover:rotate-0 md:h-6 md:w-6"
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
