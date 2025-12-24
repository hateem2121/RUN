/**
 * Performance-Optimized Matrix Slogan Wrapper
 * Uses intersection observer to pause animations when not visible
 */

import { memo, useRef } from "react";
import {
  useDeviceCapabilities,
  usePerformanceObserver,
} from "@/lib/performance-intersection-observer";
import { MatrixSloganTransition } from "./matrix-slogan-transition";

interface OptimizedMatrixSloganWrapperProps {
  slogans: Array<{ id: number; text: string; color?: string }>;
  className?: string;
  displayDuration?: number;
  transitionDuration?: number;
  letterInterval?: number;
}

export const OptimizedMatrixSloganWrapper = memo(function OptimizedMatrixSloganWrapper({
  slogans,
  className,
  displayDuration,
  transitionDuration,
  letterInterval,
}: OptimizedMatrixSloganWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { isIntersecting } = usePerformanceObserver(ref, {
    threshold: 0.1,
    rootMargin: "50px",
  });

  const { isLowEnd, isMobile } = useDeviceCapabilities();

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // Determine if animations should be paused
  const shouldPause = !isIntersecting || prefersReducedMotion;

  // Adjust timing for performance on different devices
  const optimizedLetterInterval = isLowEnd ? (letterInterval || 50) * 2 : letterInterval || 50;
  const optimizedDisplayDuration = isMobile
    ? (displayDuration || 3000) * 0.8
    : displayDuration || 3000;

  return (
    <div
      ref={ref}
      className={`matrix-text-optimized animation-container ${
        isIntersecting ? "animation-active" : "animation-paused"
      } ${prefersReducedMotion ? "respect-reduced-motion" : ""}`}
      style={{
        willChange: isIntersecting && !shouldPause ? "contents" : "auto",
      }}
    >
      <MatrixSloganTransition
        slogans={slogans}
        className={className}
        displayDuration={optimizedDisplayDuration}
        transitionDuration={transitionDuration}
        letterInterval={optimizedLetterInterval}
        paused={shouldPause}
      />
    </div>
  );
});
