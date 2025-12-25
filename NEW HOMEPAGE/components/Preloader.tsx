import gsap from "gsap";
import type React from "react";
import { useEffect, useRef, useState } from "react";

const LOADING_TEXTS = [
  "INITIALIZING KINETIC FRAMEWORK",
  "LOADING WEBGL SHADERS",
  "CALIBRATING PHYSICS ENGINE",
  "OPTIMIZING ASSETS",
  "ESTABLISHING SECURE CONNECTION",
];

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Explicitly use .current
    const scope = containerRef.current;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      const duration = 2.5; // Total loading time

      // Animate progress value
      const progressObj = { value: 0 };
      tl.to(progressObj, {
        value: 100,
        duration: duration,
        ease: "power2.inOut",
        onUpdate: () => {
          setProgress(Math.round(progressObj.value));
        },
      });

      // Animate progress bar width
      if (barRef.current) {
        gsap.to(barRef.current, {
          scaleX: 1,
          duration: duration,
          ease: "power2.inOut",
        });
      }

      // Text Cycling Logic with Fade
      const cycleText = (index: number) => {
        if (!textRef.current) return;

        const nextIndex = (index + 1) % LOADING_TEXTS.length;
        const nextText = LOADING_TEXTS[nextIndex];

        gsap.to(textRef.current, {
          opacity: 0,
          duration: 0.25,
          ease: "power2.inOut",
          onComplete: () => {
            setLoadingText(nextText);
            gsap.to(textRef.current, {
              opacity: 1,
              duration: 0.25,
              ease: "power2.inOut",
              onComplete: () => {
                // Recursively call next cycle with a slight pause
                gsap.delayedCall(0.3, cycleText, [nextIndex]);
              },
            });
          },
        });
      };

      // Start cycling after a short delay
      gsap.delayedCall(0.5, cycleText, [0]);

      // Exit Sequence
      tl.to(scope, {
        yPercent: -100,
        duration: 1.2,
        ease: "power4.inOut",
        delay: 0.2,
        onComplete: () => {
          onComplete();
        },
      });
    }, scope);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex cursor-wait flex-col justify-between overflow-hidden bg-[#050505] text-[#FAFAFA]"
    >
      {/* Top Bar */}
      <div className="flex w-full items-start justify-between p-8 md:p-12">
        <div className="font-mono text-xs tracking-widest opacity-70 md:text-sm">
          RUN APPAREL (PVT) LTD
        </div>
        <div className="text-right font-mono text-xs tracking-widest opacity-70 md:text-sm">
          EST. 1889
        </div>
      </div>

      {/* Center Percentage */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center">
        <h1 className="select-none font-bold text-[25vw] tabular-nums leading-[0.8] tracking-tighter mix-blend-difference">
          {progress}
        </h1>
      </div>

      {/* Bottom Section */}
      <div className="w-full p-8 md:p-12">
        <div className="mb-4 flex items-end justify-between">
          <div
            ref={textRef}
            className="min-h-[20px] w-full font-mono text-xs tracking-wider md:w-auto md:text-sm"
          >
            [{loadingText}]
          </div>
          <div className="hidden font-mono text-xs tracking-wider md:block md:text-sm">
            SYSTEM STATUS: ONLINE
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="h-[2px] w-full overflow-hidden bg-white/20">
          <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-[#3300FF]" />
        </div>
      </div>

      {/* Background Grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
    </div>
  );
};

export default Preloader;
