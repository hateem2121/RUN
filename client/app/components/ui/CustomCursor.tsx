import gsap from "gsap";
import type React from "react";
import { useEffect, useRef } from "react";
import { useCursorStore } from "../../stores/useCursorStore";

/**
 * CustomCursor - Dual-layer cursor with states (DEFAULT, BUTTON, VIEW)
 * Provides a premium interactive feel with GSAP-powered smooth following.
 * Hidden on mobile/touch devices.
 */
const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const { cursorVariant, cursorImage } = useCursorStore();

  useEffect(() => {
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

    if (cursorVariant === "view" && cursorImage) {
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
    } else if (cursorVariant === "button") {
      // BUTTON State
      gsap.to(follower, {
        width: 80,
        height: 80,
        opacity: 1,
        backgroundColor: "var(--color-primary)",
        mixBlendMode: "exclusion",
        borderWidth: 0,
        borderColor: "transparent",
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(cursor, { opacity: 1, scale: 0 });
    } else {
      // DEFAULT State
      gsap.to(follower, {
        width: 16,
        height: 16,
        opacity: 1,
        backgroundColor: "#fff",
        mixBlendMode: "difference",
        borderWidth: 1,
        borderColor: "#fff",
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(cursor, {
        opacity: 1,
        scale: 1,
        backgroundColor: "#fff",
        mixBlendMode: "difference",
      });
    }
  }, [cursorVariant, cursorImage]);

  return (
    <>
      <div ref={cursorRef} className="h-2 w-2 cursor-dot" />
      <div ref={followerRef} className="h-4 w-4 cursor-follower">
        {cursorVariant === "view" && cursorImage && (
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
