import gsap from "gsap";
import React, { useEffect, useRef } from "react";

interface MagneticProps {
  children: React.ReactElement;
  strength?: number; // 0 to 1 ideally, default 0.35
}

const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.35 }) => {
  const magnetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Wait for ref to be populated
    if (!magnetRef.current) return;

    const magnet = magnetRef.current;

    // QuickTo provides better performance for mouse movement than standard .to()
    const xTo = gsap.quickTo(magnet, "x", {
      duration: 1,
      ease: "elastic.out(1, 0.3)",
    });
    const yTo = gsap.quickTo(magnet, "y", {
      duration: 1,
      ease: "elastic.out(1, 0.3)",
    });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = magnet.getBoundingClientRect();

      // Calculate distance from center
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);

      xTo(x * strength);
      yTo(y * strength);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    magnet.addEventListener("mousemove", handleMouseMove);
    magnet.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      magnet.removeEventListener("mousemove", handleMouseMove);
      magnet.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  // Clone the child to attach the ref directly to it
  // Cast children to ReactElement<any> to allow ref injection on generic elements
  return React.cloneElement(children as React.ReactElement<any>, {
    ref: magnetRef,
  });
};

export default Magnetic;
