import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LocomotiveScroll from "locomotive-scroll";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollOptions {
  lerp?: number;
  duration?: number;
  orientation?: "vertical" | "horizontal";
  gestureOrientation?: "vertical" | "horizontal";
  smoothWheel?: boolean;
  wheelMultiplier?: number;
  touchMultiplier?: number;
  infinite?: boolean;
}

/**
 * Hook to initialize Locomotive Scroll v5 (which uses Lenis)
 * and integrate it with GSAP ScrollTrigger.
 */
export function useSmoothScroll(options: SmoothScrollOptions = {}): void {
  const scrollRef = useRef<LocomotiveScroll | null>(null);

  useEffect(() => {
    // Locomotive Scroll v5 initializes on the window/body by default
    // and doesn't require a specific container el in the same way v4 did.
    // It's much simpler now.

    scrollRef.current = new LocomotiveScroll({
      lenisOptions: {
        lerp: options.lerp ?? 0.1,
        duration: options.duration ?? 1.2,
        orientation: options.orientation ?? "vertical",
        gestureOrientation: options.gestureOrientation ?? "vertical",
        smoothWheel: options.smoothWheel ?? true,
        wheelMultiplier: options.wheelMultiplier ?? 1,
        touchMultiplier: options.touchMultiplier ?? 2,
        infinite: options.infinite ?? false,
      },
    });

    // v5 automatically syncs with ScrollTrigger if ScrollTrigger is registered
    // but we can manually refresh to be sure
    ScrollTrigger.refresh();

    return () => {
      if (scrollRef.current) {
        scrollRef.current.destroy();
        scrollRef.current = null;
      }
    };
  }, [
    options.lerp,
    options.duration,
    options.orientation,
    options.gestureOrientation,
    options.smoothWheel,
    options.wheelMultiplier,
    options.touchMultiplier,
    options.infinite,
  ]);
}
