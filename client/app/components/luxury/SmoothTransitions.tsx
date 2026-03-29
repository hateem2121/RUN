import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type * as React from "react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SmoothTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string | undefined;
  delay?: number | undefined;
  duration?: number | undefined;
  variant?: "fade" | "slide" | "scale" | "luxury";
}

export function SmoothTransition({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  variant = "luxury",
  ...divProps
}: SmoothTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const fromVars: gsap.TweenVars = (() => {
    switch (variant) {
      case "fade":
        return { opacity: 0 };
      case "slide":
        return { opacity: 0, y: 30 };
      case "scale":
        return { opacity: 0, scale: 0.8 };
      default:
        return { opacity: 0, y: 40, scale: 0.95, filter: "blur(4px)" };
    }
  })();

  useGSAP(
    () => {
      gsap.from(containerRef.current, {
        ...fromVars,
        duration,
        delay,
        ease: "power2.out",
        clearProps: "filter",
      });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className={`${className} smooth-entrance`} {...divProps}>
      {children}
    </div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string | undefined;
  staggerDelay?: number | undefined;
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;
      const childEls = Array.from(el.children) as HTMLElement[];
      gsap.from(childEls, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.2,
        stagger: staggerDelay,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [staggerDelay] },
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  className?: string | undefined;
  intensity?: "subtle" | "normal" | "strong";
  duration?: number | undefined;
}

export function FloatingElement({
  children,
  className = "",
  intensity = "normal",
  duration = 6,
}: FloatingElementProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const intensityMap: Record<"subtle" | "normal" | "strong", { y: number; rotation: number }> = {
    subtle: { y: 2, rotation: 0.5 },
    normal: { y: 5, rotation: 1 },
    strong: { y: 10, rotation: 2 },
  };

  const { y, rotation } = intensityMap[intensity];

  useGSAP(
    () => {
      gsap.to(containerRef.current, {
        y: -y,
        rotation,
        duration,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: containerRef, dependencies: [y, rotation, duration] },
  );

  return (
    <div ref={containerRef} className={`${className} floating-element`}>
      {children}
    </div>
  );
}

interface GlassEffectProps {
  children: ReactNode;
  className?: string | undefined;
  variant?: "light" | "card" | "elevated";
  interactive?: boolean | undefined;
}

export function GlassEffect({
  children,
  className = "",
  variant = "card",
  interactive = true,
}: GlassEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const baseClasses = {
    light: cardVariants({ variant: "glass-subtle" }),
    card: cardVariants({ variant: "glass-premium" }),
    elevated: cn(cardVariants({ variant: "glass-premium" }), "shadow-sm-luxury-elevated"),
  };

  useGSAP(
    () => {
      if (!interactive || !containerRef.current) return;
      const el = containerRef.current;

      const onEnter = (): void => {
        gsap.to(el, { scale: 1.02, y: -2, duration: 0.2, ease: "power2.out" });
      };
      const onLeave = (): void => {
        gsap.to(el, { scale: 1, y: 0, duration: 0.2, ease: "power2.out" });
      };
      const onDown = (): void => {
        gsap.to(el, { scale: 0.98, duration: 0.1, ease: "power2.out" });
      };
      const onUp = (): void => {
        gsap.to(el, { scale: 1.02, duration: 0.1, ease: "power2.out" });
      };

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("mousedown", onDown);
      el.addEventListener("mouseup", onUp);

      return () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("mousedown", onDown);
        el.removeEventListener("mouseup", onUp);
      };
    },
    { scope: containerRef, dependencies: [interactive] },
  );

  return (
    <div ref={containerRef} className={`${baseClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

interface LuxuryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string | undefined;
  disabled?: boolean | undefined;
}

export function LuxuryButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
}: LuxuryButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const sizeClasses = {
    sm: "px-6 py-2 text-sm",
    md: "px-8 py-4 text-base",
    lg: "px-12 py-6 text-lg",
  };

  const variantClasses = {
    primary: cn(
      cardVariants({ variant: "glass-premium" }),
      "luxury-text-light border-luxury-light font-medium",
    ),
    secondary: cn(cardVariants({ variant: "glass-subtle" }), "luxury-text-light font-normal"),
    ghost: "luxury-text-light font-light hover:bg-white/10",
  };

  useGSAP(
    () => {
      if (disabled || !btnRef.current) return;
      const el = btnRef.current;

      const onEnter = (): void => {
        gsap.to(el, { scale: 1.05, y: -2, duration: 0.2, ease: "power2.out" });
      };
      const onLeave = (): void => {
        gsap.to(el, { scale: 1, y: 0, duration: 0.2, ease: "power2.out" });
      };
      const onDown = (): void => {
        gsap.to(el, { scale: 0.95, duration: 0.1, ease: "power2.out" });
      };
      const onUp = (): void => {
        gsap.to(el, { scale: 1.05, duration: 0.1, ease: "power2.out" });
      };

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("mousedown", onDown);
      el.addEventListener("mouseup", onUp);

      return () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("mousedown", onDown);
        el.removeEventListener("mouseup", onUp);
      };
    },
    { scope: btnRef, dependencies: [disabled] },
  );

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      disabled={disabled}
      className={` ${sizeClasses[size]} ${variantClasses[variant]} rounded-full transition-all duration-300 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${className} `}
    >
      {children}
    </button>
  );
}
