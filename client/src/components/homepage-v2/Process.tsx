import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import { PROCESS_STEPS } from "./constants";

// Register Plugin Local Scope as well to be safe
gsap.registerPlugin(ScrollTrigger);

const Process: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    // Strict null checks
    if (!sectionRef.current || !triggerRef.current || !pathRef.current) return;

    // Capture refs for cleanup usage
    const triggerEl = triggerRef.current;
    const pathEl = pathRef.current;

    const ctx = gsap.context(() => {
      // Safe Scoped Selector with explicit Generic Type
      const sections = gsap.utils.toArray<HTMLElement>(triggerEl.querySelectorAll(".process-card"));

      // Prevent GSAP target null warning if empty
      if (sections.length === 0) return;

      // Initial set for SVG line
      if (pathEl) {
        const length = pathEl.getTotalLength();
        gsap.set(pathEl, { strokeDasharray: length, strokeDashoffset: length });
      }

      // Define animations for different breakpoints
      const setupDesktopAnimation = () => {
        // Calculate exact scroll distance needed for 1:1 mapping
        // Making it slightly larger (e.g. * 1) per section ensures smoother feeling
        const totalScroll = window.innerWidth * (sections.length - 1);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: triggerEl,
            pin: true,
            scrub: 1,
            // "top top" works well if header doesn't obscure.
            // If header overlays, "top top" is fine because we want it pinned at viewport top.
            start: "top top",
            end: () => `+=${totalScroll}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        // Horizontal Scroll - Animate the Wrapper
        if (sectionRef.current) {
          tl.to(
            sectionRef.current,
            {
              xPercent: -100 * (sections.length - 1),
              ease: "none",
            },
            0,
          );
        }

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
      };

      const setupMobileAnimation = () => {
        if (sectionRef.current) {
          gsap.set(sectionRef.current, { xPercent: 0 });
        }
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
                  toggleActions: "play none none reverse",
                },
              },
            );
          }
        });
      };

      ScrollTrigger.matchMedia({
        // Desktop: Horizontal Scroll
        "(min-width: 768px)": setupDesktopAnimation,

        // Mobile: Vertical Stack (Reset transforms)
        "(max-width: 767px)": setupMobileAnimation,
      });
    }, triggerEl); // Pass element directly, not ref object

    // Force refresh to ensure start/end positions are calculated correctly after render
    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className="overflow-hidden bg-neutral-950 text-neutral-50">
      <div
        ref={triggerRef}
        className="relative flex min-h-screen w-full flex-col overflow-x-hidden supports-[min-height:100dvh]:min-h-[100dvh] md:flex-row md:items-center"
      >
        <div className="absolute top-8 left-8 z-20">
          <h3 className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm uppercase tracking-widest backdrop-blur-xs md:text-xl">
            Production Pipeline
          </h3>
        </div>

        {/* Decorative Drawing SVG - Desktop Only */}
        <div
          className="pointer-events-none absolute top-1/2 left-0 z-0 hidden h-[300px] w-full -translate-y-1/2 opacity-30 md:block"
          aria-hidden="true"
        >
          <svg className="h-full w-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <path
              ref={pathRef}
              d="M0,100 C250,200 500,0 1000,100"
              fill="none"
              stroke="var(--color-brand-purple)"
              strokeWidth="5"
            />
          </svg>
        </div>

        {/* Container */}
        <div
          className="flex h-auto w-full flex-col pt-24 will-change-transform md:h-full md:flex-row md:pt-0"
          ref={sectionRef}
        >
          {PROCESS_STEPS.map((step) => (
            <div
              key={step.id}
              className="process-card relative z-10 flex min-h-[60vh] w-full shrink-0 items-center justify-center border-white/10 border-b p-4 md:h-full md:min-h-0 md:w-screen md:border-r md:border-b-0 md:p-12"
            >
              <div className="grid w-full max-w-6xl grid-cols-1 gap-8 overflow-hidden rounded-xl border border-white/5 bg-neutral-950/80 p-6 backdrop-blur-md content-container md:grid-cols-2 md:gap-12 md:p-12">
                {/* Image Side */}
                <div className="group relative aspect-square overflow-hidden rounded-lg md:aspect-auto md:h-full">
                  <img
                    src={step.image}
                    alt={step.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover grayscale transition-transform duration-700 ease-out group-hover:scale-110 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-black/20 transition-all duration-500 group-hover:bg-transparent" />

                  {/* Big Number Overlay */}
                  <span className="absolute top-0 left-0 p-4 font-bold text-[15vw] text-white leading-none opacity-50 mix-blend-overlay md:text-[8vw]">
                    {step.id}
                  </span>
                </div>

                {/* Content Side */}
                <div className="relative flex flex-col justify-center">
                  <h2 className="mb-4 font-bold text-[10vw] uppercase leading-[0.9] md:mb-8 md:text-[4vw]">
                    {step.title}
                  </h2>
                  <p className="mb-8 max-w-md font-light text-base text-gray-400 leading-relaxed md:text-xl">
                    {step.description}
                  </p>
                  <div className="group flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white transition-all duration-300 hover:bg-white hover:text-black md:h-16 md:w-16">
                    <ArrowRight className="h-5 w-5 -rotate-45 transition-transform duration-300 group-hover:rotate-0 md:h-6 md:w-6" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .stroke-text-white {
          -webkit-text-stroke: 2px #FFFFFF;
        }
      `}</style>
    </section>
  );
};

export default Process;
