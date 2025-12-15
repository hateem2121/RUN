import React, { useLayoutEffect, useRef, useState, useMemo } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LenisContext } from "./LenisContext";

gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollLayoutProps {
  children: React.ReactNode;
}

const SmoothScrollLayout: React.FC<SmoothScrollLayoutProps> = ({ children }) => {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null); // Keep ref for cleanup consistency if needed, but state drives context

  useLayoutEffect(() => {
    // 1. Initialize Lenis
    const lenisInstance = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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

    // 3. (Optional) Integrate with GSAP ticker if needed, but autoRaf handles the loop now.
    // We removed the manual ticker hijacking to prevent scroll locking issues.

    return () => {
      // Cleanup
      lenisInstance.destroy();
      setLenis(null);
      lenisRef.current = null;
    };
  }, []);

  const contextValue = useMemo(() => ({ lenis }), [lenis]);

  return (
    <LenisContext.Provider value={contextValue}>
      <div className="smooth-scroll-wrapper w-full min-h-screen">{children}</div>
    </LenisContext.Provider>
  );
};

export default SmoothScrollLayout;
