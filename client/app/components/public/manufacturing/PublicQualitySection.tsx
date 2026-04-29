import { useGSAP } from "@gsap/react";
import type { ManufacturingQuality, MediaAsset } from "@shared/index";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useRef } from "react";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface PublicQualitySectionProps {
  qualities?: ManufacturingQuality[];
  mediaAssets?: MediaAsset[];
}

export function PublicQualitySection({}: PublicQualitySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const circles = sectionRef.current.querySelectorAll(".progress-ring-circle");

      circles.forEach((circle) => {
        const targetValue = (circle as SVGElement).getAttribute("data-target-offset") || "0";

        gsap.fromTo(
          circle,
          { strokeDashoffset: 377 },
          {
            strokeDashoffset: targetValue,
            duration: 1.5,
            ease: "power3.out",
            scrollTrigger: {
              trigger: circle,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <ManufacturingErrorBoundary>
      <section
        ref={sectionRef}
        className="py-32 relative overflow-hidden bg-[var(--color-manufacturing-bg)]"
        aria-labelledby="quality-title"
      >
        <div className="absolute inset-0 border-y border-white/5 bg-[var(--color-manufacturing-bg)]/30"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              id="quality-title"
              className="text-6xl md:text-8xl font-neue-stance font-bold text-white uppercase leading-none tracking-tighter mb-8 italic skew-x-[-5deg]"
            >
              Zero
              <br />
              <span className="text-[var(--color-manufacturing-accent)]">Defects</span>
            </h2>
            <p className="text-[#E3DFD6] text-lg max-w-md leading-relaxed font-light">
              Our proprietary "Vision-AI" inspection system scans every inch of fabric at 300 frames
              per second, ensuring microscopic imperfections are detected before cutting begins.
            </p>
            <div className="mt-12 flex items-center space-x-4 text-sm text-[#68869A] font-mono">
              <span className="w-3 h-3 bg-[var(--color-manufacturing-accent)] rounded-none rotate-45 animate-pulse"></span>
              <span className="font-bold tracking-wider uppercase">System Status: Operational</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div
              className="glass-premium p-6 rounded-none text-center transform transition-all hover:scale-105 hover:border-[var(--color-manufacturing-accent)]/30 group"
              role="group"
              aria-label="Quality Metric: First Pass Yield"
            >
              <div className="relative w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="transform -rotate-90 w-32 h-32"
                  role="img"
                  aria-label="99.8% First Pass Yield"
                >
                  <circle
                    className="text-[#0A0A0A]"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="6"
                  ></circle>
                  <circle
                    className="text-[var(--color-manufacturing-accent)] progress-ring-circle"
                    data-target-offset="10"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    strokeDasharray="377"
                    strokeDashoffset="377"
                    strokeLinecap="butt"
                    strokeWidth="6"
                  ></circle>
                </svg>
                <span className="absolute text-2xl font-black italic text-white" aria-hidden="true">
                  99.8%
                </span>
              </div>
              <h4 className="text-[#68869A] group-hover:text-[var(--color-manufacturing-accent)] transition-colors uppercase text-xs tracking-widest font-bold">
                First Pass Yield
              </h4>
            </div>

            <div
              className="glass-premium p-6 rounded-none text-center transform transition-all hover:scale-105 hover:border-[var(--color-manufacturing-accent)]/30 group"
              role="group"
              aria-label="Quality Metric: Automation Level"
            >
              <div className="relative w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="transform -rotate-90 w-32 h-32"
                  role="img"
                  aria-label="75% Automation Level"
                >
                  <circle
                    className="text-[#0A0A0A]"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="6"
                  ></circle>
                  <circle
                    className="text-[var(--color-manufacturing-accent)] progress-ring-circle"
                    data-target-offset="94"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    strokeDasharray="377"
                    strokeDashoffset="377"
                    strokeLinecap="butt"
                    strokeWidth="6"
                  ></circle>
                </svg>
                <span className="absolute text-2xl font-black italic text-white" aria-hidden="true">
                  75%
                </span>
              </div>
              <h4 className="text-[#68869A] group-hover:text-[var(--color-manufacturing-accent)] transition-colors uppercase text-xs tracking-widest font-bold">
                Automation Level
              </h4>
            </div>

            <div
              className="glass-premium p-6 rounded-none text-center transform transition-all hover:scale-105 hover:border-[var(--color-manufacturing-accent)]/30 group"
              role="group"
              aria-label="Quality Metric: Sample Turnaround"
            >
              <div className="relative w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="transform -rotate-90 w-32 h-32"
                  role="img"
                  aria-label="48 hour Sample Turnaround"
                >
                  <circle
                    className="text-[#0A0A0A]"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="6"
                  ></circle>
                  <circle
                    className="text-[var(--color-manufacturing-accent)] progress-ring-circle"
                    data-target-offset="188"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    strokeDasharray="377"
                    strokeDashoffset="377"
                    strokeLinecap="butt"
                    strokeWidth="6"
                  ></circle>
                </svg>
                <span className="absolute text-2xl font-black italic text-white" aria-hidden="true">
                  48h
                </span>
              </div>
              <h4 className="text-[#68869A] group-hover:text-[var(--color-manufacturing-accent)] transition-colors uppercase text-xs tracking-widest font-bold">
                Sample Turnaround
              </h4>
            </div>

            <div
              className="glass-premium p-6 rounded-none text-center transform transition-all hover:scale-105 hover:border-[var(--color-manufacturing-accent)]/30 group"
              role="group"
              aria-label="Quality Metric: Traceability"
            >
              <div className="relative w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="transform -rotate-90 w-32 h-32"
                  role="img"
                  aria-label="100% Traceability"
                >
                  <circle
                    className="text-[#0A0A0A]"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    strokeWidth="6"
                  ></circle>
                  <circle
                    className="text-[var(--color-manufacturing-accent)] progress-ring-circle"
                    data-target-offset="0"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    strokeDasharray="377"
                    strokeDashoffset="377"
                    strokeLinecap="butt"
                    strokeWidth="6"
                  ></circle>
                </svg>
                <span className="absolute text-2xl font-black italic text-white" aria-hidden="true">
                  100%
                </span>
              </div>
              <h4 className="text-[#68869A] group-hover:text-[var(--color-manufacturing-accent)] transition-colors uppercase text-xs tracking-widest font-bold">
                Traceability
              </h4>
            </div>
          </div>
        </div>
      </section>
    </ManufacturingErrorBoundary>
  );
}
