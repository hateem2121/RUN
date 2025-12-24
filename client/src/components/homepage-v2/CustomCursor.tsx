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
        backgroundColor: "#3300FF",
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
        backgroundColor: "#FFFFFF",
        mixBlendMode: "difference",
        borderWidth: 1,
        borderColor: "#FFFFFF",
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(cursor, {
        opacity: 1,
        scale: 1,
        backgroundColor: "#FFFFFF",
        mixBlendMode: "difference",
      });
    }
  }, [cursorVariant, cursorImage]);

  // Removed separate useEffect dependent on state to avoid re-renders

  return (
    <>
      <div
        ref={cursorRef}
        className="hidden md:block fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-modal mix-blend-difference"
      />
      <div
        ref={followerRef}
        className="hidden md:flex fixed top-0 left-0 w-4 h-4 border border-white rounded-full pointer-events-none z-modal overflow-hidden items-center justify-center bg-white mix-blend-difference"
      >
        {cursorVariant === CursorVariant.VIEW && cursorImage && (
          <img
            src={cursorImage}
            alt="Cursor View"
            className="w-full h-full object-cover animate-in fade-in zoom-in duration-500"
          />
        )}
      </div>
    </>
  );
};

export default CustomCursor;
