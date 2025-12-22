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
      className="fixed inset-0 z-[9999] bg-[#050505] text-[#FAFAFA] flex flex-col justify-between overflow-hidden cursor-wait"
    >
      {/* Top Bar */}
      <div className="w-full p-8 md:p-12 flex justify-between items-start">
        <div className="text-xs md:text-sm font-mono tracking-widest opacity-70">
          RUN APPAREL (PVT) LTD
        </div>
        <div className="text-xs md:text-sm font-mono tracking-widest opacity-70 text-right">
          EST. 1889
        </div>
      </div>

      {/* Center Percentage */}
      <div className="flex flex-col items-center justify-center relative z-10 w-full">
        <h1 className="text-[25vw] leading-[0.8] font-bold tracking-tighter tabular-nums mix-blend-difference select-none">
          {progress}
        </h1>
      </div>

      {/* Bottom Section */}
      <div className="w-full p-8 md:p-12">
        <div className="flex justify-between items-end mb-4">
          <div
            ref={textRef}
            className="font-mono text-xs md:text-sm tracking-wider w-full md:w-auto min-h-[20px]"
          >
            [{loadingText}]
          </div>
          <div className="font-mono text-xs md:text-sm tracking-wider hidden md:block">
            SYSTEM STATUS: ONLINE
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full h-[2px] bg-white/20 overflow-hidden">
          <div ref={barRef} className="h-full bg-[#3300FF] w-full origin-left scale-x-0" />
        </div>
      </div>

      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-10"
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
