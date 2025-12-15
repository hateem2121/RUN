/**
 * Performance-Optimized Hyperspace Background Wrapper
 * Implements viewport-based rendering control and adaptive performance
 */

import { useRef } from 'react';
import { HyperspaceBackground } from './hyperspace-background';
import { usePerformanceObserver, useDeviceCapabilities } from '@/lib/performance-intersection-observer';
// PHASE 1 CLEANUP: Removed Three.js singleton to prevent conflicts with @google/model-viewer

interface OptimizedHyperspaceBackgroundProps {
  starTrailOpacity?: number;
  starSpeed?: number;
  starColor?: string;
  starSize?: number;
  className?: string;
}

export function OptimizedHyperspaceBackground({
  starTrailOpacity = 0.5,
  starSpeed = 1.01,
  starColor = "#FFFFFF",
  starSize = 0.5,
  className,
}: OptimizedHyperspaceBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);

  // PHASE 1 CLEANUP: Removed Three.js singleton management to prevent conflicts with model-viewer
  const { isIntersecting } = usePerformanceObserver(ref, {
    threshold: 0.1,
    rootMargin: '50px',
  });

  const { isLowEnd } = useDeviceCapabilities();

  // Check for reduced motion preference separately
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Adaptive performance settings
  // const adaptiveStarCount = isLowEnd ? 100 : isMobile ? 150 : 300;
  const adaptiveSpeed = isLowEnd ? starSpeed * 0.5 : starSpeed;
  const adaptiveOpacity = isLowEnd ? starTrailOpacity * 0.5 : starTrailOpacity;

  // Don't render at all if reduced motion is preferred
  if (prefersReducedMotion) {
    return (
      <div
        ref={ref}
        className={`${className || ''} bg-gradient-to-b from-black to-gray-900`}
        style={{ minHeight: '100vh' }}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={`canvas-optimized animation-container ${isIntersecting ? 'animation-active' : 'animation-paused'
        } ${className || ''}`}
      style={{
        willChange: isIntersecting ? 'auto' : 'auto', // Canvas handles its own optimizations
      }}
    >
      {/* Only render the expensive canvas animation when visible */}
      {isIntersecting ? (
        <HyperspaceBackground
          starTrailOpacity={adaptiveOpacity}
          starSpeed={adaptiveSpeed}
          starColor={starColor}
          starSize={starSize}
        />
      ) : (
        // Static background when not visible
        <div
          className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
          }}
        />
      )}
    </div>
  );
}