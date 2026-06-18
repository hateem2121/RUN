import type { ManufacturingQuality, MediaAsset } from "@shared/index";
import { useRef } from "react";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn, sanitizeContent } from "@/lib/utils";

interface PublicQualitySectionProps {
  qualities?: ManufacturingQuality[];
  mediaAssets?: MediaAsset[];
}

export function PublicQualitySection({ qualities = [] }: PublicQualitySectionProps) {
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
    { scope: sectionRef, dependencies: [qualities] },
  );

  // Define default metrics as fallback
  const defaultQualities = [
    {
      title: "First Pass Yield",
      description: "99.8%",
      targetOffset: "10",
      displayValue: "99.8%",
    },
    {
      title: "Automation Level",
      description: "75%",
      targetOffset: "94",
      displayValue: "75%",
    },
    {
      title: "Sample Turnaround",
      description: "48h",
      targetOffset: "188",
      displayValue: "48h",
    },
    {
      title: "Traceability",
      description: "100%",
      targetOffset: "0",
      displayValue: "100%",
    },
  ];

  // Map dynamic data or use defaults
  const displayQualities =
    qualities.length > 0
      ? qualities.slice(0, 4).map((q, i) => {
          const defaultQ = (defaultQualities[i] || defaultQualities[0])!;
          // Simple logic to calculate offset if description contains a percentage
          const percentageMatch = q.description?.match(/(\d+(\.\d+)?)%/);
          const percentage = percentageMatch ? parseFloat(percentageMatch[1] || "0") : 100;
          const targetOffset = Math.round(377 * (1 - percentage / 100)).toString();

          return {
            title: q.title || defaultQ.title,
            description: q.description || defaultQ.description,
            targetOffset: targetOffset || defaultQ.targetOffset,
            displayValue: q.description || defaultQ.displayValue,
          };
        })
      : defaultQualities;

  return (
    <ManufacturingErrorBoundary>
      <section
        ref={sectionRef}
        className="py-32 relative overflow-hidden bg-manufacturing-bg"
        aria-labelledby="quality-title"
      >
        <div className="absolute inset-0 border-y border-white/5 bg-manufacturing-bg/30"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2
              id="quality-title"
              className="text-6xl md:text-8xl font-neue-stance font-bold text-white uppercase leading-none tracking-tighter mb-8 italic skew-x-custom-misc-234"
            >
              Zero
              <br />
              <span className="text-manufacturing-accent">Defects</span>
            </h2>
            <p className="text-manufacturing-body text-lg max-w-md leading-relaxed font-light">
              Our proprietary "Vision-AI" inspection system scans every inch of fabric at 300 frames
              per second, ensuring microscopic imperfections are detected before cutting begins.
            </p>
            <div className="mt-12 flex items-center space-x-4 text-sm text-manufacturing-muted font-mono">
              <span className="w-3 h-3 bg-manufacturing-accent rounded-none rotate-45 animate-pulse"></span>
              <span className="font-bold tracking-wider uppercase">System Status: Operational</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {displayQualities.map((q, idx) => (
              <section
                key={idx}
                className="glass-premium p-6 rounded-none text-center transform transition-all hover:scale-105 hover:border-custom-misc-235/30 group"
                aria-label={`Quality Metric: ${q.title}`}
              >
                <div className="relative w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="transform -rotate-90 w-32 h-32"
                    role="img"
                    aria-label={`${q.displayValue} ${q.title}`}
                  >
                    <circle
                      className="text-manufacturing-bg"
                      cx="64"
                      cy="64"
                      fill="transparent"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="6"
                    ></circle>
                    <circle
                      className="text-custom-misc-236 progress-ring-circle"
                      data-target-offset={q.targetOffset}
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
                  <span
                    className={cn(
                      "absolute font-black italic text-white text-center px-2",
                      q.displayValue.length > 5 ? "text-sm" : "text-2xl",
                    )}
                    aria-hidden="true"
                  >
                    {q.displayValue.length > 8
                      ? `${q.displayValue.substring(0, 8)}...`
                      : q.displayValue}
                  </span>
                </div>
                <h4 className="text-manufacturing-muted group-hover:text-custom-misc-237 transition-colors uppercase text-xs tracking-widest font-bold mb-2">
                  {sanitizeContent(q.title)}
                </h4>
                {q.description && q.description !== q.displayValue && (
                  <p className="text-manufacturing-body text-custom-space-201 leading-tight font-light opacity-0 group-hover:opacity-100 transition-opacity">
                    {sanitizeContent(q.description)}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </ManufacturingErrorBoundary>
  );
}
