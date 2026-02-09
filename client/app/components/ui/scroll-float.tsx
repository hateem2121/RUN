// Fallback imports for development
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type React from "react";
import { type ReactNode, type RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { AnimationErrorBoundary } from "@/components/error-boundaries/animation-error-boundary";

// Use global GSAP instance from HTML head
declare global {
  interface Window {
    gsap: typeof gsap;
    ScrollTrigger: typeof ScrollTrigger;
  }
}

// Ensure ScrollTrigger is registered (fallback)
if (typeof window !== "undefined" && !window.gsap && gsap) {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollFloatProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  containerClassName?: string | undefined;
  textClassName?: string | undefined;
  animationDuration?: number | undefined;
  ease?: string | undefined;
  scrollStart?: string | undefined;
  scrollEnd?: string | undefined;
  stagger?: number | undefined;
  // TIMING COORDINATION: Wait for expansion completion
  waitForTrigger?: boolean | undefined;
  triggerCondition?: boolean | undefined;
  // DRAMATIC ENHANCEMENT OPTIONS
  dramatiMode?: "cinematic" | "explosive" | "elegant" | "standard";
  rotationRange?: number | undefined;
  scaleRange?: [number, number];
  yRange?: [number, number];
  opacityRange?: [number, number];
  blurSm?: boolean | undefined;
  glitch?: boolean | undefined;
}

const ScrollFloatComponent: React.FC<ScrollFloatProps> = ({
  children,
  scrollContainerRef,
  containerClassName = "",
  textClassName = "",
  animationDuration = 1,
  ease = "back.inOut(2)",
  scrollStart = "center bottom+=50%",
  scrollEnd = "bottom bottom-=40%",
  stagger = 0.03,
  waitForTrigger = false,
  triggerCondition = true,
  // DRAMATIC ENHANCEMENT DEFAULTS
  dramatiMode = "standard",
  rotationRange = 0,
  scaleRange = [0.5, 1],
  yRange = [100, 0],
  opacityRange = [0, 1],
  blurSm = false,
  glitch = false,
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  // Phase 2: Enhanced Mobile Gestures - ScrollFloat touch support
  const touchStart = useRef<{ y: number; time: number } | null>(null);
  const touchVelocity = useRef<number>(0);
  const isTouchDevice = useRef<boolean>(false);
  const touchInProgress = useRef<boolean>(false);
  // const touchProgressThreshold = useRef<number>(0.3); // For manual progress control
  const scrollTriggerInstance = useRef<{
    pause?: () => void;
    resume?: () => void;
    progress: number;
  } | null>(null);
  const animationProgress = useRef<number>(0);

  const splitText = useMemo(() => {
    const text = typeof children === "string" ? children : "";
    return text.split("").map((char, index) => (
      <span className="inline-block" key={index}>
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  }, [children]);

  // Phase 2: Mobile Gesture Detection and Setup
  useEffect(() => {
    // Detect if device supports touch
    isTouchDevice.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice.current) {
    }
  }, []);

  // Phase 2: Touch Event Handlers for Mobile Animation Control
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isTouchDevice.current || !containerRef.current) {
      return;
    }

    const touch = e.touches[0];
    if (!touch) {
      return;
    }
    touchStart.current = {
      y: touch.clientY,
      time: Date.now(),
    };

    touchInProgress.current = true;

    // Pause ScrollTrigger animation during manual touch control
    scrollTriggerInstance.current?.pause?.();
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isTouchDevice.current || !touchStart.current || !containerRef.current) {
        return;
      }

      const touch = e.touches[0];
      if (!touch) {
        return;
      }
      const deltaY = touchStart.current.y - touch.clientY;
      const deltaTime = Date.now() - touchStart.current.time;

      // Calculate velocity
      if (deltaTime > 0) {
        touchVelocity.current = deltaY / deltaTime;
      }

      // Calculate manual progress based on vertical swipe
      const swipeDistance = Math.abs(deltaY);
      const maxSwipeDistance = window.innerHeight * 0.5; // Half screen height for full progress
      const progress = Math.min(swipeDistance / maxSwipeDistance, 1);

      // Update animation progress manually
      if (window.gsap && containerRef.current) {
        const spans = containerRef.current.querySelectorAll("span");
        spans.forEach((span, index) => {
          const staggeredProgress = Math.max(0, progress - index * stagger);
          const clampedProgress = Math.min(staggeredProgress, 1);

          // Apply smooth transform based on progress
          window.gsap.set(span, {
            y: yRange[0] * (1 - clampedProgress) + yRange[1] * clampedProgress,
            opacity: opacityRange[0] * (1 - clampedProgress) + opacityRange[1] * clampedProgress,
            scale: scaleRange[0] * (1 - clampedProgress) + scaleRange[1] * clampedProgress,
            rotation: rotationRange * (1 - clampedProgress),
          });
        });
      }

      animationProgress.current = progress;

      // Prevent default scrolling during gesture
      if (Math.abs(touchVelocity.current) > 0.1) {
        e.preventDefault();
      }
    },
    [stagger, yRange, opacityRange, scaleRange, rotationRange],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isTouchDevice.current || !touchStart.current || !containerRef.current) {
      return;
    }

    // const touchEndTime = Date.now();

    // Resume ScrollTrigger animation
    scrollTriggerInstance.current?.resume?.();

    // Note: ScrollTrigger progress is read-only from onUpdate callback
    // Manual progress control would require the full ScrollTrigger instance

    // Reset touch state
    touchStart.current = null;
    touchVelocity.current = 0;
    touchInProgress.current = false;
  }, []);

  // Dramatic mode configuration
  // Dramatic mode configuration
  const getDramaticConfig = useCallback(() => {
    switch (dramatiMode) {
      case "cinematic":
        return {
          ease: "power4.inOut",
          rotationRange: 15,
          scaleRange: [0.3, 1] as [number, number],
          yRange: [150, 0] as [number, number],
          opacityRange: [0, 1] as [number, number],
          stagger: 0.08,
          duration: 1.8,
        };
      case "explosive":
        return {
          ease: "elastic.out(1.2, 0.5)",
          rotationRange: 25,
          scaleRange: [0.1, 1] as [number, number],
          yRange: [200, 0] as [number, number],
          opacityRange: [0, 1] as [number, number],
          stagger: 0.05,
          duration: 2.2,
        };
      case "elegant":
        return {
          ease: "power3.inOut",
          rotationRange: 5,
          scaleRange: [0.7, 1] as [number, number],
          yRange: [80, 0] as [number, number],
          opacityRange: [0, 1] as [number, number],
          stagger: 0.06,
          duration: 1.4,
        };
      default:
        return {
          ease,
          rotationRange,
          scaleRange,
          yRange,
          opacityRange,
          stagger,
          duration: animationDuration,
        };
    }
  }, [
    dramatiMode,
    ease,
    rotationRange,
    scaleRange,
    yRange,
    opacityRange,
    stagger,
    animationDuration,
  ]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    // TIMING COORDINATION: Wait for trigger condition if specified
    if (waitForTrigger && !triggerCondition) {
      return;
    }

    // Use global GSAP or fallback to imported
    const GSAP = typeof window !== "undefined" && window.gsap ? window.gsap : gsap;

    if (!GSAP) {
      return;
    }

    const config = getDramaticConfig();

    const scroller = scrollContainerRef?.current ? scrollContainerRef.current : window;

    const charElements = el.querySelectorAll(".inline-block");

    if (charElements.length === 0) {
      return;
    }

    // Enhanced initial setup with dramatic effects
    const initialProps: gsap.TweenVars = {
      willChange: "opacity, transform",
      opacity: config.opacityRange[0],
      yPercent: config.yRange[0] === 0 ? 120 : config.yRange[0] / 10, // Scale percentage appropriately
      scaleY: config.scaleRange[0] === 1 ? 2.3 : config.scaleRange[0],
      scaleX: config.scaleRange[0] === 1 ? 0.7 : config.scaleRange[0],
      rotation: config.rotationRange * (Math.random() - 0.5) * 2, // Random initial rotation
      transformOrigin: "50% 0%",
    };

    // Add blur-sm effect if enabled
    if (blurSm) {
      initialProps.filter = "blur(10px)";
    }

    // Add glitch effect if enabled
    if (glitch) {
      initialProps.skewX = Math.random() * 10 - 5;
      initialProps.skewY = Math.random() * 5 - 2.5;
    }

    // Enhanced animation properties
    const animationProps: gsap.TweenVars = {
      duration: config.duration,
      ease: config.ease,
      opacity: config.opacityRange[1],
      yPercent: 0,
      scaleY: 1,
      scaleX: 1,
      rotation: 0,
      stagger: config.stagger,
      scrollTrigger: {
        trigger: el,
        scroller,
        start: scrollStart,
        end: scrollEnd,
        scrub: true,
        onUpdate: (self: { progress: number; pause?: () => void; resume?: () => void }) => {
          // Store current ScrollTrigger instance for mobile control
          scrollTriggerInstance.current = self;
        },
        onToggle: (_self: { isActive: boolean }) => {},
      },
    };

    // Add blur-sm removal if enabled
    if (blurSm) {
      animationProps.filter = "blur(0px)";
    }

    // Add glitch correction if enabled
    if (glitch) {
      animationProps.skewX = 0;
      animationProps.skewY = 0;
    }

    const animation = GSAP.fromTo(charElements, initialProps, animationProps);

    // Add secondary animation layer for extra drama
    if (dramatiMode === "cinematic" || dramatiMode === "explosive") {
      GSAP.to(charElements, {
        duration: config.duration * 0.5,
        scale: config.scaleRange[1] * 1.1, // Slight overshoot
        ease: "power2.out",
        delay: config.duration * 0.7,
        stagger: config.stagger * 0.5,
        yoyo: true,
        repeat: 1,
      });
    }

    // Cleanup function
    return () => {
      if (animation?.scrollTrigger) {
        animation.scrollTrigger.kill();
      }
      if (animation) {
        animation.kill();
      }
    };
  }, [
    scrollContainerRef,
    scrollStart,
    scrollEnd,
    waitForTrigger,
    triggerCondition,
    dramatiMode,
    blurSm,
    glitch,
    getDramaticConfig,
  ]);

  // Phase 2: Touch Event Listeners for Mobile Gesture Support
  useEffect(() => {
    if (!isTouchDevice.current || !containerRef.current) {
      return;
    }

    const element = containerRef.current;

    // Add touch event listeners with passive: false for preventDefault
    element.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchEnd, handleTouchMove, handleTouchStart]);

  return (
    <h2
      ref={containerRef}
      className={`my-5 overflow-hidden ${containerClassName}`}
      style={{
        contain: "layout style paint",
        willChange: "transform, opacity",
      }}
    >
      <span className={`inline-block text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] ${textClassName}`}>
        {splitText}
      </span>
    </h2>
  );
};

// Export wrapped component with enhanced error boundary protection
export const ScrollFloat: React.FC<ScrollFloatProps> = (props) => {
  return (
    <AnimationErrorBoundary componentName="ScrollFloat">
      <ScrollFloatComponent {...props} />
    </AnimationErrorBoundary>
  );
};
