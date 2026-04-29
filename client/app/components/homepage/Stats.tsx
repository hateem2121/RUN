import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type React from "react";
import { useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { KEY_STATS } from "./constants";

// Scramble Component
const ScrambleNumber: React.FC<{ value: string }> = ({ value }) => {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(prefersReducedMotion ? value : "000");
  const elementRef = useRef<HTMLSpanElement>(null);
  const chars = "0123456789";

  useGSAP(
    () => {
      if (!elementRef.current || prefersReducedMotion) {
        if (prefersReducedMotion) setDisplayValue(value);
        return;
      }

      let intervalId: ReturnType<typeof setInterval> | null = null;

      const runScramble = () => {
        let iterations = 0;
        if (intervalId) clearInterval(intervalId);

        intervalId = setInterval(() => {
          setDisplayValue((prev) =>
            prev
              .split("")
              .map((_letter, index) => {
                if (index < iterations) return value[index];
                return chars[Math.floor(Math.random() * chars.length)];
              })
              .join(""),
          );

          if (iterations >= value.length) {
            if (intervalId) clearInterval(intervalId);
            setDisplayValue(value);
          }
          iterations += 1 / 3;
        }, 50);
      };

      ScrollTrigger.create({
        trigger: elementRef.current,
        start: "top 90%",
        onEnter: () => runScramble(),
      });

      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    },
    { dependencies: [value, prefersReducedMotion], scope: elementRef },
  );

  return (
    <span className="relative inline-block">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" ref={elementRef}>
        {displayValue}
      </span>
    </span>
  );
};

export const Stats: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !rightRef.current || !leftRef.current) return;

      const scope = containerRef.current;
      const left = leftRef.current;
      const right = rightRef.current;

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
            { opacity: 0.2, y: 50 },
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
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen w-full flex-col border-border border-t bg-background md:min-h-[150vh] md:flex-row"
      role="region"
      aria-labelledby="stats-heading"
    >
      {/* Sticky Background Image */}
      <div className="pointer-events-none absolute inset-0 z-base">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <img
            src="/images/homepage/stats-bg.png"
            alt="Factory Background"
            crossOrigin="anonymous"
            decoding="async"
            className="h-full w-full object-cover opacity-50 contrast-125"
          />
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
            className="mb-4 font-bold text-[10vw] uppercase leading-tight md:mb-8 md:text-[4vw]"
          >
            The Evolution of <br />
            <span className="animate-gradient bg-300% bg-linear-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent dark:from-blue-500 dark:to-white">
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
            key={index}
            className="stat-item flex h-[40vh] flex-col justify-center border-border border-b bg-surface/10 p-6 backdrop-blur-sm last:border-b-0 md:h-loading-content md:p-16"
          >
            <h3 className="font-bold text-[20vw] leading-none tracking-tighter md:text-[12vw]">
              <ScrambleNumber value={stat.value} />
            </h3>
            <div className="my-4 h-[1px] w-full origin-left scale-x-100 transform bg-foreground/30 transition-transform duration-700" />
            <h4 className="mb-2 font-bold text-xl uppercase md:text-2xl">{stat.label}</h4>
            <p className="text-muted-foreground text-sm md:text-base">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
