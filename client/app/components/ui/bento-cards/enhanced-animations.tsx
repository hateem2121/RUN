import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { ReactNode } from "react";
import { useRef } from "react";

type Variants = Record<string, Record<string, unknown>>;

// Enhanced animation variants for bento cards
export const cardVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      duration: 0.2,
      ease: "easeOut",
      scale: {
        type: "spring",
        damping: 20,
        stiffness: 100,
      },
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
} as unknown as Variants;

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const fadeInUp = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export const scaleIn = {
  initial: {
    scale: 0.8,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

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
export const LoadingSpinner = ({
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

// Smooth image loading animation
export const ImageLoadAnimation = {
  initial: { opacity: 0, scale: 1.1 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Modal animation variants
export const modalVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Backdrop animation
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
