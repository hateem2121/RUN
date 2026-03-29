import { useGSAP } from "@gsap/react";
import type { MediaAsset } from "@shared/index";
import gsap from "gsap";
import { useRef } from "react";

import { cn } from "@/lib/utils";

interface MediaTransitionProps {
  media: MediaAsset;
  isActive: boolean;
  direction: 1 | -1;
  className?: string | undefined;
  children: React.ReactNode;
}

// Transition configurations for different media types (GSAP equivalents)
const transitionConfig = {
  image: {
    enter: (direction: number) => ({ opacity: 0, x: direction * 100, scale: 0.9 }),
    enterTo: { opacity: 1, x: 0, scale: 1, duration: 0.3, ease: "power2.out" },
  },
  video: {
    enter: (direction: number) => ({ opacity: 0, y: direction * 50, scale: 0.95 }),
    enterTo: {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: "power2.inOut",
    },
  },
  "3d_model": {
    enter: () => ({ opacity: 0, scale: 0.8, rotationY: 180 }),
    enterTo: {
      opacity: 1,
      scale: 1,
      rotationY: 0,
      duration: 0.5,
      ease: "power2.inOut",
    },
  },
};

export function MediaTransition({
  media,
  isActive,
  direction,
  className,
  children,
}: MediaTransitionProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mediaType = media.type || "image";
  const config =
    transitionConfig[mediaType as keyof typeof transitionConfig] || transitionConfig.image;

  useGSAP(() => {
    if (!wrapperRef.current || !isActive) return;
    const from = config.enter(direction);
    gsap.fromTo(wrapperRef.current, from, config.enterTo);
  }, [isActive, direction]);

  if (!isActive) return null;

  return (
    <div
      ref={wrapperRef}
      className={cn("absolute inset-0", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
