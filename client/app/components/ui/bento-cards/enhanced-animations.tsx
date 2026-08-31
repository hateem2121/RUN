import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { ReactNode } from "react";
import { useRef } from "react";

interface AnimatedCardWrapperProps {
  children: ReactNode;
  className?: string | undefined;
  delay?: number | undefined;
  enableHover?: boolean | undefined;
}

export function AnimatedCardWrapper({
  children,
  className = "",
  delay = 0,
  enableHover = true,
}: AnimatedCardWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.6,
        delay,
        ease: "power2.out",
      });
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className={`${className}${enableHover ? " hover:scale-[1.02] hover:-translate-y-0.5" : ""} transition-transform duration-200 ease-out active:scale-[0.98]`}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </div>
  );
}

// Smooth loading state animation
/** @public */ export const LoadingSpinner = ({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.to(ref.current, {
        rotation: 360,
        duration: 1,
        repeat: -1,
        ease: "linear",
      });
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className={`inline-block rounded-full border-2 border-surface-muted border-t-luxury-gold ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
