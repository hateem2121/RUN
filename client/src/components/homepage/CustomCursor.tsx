import gsap from "gsap";
import type React from "react";
import { useEffect, useRef } from "react";
import { useStore } from "./store";
import { CursorVariant } from "./types";

// Get CSS variable value from root with semantic fallback
const getCSSVar = (name: string): string => {
  if (typeof window === "undefined") return "hsl(0 0% 100%)";
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "hsl(0 0% 100%)"
  );
};

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const { cursorVariant, cursorImage } = useStore();

  useEffect(() => {
    // Only add event listeners on desktop if needed, but CSS handles visibility.
    // However, tracking logic is fine to run as it's lightweight.
    const cursor = cursorRef.current;
    const follower = followerRef.current;

    if (!cursor || !follower) return;

    // Initialize for quickTo optimization safety
    gsap.set(cursor, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    gsap.set(follower, { xPercent: -50, yPercent: -50, x: 0, y: 0 });

    // Use QuickTo for high performance updates
    const xToCursor = gsap.quickTo(cursor, "x", {
      duration: 0.1,
      ease: "power2.out",
    });
    const yToCursor = gsap.quickTo(cursor, "y", {
      duration: 0.1,
      ease: "power2.out",
    });

    // Slower duration = Heavier, more "fluid" feel
    const xToFollower = gsap.quickTo(follower, "x", {
      duration: 0.5,
      ease: "power3.out",
    });
    const yToFollower = gsap.quickTo(follower, "y", {
      duration: 0.5,
      ease: "power3.out",
    });

    const moveCursor = (e: MouseEvent) => {
      xToCursor(e.clientX);
      yToCursor(e.clientY);
      xToFollower(e.clientX);
      yToFollower(e.clientY);
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  useEffect(() => {
    const follower = followerRef.current;
    const cursor = cursorRef.current;
    if (!follower || !cursor) return;

    if (cursorVariant === CursorVariant.VIEW && cursorImage) {
      // VIEW State: Scale up and fade slightly
      gsap.to(follower, {
        width: 250,
        height: 250,
        opacity: 0.8,
        backgroundColor: "transparent",
        borderWidth: 0,
        borderColor: "transparent",
        mixBlendMode: "normal",
        duration: 0.5,
        ease: "power2.out",
      });
      gsap.to(cursor, { opacity: 0, duration: 0.2 });
    } else if (cursorVariant === CursorVariant.BUTTON) {
      // BUTTON State - use primary color from theme
      const primaryColor = getCSSVar("--color-primary");
      gsap.to(follower, {
        width: 80,
        height: 80,
        opacity: 1,
        backgroundColor: primaryColor || "hsl(252 100% 58%)", // brand-purple fallback
        mixBlendMode: "exclusion",
        borderWidth: 0,
        borderColor: "transparent",
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(cursor, { opacity: 1, scale: 0 });
    } else {
      // DEFAULT State - use foreground color from theme
      const foregroundColor = getCSSVar("--color-foreground") || "hsl(0 0% 100%)";
      gsap.to(follower, {
        width: 16,
        height: 16,
        opacity: 1,
        backgroundColor: foregroundColor,
        mixBlendMode: "difference",
        borderWidth: 1,
        borderColor: foregroundColor,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(cursor, {
        opacity: 1,
        scale: 1,
        backgroundColor: foregroundColor,
        mixBlendMode: "difference",
      });
    }
  }, [cursorVariant, cursorImage]);

  return (
    <>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-cursor hidden h-2 w-2 rounded-full bg-white mix-blend-difference md:block"
      />
      <div
        ref={followerRef}
        className="pointer-events-none fixed top-0 left-0 z-cursor hidden h-4 w-4 items-center justify-center overflow-hidden rounded-full border border-white bg-white mix-blend-difference md:flex"
      >
        {cursorVariant === CursorVariant.VIEW && cursorImage && (
          <img
            src={cursorImage}
            alt="Cursor View"
            className="fade-in zoom-in h-full w-full animate-in object-cover duration-500"
          />
        )}
      </div>
    </>
  );
};

export default CustomCursor;
