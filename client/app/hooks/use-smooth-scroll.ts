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
  easing?: (t: number) => number;
  wrapper?: Window | HTMLElement;
  content?: HTMLElement;
  onScroll?: (instance: { scroll: number; limit: number; velocity: number; direction: number; progress: number }) => void;
}

/**
 * Hook to initialize Locomotive Scroll v5 (which uses Lenis)
 * and integrate it with GSAP ScrollTrigger.
 * 
 * Handles React 19 double-invocations and ensures robust cleanup.
 */
export function useSmoothScroll(options: SmoothScrollOptions = {}): void {
  const scrollRef = useRef<LocomotiveScroll | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent multiple initializations in the same effect cycle (React 19)
    if (scrollRef.current) return;

    // Add a class to html to signal smooth scroll is active (used for CSS overrides)
    document.documentElement.classList.add("has-scroll-smooth");

    const scroll = new LocomotiveScroll({
      scrollCallback: options.onScroll,
      lenisOptions: {
        lerp: options.lerp ?? 0.1,
        duration: options.duration ?? 1.2,
        orientation: options.orientation ?? "vertical",
        gestureOrientation: options.gestureOrientation ?? "vertical",
        smoothWheel: options.smoothWheel ?? true,
        wheelMultiplier: options.wheelMultiplier ?? 1,
        touchMultiplier: options.touchMultiplier ?? 2,
        infinite: options.infinite ?? false,
        easing: options.easing ?? ((t: number) => Math.min(1, 1.001 - 2 ** (-10 * t))),
        wrapper: options.wrapper ?? window,
        content: options.content ?? document.documentElement,
      },
    });

    scrollRef.current = scroll;

    // Ensure ScrollTrigger is aware of the new scroller
    // v5 handles this mostly automatically, but a refresh is safe
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(refreshTimer);
      document.documentElement.classList.remove("has-scroll-smooth");
      
      if (scrollRef.current) {
        try {
          scrollRef.current.destroy();
        } catch (e) {
          console.warn("LocomotiveScroll destruction error handled:", e);
        }
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
    options.easing,
    options.wrapper,
    options.content,
    options.onScroll,
  ]);
}
