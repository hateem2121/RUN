import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { KEY_STATS } from '../constants';

// Scramble Component
const ScrambleNumber: React.FC<{ value: string }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState("000");
  const elementRef = useRef<HTMLSpanElement>(null);
  const chars = "0123456789!@#$%^&*";

  useEffect(() => {
    if (!elementRef.current) return;

    let st: ScrollTrigger | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const runScramble = () => {
        let iterations = 0;
        intervalId = setInterval(() => {
            setDisplayValue(prev => 
                prev.split("")
                .map((letter, index) => {
                    if (index < iterations) return value[index];
                    return chars[Math.floor(Math.random() * chars.length)]
                })
                .join("")
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
        }
    });

    return () => {
        if (st) st.kill();
        if (intervalId) clearInterval(intervalId);
    };

  }, [value]);

  return (
    <span className="inline-block relative">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" ref={elementRef}>{displayValue}</span>
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
            "(min-width: 768px)": function() {
                // Pin logic for left side
                ScrollTrigger.create({
                    trigger: scope,
                    start: "top top",
                    end: "bottom bottom",
                    pin: leftRef.current,
                    pinSpacing: false,
                    invalidateOnRefresh: true, 
                    anticipatePin: 1 
                });
            }
        });

        // Animate content fade in
        const stats = rightRef.current.querySelectorAll('.stat-item');
        if (stats.length > 0) {
            stats.forEach((stat) => {
                gsap.fromTo(stat, 
                    { opacity: 0.2, y: 50 },
                    { 
                        opacity: 1, 
                        y: 0, 
                        duration: 1,
                        scrollTrigger: {
                            trigger: stat,
                            start: "top 85%",
                            end: "top 50%",
                            scrub: true
                        }
                    }
                );
            });
        }
    }, scope); // Scope to container

    return () => {
      ctx.revert(); // Safely kill all triggers created in this context
    };
  }, []);

  return (
    <section ref={containerRef} className="relative w-full min-h-screen md:min-h-[150vh] flex flex-col md:flex-row bg-[#050505] border-t border-white/10">
      
      {/* Sticky Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="sticky top-0 h-screen w-full overflow-hidden">
             <img 
                src="https://images.unsplash.com/photo-1590644365607-1c5a29d250c4?q=80&w=2070&auto=format&fit=crop" 
                alt="Factory Background"
                decoding="async"
                className="w-full h-full object-cover opacity-30 grayscale filter contrast-125" 
             />
             <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
         </div>
      </div>

      {/* Left Side */}
      <div ref={leftRef} className="w-full md:w-1/2 md:h-screen flex flex-col justify-center p-6 md:p-16 border-b md:border-b-0 md:border-r border-white/10 relative z-10 text-[#FAFAFA] bg-black/20 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
        <div className="flex flex-col justify-center relative z-10 pt-12 md:pt-0">
            <h2 className="text-[10vw] md:text-[4vw] uppercase font-bold leading-tight mb-4 md:mb-8">
              The Evolution of <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-white bg-300% animate-gradient">Athletic Craftsmanship</span>
            </h2>
            <p className="text-sm md:text-xl font-light max-w-md text-gray-300 leading-relaxed">
              Blending century-old artisanal techniques with cutting-edge robotic precision. We don't just manufacture; we engineer performance.
            </p>
        </div>
      </div>

      {/* Right Scrollable Side */}
      <div ref={rightRef} className="w-full md:w-1/2 flex flex-col relative z-10 text-[#FAFAFA]">
        {KEY_STATS.map((stat, index) => (
          <div key={index} className="stat-item h-[40vh] md:h-[50vh] flex flex-col justify-center p-6 md:p-16 border-b border-white/10 last:border-b-0 backdrop-blur-sm bg-black/10">
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