import type React from "react";
import { useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { KEY_STATS } from "./constants";

// Scramble Component with zero-churn direct DOM updates
const ScrambleNumber: React.FC<{ value: string }> = ({ value }) => {
  const prefersReducedMotion = useReducedMotion();
  const elementRef = useRef<HTMLSpanElement>(null);
  const chars = "0123456789";

  useGSAP(
    () => {
      const el = elementRef.current;
      if (!el || prefersReducedMotion) {
        if (el) el.textContent = value;
        return;
      }

      el.textContent = value.replace(/[^0-9]/g, "0");
      const scrambleProxy = { progress: 0 };
      const totalIterations = value.length;

      gsap.to(scrambleProxy, {
        progress: 1,
        duration: 1.4,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          once: true,
        },
        onUpdate: () => {
          if (!el) return;
          const iterations = scrambleProxy.progress * totalIterations;
          const nextValue = value
            .split("")
            .map((char, index) => {
              if (index < iterations) return char;
              // Preserve non-alphanumeric symbols (+, %, etc.) during scramble
              if (!/[a-zA-Z0-9]/.test(char)) return char;
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("");
          el.textContent = nextValue;
        },
        onComplete: () => {
          if (el) el.textContent = value;
        },
      });
    },
    { dependencies: [value, prefersReducedMotion], scope: elementRef },
  );

  return (
    <span className="relative inline-block">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" ref={elementRef} className="tabular-nums">
        {prefersReducedMotion ? value : value.replace(/[^0-9]/g, "0")}
      </span>
    </span>
  );
};

export const Stats: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !rightRef.current || !leftRef.current) return;

      const scope = containerRef.current;
      const left = leftRef.current;
      const right = rightRef.current;

      if (prefersReducedMotion) {
        // Set all elements to their final state without animation
        const stats = right.querySelectorAll(".stat-item");
        gsap.set(stats, { y: 0, opacity: 1 });
        return; // Skip ScrollTrigger pinning
      }

      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        // Pin logic for left side
        ScrollTrigger.create({
          trigger: scope,
          start: "top top",
          end: "bottom bottom",
          pin: left,
          pinSpacing: false,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        });
      });

      // Animate content fade in
      const stats = right.querySelectorAll(".stat-item");
      if (stats.length > 0) {
        stats.forEach((stat) => {
          gsap.fromTo(
            stat,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              scrollTrigger: {
                trigger: stat,
                start: "top 85%",
                end: "top 50%",
                scrub: true,
              },
            },
          );
        });
      }

      return () => mm.revert();
    },
    { dependencies: [prefersReducedMotion], scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      /* Required: pin height for ScrollTrigger md:min-h-[150vh] */
      className="relative flex min-h-screen w-full flex-col border-border border-t bg-background md:min-h-[150vh] md:flex-row"
      aria-labelledby="stats-heading"
    >
      {/* Sticky Background Image */}
      <div className="pointer-events-none absolute inset-0 z-base" aria-hidden="true">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <picture>
            <source srcSet="/images/homepage/stats-bg.webp" type="image/webp" />
            <img
              src="/images/homepage/stats-bg.webp"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              width={1920}
              height={1080}
              className="h-full w-full object-cover object-center brightness-110 contrast-105"
            />
          </picture>
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/80 to-transparent" />
        </div>
      </div>

      {/* Left Side */}
      <div
        ref={leftRef}
        className="relative z-elevated flex w-full flex-col justify-center border-border border-b bg-surface/20 p-6 text-foreground backdrop-blur-sm md:h-screen md:w-1/2 md:border-r md:border-b-0 md:bg-transparent md:p-16 md:pt-28 md:backdrop-blur-none"
      >
        <div className="relative z-elevated flex flex-col justify-center pt-12 md:pt-0">
          <h2
            id="stats-heading"
            className="mb-4 font-bold text-3xl sm:text-4xl md:text-5xl uppercase leading-tight md:mb-8"
          >
            The Evolution of <br />
            <span className="text-primary dark:text-manufacturing-accent">
              Athletic Craftsmanship
            </span>
          </h2>
          <p className="max-w-md font-light text-muted-foreground text-sm leading-relaxed md:text-xl">
            Blending century-old artisanal techniques with cutting-edge robotic precision. We don't
            just manufacture; we engineer performance.
          </p>
        </div>
      </div>

      {/* Right Scrollable Side */}
      <div
        ref={rightRef}
        className="relative z-elevated flex w-full flex-col text-foreground md:w-1/2"
      >
        {KEY_STATS.map((stat, index) => (
          <div
            key={stat.label || index}
            className="stat-item flex h-[40vh] flex-col justify-center border-border border-b bg-surface/10 p-6 backdrop-blur-sm last:border-b-0 md:h-loading-content md:p-16"
          >
            <div className="font-bold text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-none tracking-tighter font-mono">
              <ScrambleNumber value={stat.value} />
            </div>
            <div className="my-4 h-px w-full origin-left scale-x-100 transform bg-foreground/20 transition-transform duration-700" />
            <h3 className="mb-2 font-bold text-xl text-foreground uppercase md:text-2xl">
              {stat.label}
            </h3>
            <p className="text-muted-foreground text-sm md:text-base">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
