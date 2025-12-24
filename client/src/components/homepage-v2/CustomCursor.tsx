import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { useStore } from "./store";
import { CursorVariant } from "./types";

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const cursorVariant = useStore((state) => state.cursorVariant);
  const cursorImage = useStore((state) => state.cursorImage);

  // Transient Mouse Movement - No Re-renders for position
  useGSAP(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    // Initialize for quickTo optimization safety
    gsap.set(cursor, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    gsap.set(follower, { xPercent: -50, yPercent: -50, x: 0, y: 0 });

    const xToCursor = gsap.quickTo(cursor, "x", {
      duration: 0.1,
      ease: "power2.out",
    });
    const yToCursor = gsap.quickTo(cursor, "y", {
      duration: 0.1,
      ease: "power2.out",
    });
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

  // Reactive Animations - Re-runs only when variant changes
  useGSAP(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    if (cursorVariant === CursorVariant.VIEW && cursorImage) {
      // VIEW State
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
      // BUTTON State
      gsap.to(follower, {
        width: 80,
        height: 80,
        opacity: 1,
        backgroundColor: "var(--color-brand-purple)",
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

  // Removed separate useEffect dependent on state to avoid re-renders

  return (
    <>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-modal hidden h-2 w-2 rounded-full bg-white mix-blend-difference md:block"
      />
      <div
        ref={followerRef}
        className="pointer-events-none fixed top-0 left-0 z-modal hidden h-4 w-4 items-center justify-center overflow-hidden rounded-full border border-white bg-white mix-blend-difference md:flex"
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
