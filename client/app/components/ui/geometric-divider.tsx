import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface GeometricDividerProps {
  categoryIndex?: number | undefined;
  nextCategoryName?: string | undefined;
  className?: string | undefined;
}

export function GeometricDivider({
  // categoryIndex,
  // nextCategoryName,
  className,
  // animationDelay = 0
}: GeometricDividerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const line = containerRef.current?.querySelector<HTMLElement>(".geo-line");
      if (!line) return;

      // Animate width: 0% → 100% as element scrolls from entering to leaving viewport
      gsap.fromTo(
        line,
        { width: "0%", opacity: 0 },
        {
          width: "100%",
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            end: "bottom 20%",
            scrub: true,
            // Mirrors framer offset: ["start end", "end start"]
            // opacity fades in over first 20% then fades out over last 20%
            onUpdate(self) {
              // Replicate useTransform([0,0.2,0.8,1], [0,1,1,0]) for opacity
              const p = self.progress;
              let opacity: number;
              if (p < 0.2) {
                opacity = p / 0.2;
              } else if (p > 0.8) {
                opacity = 1 - (p - 0.8) / 0.2;
              } else {
                opacity = 1;
              }
              gsap.set(line, { opacity });
            },
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={cn("center-flex relative px-4 py-16", className)}
      style={{ willChange: "transform", position: "relative" }}
    >
      {/* Main divider line */}
      <div className="relative h-px w-full max-w-2xl">
        {/* Animated luxury line */}
        <div className="center-flex absolute inset-0">
          <div
            className="geo-line h-px"
            style={{
              width: "0%",
              opacity: 0,
              willChange: "transform",
              background:
                "linear-gradient(to right, transparent, rgba(26, 26, 26, 0.2), rgba(26, 26, 26, 0.4), rgba(26, 26, 26, 0.2), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}


