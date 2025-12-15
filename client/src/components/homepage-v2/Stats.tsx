import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
    <span className="inline-block relative">
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
        "(min-width: 1024px)": function () {
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
      className="relative w-full min-h-screen lg:min-h-[150vh] flex flex-col lg:flex-row bg-[#050505] border-t border-white/10"
    >
      {/* Sticky Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1590644365607-1c5a29d250c4?q=80&w=2070&auto=format&fit=crop"
            alt="Factory Background"
            decoding="async"
            loading="lazy" // OPTIMIZATION: bandwidth defense
            fetchPriority="low" // OPTIMIZATION: LCP defense
            className="w-full h-full object-cover opacity-30 grayscale filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        </div>
      </div>

      {/* Left Side */}
      <div
        ref={leftRef}
        className="w-full lg:w-1/2 lg:h-screen flex flex-col justify-center p-4 md:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/10 relative z-10 text-[#FAFAFA] bg-black/20 lg:bg-transparent backdrop-blur-xs lg:backdrop-blur-none"
      >
        <div className="flex flex-col justify-center relative z-10 pt-12 md:pt-0">
          <h2 className="text-[10vw] md:text-[4vw] uppercase font-bold leading-tight mb-4 md:mb-8">
            The Evolution of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-white bg-300% animate-gradient">
              Athletic Craftsmanship
            </span>
          </h2>
          <p className="text-sm md:text-xl font-light max-w-md text-gray-300 leading-relaxed">
            Blending century-old artisanal techniques with cutting-edge robotic precision. We don't
            just manufacture; we engineer performance.
          </p>
        </div>
      </div>

      {/* Right Scrollable Side */}
      <div ref={rightRef} className="w-full lg:w-1/2 flex flex-col relative z-10 text-[#FAFAFA]">
        {KEY_STATS.map((stat) => (
          <div
            key={stat.label}
            className="stat-item h-[40vh] md:h-[50vh] flex flex-col justify-center p-4 md:p-16 border-b border-white/10 last:border-b-0 backdrop-blur-xs bg-black/10"
          >
            <h3 className="text-[20vw] md:text-[12vw] leading-none font-bold tracking-tighter">
              <ScrambleNumber value={stat.value} />
            </h3>
            <div className="h-[1px] w-full bg-white/30 my-4 transform origin-left scale-x-100 transition-transform duration-700" />
            <h4 className="text-xl md:text-2xl uppercase font-bold mb-2">{stat.label}</h4>
            <p className="text-sm md:text-base text-gray-400">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
