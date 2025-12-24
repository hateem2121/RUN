import { type MotionProps, motion } from "framer-motion";
import type { ReactNode } from "react";

interface SmoothTransitionProps extends MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: "fade" | "slide" | "scale" | "luxury";
}

export function SmoothTransition({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  variant = "luxury",
  ...motionProps
}: SmoothTransitionProps) {
  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    slide: {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0 },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1 },
    },
    luxury: {
      hidden: {
        opacity: 0,
        y: 40,
        scale: 0.95,
        filter: "blur(4px)",
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
          duration,
          delay,
          ease: [0.25, 0.1, 0.25, 1],
        },
      },
    },
  };

  return (
    <motion.div
      variants={variants[variant]}
      initial="hidden"
      animate="visible"
      className={`${className} smooth-entrance`}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  intensity?: "subtle" | "normal" | "strong";
  duration?: number;
}

export function FloatingElement({
  children,
  className = "",
  intensity = "normal",
  duration = 6,
}: FloatingElementProps) {
  const intensityMap = {
    subtle: { y: [-2, 2, -2], rotate: [-0.5, 0.5, -0.5] },
    normal: { y: [-5, 5, -5], rotate: [-1, 1, -1] },
    strong: { y: [-10, 10, -10], rotate: [-2, 2, -2] },
  };

  const movement = intensityMap[intensity];

  return (
    <motion.div
      animate={movement}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`${className} floating-element`}
    >
      {children}
    </motion.div>
  );
}

interface GlassEffectProps {
  children: ReactNode;
  className?: string;
  variant?: "light" | "card" | "elevated";
  interactive?: boolean;
}

export function GlassEffect({
  children,
  className = "",
  variant = "card",
  interactive = true,
}: GlassEffectProps) {
  const baseClasses = {
    light: "glass-light",
    card: "glass-card-light",
    elevated: "glass-card-light shadow-sm-luxury-elevated",
  };

  const interactiveClasses = interactive ? "interactive-light" : "";

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.02, y: -2 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      className={`${baseClasses[variant]} ${interactiveClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface LuxuryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

export function LuxuryButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
}: LuxuryButtonProps) {
  const sizeClasses = {
    sm: "px-6 py-2 text-sm",
    md: "px-8 py-4 text-base",
    lg: "px-12 py-6 text-lg",
  };

  const variantClasses = {
    primary: "glass-card-light border-luxury-light luxury-text-light font-medium",
    secondary: "glass-light luxury-text-light font-normal",
    ghost: "luxury-text-light font-light hover:glass-light",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} 
        ${variantClasses[variant]} interactive-light rounded-full transition-all duration-300 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}
