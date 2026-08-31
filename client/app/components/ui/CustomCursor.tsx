import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { gsap, useGSAP } from "@/lib/gsap";
import { useCursorStore } from "@/stores/useCursorStore";

/**
 * CustomCursor - Dual-layer cursor with states (DEFAULT, BUTTON, VIEW)
 * Provides a premium interactive feel with GSAP-powered smooth following.
 * Automatically disabled on mobile/touch devices and when reduced motion is preferred.
 */
export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const { cursorVariant, cursorImage } = useCursorStore();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
    }
  }, []);

  const isDisabled = isTouchDevice || prefersReducedMotion;

  useEffect(() => {
    if (isDisabled) return;
    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = "";
    };
  }, [isDisabled]);

  useGSAP(
    () => {
      if (isDisabled) return;
      const cursor = cursorRef.current;
      const follower = followerRef.current;

      if (!cursor || !follower) {
        return;
      }

      // Initialize hidden for clean first mousemove entrance
      gsap.set(cursor, { xPercent: -50, yPercent: -50, x: 0, y: 0, opacity: 0 });
      gsap.set(follower, { xPercent: -50, yPercent: -50, x: 0, y: 0, opacity: 0 });

      // Use QuickTo for high performance updates
      const xToCursor = gsap.quickTo(cursor, "x", {
        duration: 0.08,
        ease: "power2.out",
      });
      const yToCursor = gsap.quickTo(cursor, "y", {
        duration: 0.08,
        ease: "power2.out",
      });

      // Ultra-snappy 0.08s duration for fluid, zero-lag following
      const xToFollower = gsap.quickTo(follower, "x", {
        duration: 0.08,
        ease: "power2.out",
      });
      const yToFollower = gsap.quickTo(follower, "y", {
        duration: 0.08,
        ease: "power2.out",
      });

      let hasMoved = false;
      let lastX = 0;
      let lastY = 0;

      const moveCursor = (e: PointerEvent) => {
        if (e.pointerType === "touch") {
          setIsTouchDevice(true);
          return;
        }

        lastX = e.clientX;
        lastY = e.clientY;

        if (!hasMoved) {
          hasMoved = true;
          gsap.to([cursor, follower], { opacity: 1, duration: 0.15 });
        }

        // Restore native cursor over inputs for accessibility
        const target = e.target as HTMLElement | null;
        const isInput =
          target &&
          (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

        if (isInput) {
          document.body.style.cursor = "auto";
          gsap.to([cursor, follower], { opacity: 0.2, duration: 0.15 });
        } else {
          document.body.style.cursor = "none";
          gsap.to([cursor, follower], { opacity: 1, duration: 0.15 });
        }

        xToCursor(e.clientX);
        yToCursor(e.clientY);
        xToFollower(e.clientX);
        yToFollower(e.clientY);
      };

      const handleScroll = () => {
        if (!hasMoved || lastX === 0) return;
        // Keep cursor follower synchronized during mousewheel scrolling
        xToCursor(lastX);
        yToCursor(lastY);
        xToFollower(lastX);
        yToFollower(lastY);
      };

      const handleMouseLeave = () => {
        hasMoved = false;
        gsap.to([cursor, follower], { opacity: 0, duration: 0.15 });
      };

      window.addEventListener("pointermove", moveCursor, { passive: true });
      window.addEventListener("scroll", handleScroll, { passive: true });
      document.documentElement.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        window.removeEventListener("pointermove", moveCursor);
        window.removeEventListener("scroll", handleScroll);
        document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      };
    },
    { dependencies: [isDisabled] },
  );

  useGSAP(
    () => {
      if (isDisabled) return;
      const follower = followerRef.current;
      const cursor = cursorRef.current;
      if (!follower || !cursor) {
        return;
      }

      if (cursorVariant === "view" && cursorImage) {
        // VIEW State: Floating preview tooltip with smart boundary clamping
        gsap.to(follower, {
          width: 220,
          height: 160,
          xPercent: 12,
          yPercent: -88,
          borderRadius: "12px",
          opacity: 0.95,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          borderWidth: 1,
          borderColor: "var(--color-primary)",
          mixBlendMode: "normal",
          duration: 0.25,
          ease: "power2.out",
        });
        gsap.to(cursor, {
          opacity: 1,
          scale: 0.8,
          backgroundColor: "var(--color-primary)",
          mixBlendMode: "normal",
          duration: 0.15,
        });
      } else if (cursorVariant === "button") {
        // BUTTON State: Glowing interactive ring with precision center focal dot
        gsap.to(follower, {
          width: 64,
          height: 64,
          xPercent: -50,
          yPercent: -50,
          borderRadius: "9999px",
          opacity: 1,
          backgroundColor: "rgba(99, 102, 241, 0.15)",
          mixBlendMode: "normal",
          borderWidth: 1.5,
          borderColor: "var(--color-primary)",
          duration: 0.25,
          ease: "power2.out",
        });
        gsap.to(cursor, {
          opacity: 1,
          scale: 0.5,
          backgroundColor: "var(--color-primary)",
          mixBlendMode: "normal",
          duration: 0.15,
        });
      } else {
        // DEFAULT State
        gsap.to(follower, {
          width: 16,
          height: 16,
          xPercent: -50,
          yPercent: -50,
          borderRadius: "9999px",
          opacity: 1,
          backgroundColor: "#ffffff",
          mixBlendMode: "difference",
          borderWidth: 1,
          borderColor: "#ffffff",
          duration: 0.25,
          ease: "power2.out",
        });
        gsap.to(cursor, {
          opacity: 1,
          scale: 1,
          backgroundColor: "#ffffff",
          mixBlendMode: "difference",
        });
      }
    },
    { dependencies: [isDisabled, cursorVariant, cursorImage] },
  );

  if (isDisabled) return null;

  return (
    <>
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-cursor h-2 w-2 cursor-dot"
      />
      <div
        ref={followerRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-cursor h-4 w-4 cursor-follower overflow-hidden rounded-full"
      >
        {cursorVariant === "view" && cursorImage && (
          <img
            src={cursorImage}
            alt=""
            className="fade-in zoom-in h-full w-full animate-in object-cover duration-500 pointer-events-none"
            onError={(e) => {
              // Hide broken image gracefully
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>
    </>
  );
};
