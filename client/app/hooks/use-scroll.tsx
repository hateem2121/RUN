import LocomotiveScroll from "locomotive-scroll";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

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
  onScroll?: (instance: {
    scroll: number;
    limit: number;
    velocity: number;
    direction: number;
    progress: number;
  }) => void;
}

interface ScrollContextValue {
  // biome-ignore lint/suspicious/noExplicitAny: Use any to avoid fragile type issues with LocomotiveScroll v5/Lenis internal methods
  scroll: any | null;
}

const ScrollContext = createContext<ScrollContextValue>({ scroll: null });

export const useScroll = () => useContext(ScrollContext);

/**
 * Provider to make the scroll instance accessible to child components.
 */
export function ScrollProvider({
  children,
  options = {},
}: {
  children: React.ReactNode;
  options?: SmoothScrollOptions;
}) {
  // biome-ignore lint/suspicious/noExplicitAny: LocomotiveScroll v5 lacks stable public types for its internal instance
  const [scrollInstance, setScrollInstance] = useState<any | null>(null);
  // biome-ignore lint/suspicious/noExplicitAny: Internal ref for instance management
  const scrollRef = useRef<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (scrollRef.current) return;

    document.documentElement.classList.add("has-scroll-smooth");

    const scrollConfig: Record<string, unknown> = {
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
        autoRaf: false,
      },
    };

    if (options.onScroll) {
      scrollConfig.scrollCallback = options.onScroll;
    }

    const scroll = new LocomotiveScroll(scrollConfig);
    scrollRef.current = scroll;
    setScrollInstance(scroll);

    const updateScroll = (time: number) => {
      // biome-ignore lint/suspicious/noExplicitAny: raf is a public method of Lenis within LocomotiveScroll v5
      if (scroll && typeof (scroll as any).raf === "function") {
        // biome-ignore lint/suspicious/noExplicitAny: manual raf call required for GSAP ticker sync
        (scroll as any).raf(time * 1000);
      }
    };

    gsap.ticker.add(updateScroll);
    gsap.ticker.lagSmoothing(0);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(refreshTimer);
      document.documentElement.classList.remove("has-scroll-smooth");
      gsap.ticker.remove(updateScroll);

      if (scrollRef.current) {
        try {
          if (typeof scrollRef.current.destroy === "function") {
            scrollRef.current.destroy();
          }
        } catch (e) {
          console.warn("LocomotiveScroll destruction error handled:", e);
        }
        scrollRef.current = null;
        setScrollInstance(null);
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

  return (
    <ScrollContext.Provider value={{ scroll: scrollInstance }}>
      <div data-scroll-container>{children}</div>
    </ScrollContext.Provider>
  );
}

/**
 * Hook to initialize Locomotive Scroll v5 (which uses Lenis)
 * and integrate it with GSAP ScrollTrigger.
 * DEPRECATED: Use ScrollProvider and useScroll instead.
 */
export function useSmoothScroll(_options: SmoothScrollOptions = {}): void {
  useEffect(() => {
    console.warn("useSmoothScroll is deprecated. Use ScrollProvider instead.");
  }, []);
}
