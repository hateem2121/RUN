import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

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
  scroll: null;
}

const ScrollContext = createContext<ScrollContextValue>({ scroll: null });

export const useScroll = () => useContext(ScrollContext);

/**
 * Provider to make the scroll instance accessible to child components.
 * Note: Lenis has been removed as per H09. This is now a dummy provider.
 */
export function ScrollProvider({
  children,
  options: _options = {},
}: {
  children: React.ReactNode;
  options?: SmoothScrollOptions;
}) {
  const [scrollInstance] = useState<null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.add("has-scroll-smooth");
    return () => {
      document.documentElement.classList.remove("has-scroll-smooth");
    };
  }, []);

  return (
    <ScrollContext.Provider value={{ scroll: scrollInstance }}>
      <div data-scroll-container>{children}</div>
    </ScrollContext.Provider>
  );
}

/**
 * DEPRECATED: Use ScrollProvider and useScroll instead.
 */
export function useSmoothScroll(_options: SmoothScrollOptions = {}): void {
  useEffect(() => {
    console.warn("useSmoothScroll is deprecated. Use ScrollProvider instead.");
  }, []);
}
