import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { marqueeAnimation } from "@/lib/gsap-animations";
import { cn } from "@/lib/utils";

export interface MarqueeStripProps {
  text: string;
  speed?: number;
  accentColor?: string;
  direction?: "left" | "right";
  className?: string;
}

/**
 * A horizontal scrolling marquee strip powered by GSAP.
 */
export function MarqueeStrip({
  text,
  speed = 100,
  accentColor = "#68869A", // Brand muted color by default
  direction = "left",
  className,
}: MarqueeStripProps) {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      if (contentRef.current) {
        timelineRef.current = marqueeAnimation(contentRef.current, speed, direction) || null;
      }
    },
    { dependencies: [speed, direction], scope: containerRef },
  );

  const handleMouseEnter = () => {
    timelineRef.current?.pause();
  };

  const handleMouseLeave = () => {
    timelineRef.current?.play();
  };

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden py-4 border-y border-white/[0.08] bg-white/[0.02] backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-white/20",
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      aria-label="Scrolling marquee"
    >
      <div ref={contentRef} className="flex whitespace-nowrap items-center will-change-transform">
        {/* We duplicate the content to ensure a seamless infinite scroll */}
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className="text-4xl md:text-6xl font-neue-stance uppercase tracking-tighter px-8"
            style={{ color: accentColor }}
          >
            {text}
            <span className="mx-8 opacity-20 text-white">•</span>
          </span>
        ))}
      </div>
    </section>
  );
}
