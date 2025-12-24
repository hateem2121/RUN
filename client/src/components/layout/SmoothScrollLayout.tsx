import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type React from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { LenisContext } from "./LenisContext";

gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollLayoutProps {
  children: React.ReactNode;
}

const SmoothScrollLayout: React.FC<SmoothScrollLayoutProps> = ({ children }) => {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Proxy object to hold animation values - avoids quickTo strictness warnings
  const skewProxy = useRef({ val: 0 });

  useLayoutEffect(() => {
    // 1. Initialize Lenis
    const lenisInstance = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2.5,
      // FIX: Enable autoRaf to ensure scrolling works even if GSAP ticker desyncs
      autoRaf: true,
    });

    setLenis(lenisInstance);
    lenisRef.current = lenisInstance;

    // 2. Sync ScrollTrigger with Lenis
    lenisInstance.on("scroll", ScrollTrigger.update);

    // 3. Kinetic Scroll Skew Effect via Proxy Pattern
    lenisInstance.on("scroll", ({ velocity }: { velocity: number }) => {
      // Clamp velocity to prevent extreme skewing
      const targetSkew = Math.min(Math.max(velocity * 0.05, -3), 3);

      // Tween the proxy value - this handles the smoothing/easing
      gsap.to(skewProxy.current, {
        val: targetSkew,
        duration: 0.5,
        ease: "power3.out",
        overwrite: true,
      });
    });

    // 4. Single Ticker Loop to apply skew values to DOM
    const handleTicker = () => {
      const val = skewProxy.current.val;
      const content = contentRef.current;

      if (content && Math.abs(val) > 0.01) {
        gsap.set(content, {
          skewY: val,
          force3D: true,
          transformOrigin: "center center",
        });
      } else if (content) {
        gsap.set(content, { skewY: 0 });
      }
    };

    gsap.ticker.add(handleTicker);

    return () => {
      // Cleanup
      lenisInstance.destroy();
      gsap.ticker.remove(handleTicker);
      setLenis(null);
      lenisRef.current = null;
    };
  }, []);

  const contextValue = useMemo(() => ({ lenis }), [lenis]);

  return (
    <LenisContext.Provider value={contextValue}>
      <div
        ref={contentRef}
        className="smooth-scroll-wrapper w-full min-h-screen will-change-transform"
      >
        {children}
      </div>
    </LenisContext.Provider>
  );
};

export default SmoothScrollLayout;
