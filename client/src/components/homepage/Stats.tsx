import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type React from "react";
import { useEffect, useRef } from "react";
import { KEY_STATS } from "./constants";

gsap.registerPlugin(ScrollTrigger);

// Scramble Component
const ScrambleNumber: React.FC<{ value: string }> = ({ value }) => {
  const elementRef = useRef<HTMLSpanElement>(null);
  const chars = "0123456789!@#$%^&*";

  useEffect(() => {
    if (!elementRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: elementRef.current,
        start: "top 90%",
        onEnter: () => {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: value.length,
            duration: 1.5,
            ease: "none",
            onUpdate: () => {
              const progress = Math.floor(obj.val);
              const scrambled = value
                .split("")
                .map((char, i) =>
                  i < progress ? char : chars[Math.floor(Math.random() * chars.length)],
                )
                .join("");
              if (elementRef.current) elementRef.current.innerText = scrambled;
            },
          });
        },
      });
    });

    return () => ctx.revert();
  }, [value]);

  return (
    <span className="relative inline-block">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" ref={elementRef}>
        000
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
        "(min-width: 1024px)": () => {
          // Pin logic for left side
          ScrollTrigger.create({
            trigger: containerRef.current,
            start: "top top",
            end: "bottom bottom",
            pin: leftRef.current,
            pinSpacing: false, // Prevents adding extra spacing which can break layout in skewed containers
            pinReparent: true, // Moves pinned element to body to avoid transform conflicts
            scrub: true,
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
      className="relative flex min-h-screen w-full flex-col border-glass border-t bg-neutral-950 lg:min-h-screen lg:flex-row"
    >
      {/* Sticky Background Image */}
      <div className="pointer-events-none absolute inset-0 z-base">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1590644365607-1c5a29d250c4?q=80&w=2070&auto=format&fit=crop"
            alt="Factory Background"
            decoding="async"
            loading="lazy" // OPTIMIZATION: bandwidth defense
            fetchPriority="low" // OPTIMIZATION: LCP defense
            className="h-full w-full object-cover opacity-30 contrast-125 grayscale filter"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        </div>
      </div>

      {/* Left Side */}
      <div
        ref={leftRef}
        className="relative z-elevated flex w-full flex-col justify-center border-glass border-b bg-black/20 p-4 text-neutral-50 backdrop-blur-xs md:p-12 lg:h-screen lg:w-1/2 lg:border-r lg:border-b-0 lg:bg-transparent lg:p-16 lg:backdrop-blur-none"
      >
        <div className="relative z-elevated flex flex-col justify-center pt-12 md:pt-0">
          <h2 className="mb-4 font-bold text-[10vw] uppercase leading-tight md:mb-8 md:text-[4vw]">
            The Evolution of <br />
            <span className="animate-gradient bg-300% bg-gradient-to-r from-blue-500 to-white bg-clip-text text-transparent">
              Athletic Craftsmanship
            </span>
          </h2>
          <p className="max-w-md font-light text-gray-300 text-sm leading-relaxed md:text-xl">
            Blending century-old artisanal techniques with cutting-edge robotic precision. We don't
            just manufacture; we engineer performance.
          </p>
        </div>
      </div>

      {/* Right Scrollable Side */}
      <div
        ref={rightRef}
        className="relative z-elevated flex w-full flex-col text-neutral-50 lg:w-1/2"
      >
        {KEY_STATS.map((stat) => (
          <div
            key={stat.label}
            className="stat-item flex h-[40vh] flex-col justify-center border-glass border-b bg-black/10 p-4 backdrop-blur-xs last:border-b-0 md:h-[50vh] md:p-16"
          >
            <h3 className="font-bold text-[20vw] leading-none tracking-tighter md:text-[12vw]">
              <ScrambleNumber value={stat.value} />
            </h3>
            <div className="my-4 h-px w-full origin-left scale-x-100 transform bg-white/30 transition-transform duration-700" />
            <h4 className="mb-2 font-bold text-xl uppercase md:text-2xl">{stat.label}</h4>
            <p className="text-gray-400 text-sm md:text-base">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
