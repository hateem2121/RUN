import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import React, { useRef } from "react";

interface MagneticProps {
  children: React.ReactElement;
  strength?: number | undefined; // 0 to 1 ideally, default 0.35
}

/**
 * Magnetic - Wraps interactive elements to create elastic attraction effect
 * Uses GSAP quickTo for high-performance mouse tracking.
 */
export const Magnetic: React.FC<MagneticProps> = ({ children, strength = 0.35 }) => {
  const magnetRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!magnetRef.current) {
        return;
      }

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

      let rect: DOMRect | null = null;

      const handleMouseEnter = () => {
        rect = magnet.getBoundingClientRect();
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!rect) {
          rect = magnet.getBoundingClientRect();
        }
        const { clientX, clientY } = e;
        // Calculate distance from center
        const x = clientX - (rect.left + rect.width / 2);
        const y = clientY - (rect.top + rect.height / 2);

        xTo(x * strength);
        yTo(y * strength);
      };

      const handleMouseLeave = () => {
        rect = null;
        xTo(0);
        yTo(0);
      };

      magnet.addEventListener("mouseenter", handleMouseEnter);
      magnet.addEventListener("mousemove", handleMouseMove);
      magnet.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        magnet.removeEventListener("mouseenter", handleMouseEnter);
        magnet.removeEventListener("mousemove", handleMouseMove);
        magnet.removeEventListener("mouseleave", handleMouseLeave);
      };
    },
    { dependencies: [strength] },
  );

  // Clone the child to attach both magnetRef and the child's own ref
  return React.cloneElement(children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>, {
    ref: (node: HTMLElement | null) => {
      (magnetRef as React.MutableRefObject<HTMLElement | null>).current = node;
      // biome-ignore lint/suspicious/noExplicitAny: Child ref propagation for React 19
      const childRef = (children.props as any)?.ref ?? (children as any).ref;
      if (typeof childRef === "function") {
        childRef(node);
      } else if (childRef && typeof childRef === "object" && "current" in childRef) {
        childRef.current = node;
      }
    },
  });
};
