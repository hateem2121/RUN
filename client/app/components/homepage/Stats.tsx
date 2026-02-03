import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { KEY_STATS } from "./constants";

// Scramble Component
const ScrambleNumber: React.FC<{ value: string }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState("000");
  const elementRef = useRef<HTMLSpanElement>(null);
  // Use only digits for clean number animation (removed !@#$%^&*)
  const chars = "0123456789";

  useEffect(() => {
    if (!elementRef.current) return;

    let st: ScrollTrigger | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const runScramble = () => {
      let iterations = 0;
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

    st = ScrollTrigger.create({
      trigger: elementRef.current,
      start: "top 90%",
      onEnter: () => {
        runScramble();
      },
    });

    return () => {
      if (st) st.kill();
      if (intervalId) clearInterval(intervalId);
    };
  }, [value]);

  return (
    <span className="relative inline-block">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" ref={elementRef}>
        {displayValue}
      </span>
    </span>
  );
};

const Stats: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !rightRef.current || !leftRef.current) return;

    // Explicitly use .current
    const scope = containerRef.current;

    const ctx = gsap.context(() => {
      // Defensive check inside context
      if (!leftRef.current || !rightRef.current) return;

      ScrollTrigger.matchMedia({
        // Desktop
        "(min-width: 768px)": () => {
          // Pin logic for left side
          ScrollTrigger.create({
            trigger: scope,
            start: "top top",
            end: "bottom bottom",
            pin: leftRef.current,
            pinSpacing: false,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          });
        },
      });

      // Animate content fade in
      const stats = rightRef.current.querySelectorAll(".stat-item");
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
    }, scope); // Scope to container

    return () => {
      ctx.revert(); // Safely kill all triggers created in this context
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen w-full flex-col border-white/10 border-t bg-surface-dark md:min-h-[150vh] md:flex-row"
    >
      {/* Sticky Background Image */}
      <div className="pointer-events-none absolute inset-0 z-base">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1590644365607-1c5a29d250c4?q=80&w=2070&auto=format&fit=crop"
            alt="Factory Background"
            decoding="async"
            className="h-full w-full object-cover opacity-30 contrast-125 grayscale filter"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black via-black/50 to-transparent" />
        </div>
      </div>

      {/* Left Side */}
      <div
        ref={leftRef}
        className="relative z-elevated flex w-full flex-col justify-center border-white/10 border-b bg-black/20 p-6 text-white backdrop-blur-sm md:h-screen md:w-1/2 md:border-r md:border-b-0 md:bg-transparent md:p-16 md:backdrop-blur-none"
      >
        <div className="relative z-elevated flex flex-col justify-center pt-12 md:pt-0">
          <h2 className="mb-4 font-bold text-[10vw] uppercase leading-tight md:mb-8 md:text-[4vw]">
            The Evolution of <br />
            <span className="animate-gradient bg-300% bg-linear-to-r from-blue-500 to-white bg-clip-text text-transparent">
              Athletic Craftsmanship
            </span>
          </h2>
          <p className="max-w-md font-light text-white/60 text-sm leading-relaxed md:text-xl">
            Blending century-old artisanal techniques with cutting-edge robotic precision. We don't
            just manufacture; we engineer performance.
          </p>
        </div>
      </div>

      {/* Right Scrollable Side */}
      <div ref={rightRef} className="relative z-elevated flex w-full flex-col text-white md:w-1/2">
        {KEY_STATS.map((stat, index) => (
          <div
            key={index}
            className="stat-item flex h-[40vh] flex-col justify-center border-white/10 border-b bg-black/10 p-6 backdrop-blur-sm last:border-b-0 md:h-loading-content md:p-16"
          >
            <h3 className="font-bold text-[20vw] leading-none tracking-tighter md:text-[12vw]">
              <ScrambleNumber value={stat.value} />
            </h3>
            <div className="my-4 h-[1px] w-full origin-left scale-x-100 transform bg-white/30 transition-transform duration-700" />
            <h4 className="mb-2 font-bold text-xl uppercase md:text-2xl">{stat.label}</h4>
            <p className="text-white/60 text-sm md:text-base">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
