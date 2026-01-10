/**
 * @deprecated Use @/components/ui/card with variant="glass-premium" instead.
 * This component remains for backward compatibility but should not be used in new code.
 */
import type { VariantProps } from "class-variance-authority";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type * as React from "react";
import { useEffect, useState } from "react";

import { cardVariants } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Re-export cardVariants for compatibility if needed, distinct alias
export const glassCardVariants = cardVariants;

function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const hasTouchPoints = navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasCoarsePointer || hasTouchPoints);
    };

    checkTouchDevice();

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const handleChange = () => checkTouchDevice();

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isTouchDevice;
}

function useDragConstraints() {
  const [constraints, setConstraints] = useState({
    top: -200,
    left: -200,
    right: 200,
    bottom: 200,
  });

  useEffect(() => {
    const updateConstraints = () => {
      const maxOffset = Math.min(window.innerWidth, window.innerHeight) * 0.2;
      setConstraints({
        top: -maxOffset,
        left: -maxOffset,
        right: maxOffset,
        bottom: maxOffset,
      });
    };

    updateConstraints();
    window.addEventListener("resize", updateConstraints);
    return () => window.removeEventListener("resize", updateConstraints);
  }, []);

  return constraints;
}

export interface LiquidGlassCardProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
  > {
  children?: React.ReactNode;
  draggable?: boolean | undefined;
  expandable?: boolean | undefined;
  width?: string | undefined;
  height?: string | undefined;
  expandedWidth?: string | undefined;
  expandedHeight?: string | undefined;
  // Deprecated props - keeping for temporary compat if needed, but effectively unused by new system
  blurIntensity?: string | undefined;
  borderRadius?: string | undefined;
  glowIntensity?: string | undefined;
  shadowIntensity?: string | undefined;
  ref?: React.Ref<HTMLDivElement>;
}

const LiquidGlassCard = ({
  children,
  className,
  draggable: isDraggable = false,
  expandable = false,
  width,
  height,
  expandedWidth,
  expandedHeight,
  blurIntensity = "md",
  borderRadius = "24px",
  glowIntensity = "sm",
  shadowIntensity = "md",
  style,
  onClick,
  ref,
  ...restProps
}: LiquidGlassCardProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isExpanded, setIsExpanded] = useState(false);
  const isTouchDevice = useIsTouchDevice();
  const dragConstraints = useDragConstraints();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const shouldEnableDrag = isDraggable && !isTouchDevice;

  const handleDragEnd = (_event: any, info: any) => {
    const threshold = 50;
    if (Math.abs(info.offset.x) < threshold && Math.abs(info.offset.y) < threshold) {
      x.set(0);
      y.set(0);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
    onClick?.(e);
  };

  const currentWidth = isExpanded ? expandedWidth || width || "auto" : width || "auto";
  const currentHeight = isExpanded ? expandedHeight || height || "auto" : height || "auto";

  // Deterministic Server/Initial Client Render
  if (!mounted) {
    return (
      <div
        ref={ref}
        className={cn(
          // Update LiquidGlassCard rendering
          cardVariants({
            variant: "glass-premium",
            interactive: true,
          }),
          "inline-block", // Maintain inline-block for LiquidGlassCard
          className,
        )}
        style={{
          borderRadius,
          width: width || "auto",
          height: height || "auto",
          ...style,
        }}
        {...restProps}
      >
        {/* Static gradient background matching main render */}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/10"
          style={{ borderRadius }}
        />
        <div className="relative z-elevated h-full">{children}</div>
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      drag={shouldEnableDrag}
      {...(shouldEnableDrag ? { dragConstraints } : {})}
      {...(shouldEnableDrag ? { dragElastic: 0.1 } : {})}
      {...(shouldEnableDrag ? { dragTransition: { bounceStiffness: 600, bounceDamping: 20 } } : {})}
      {...(shouldEnableDrag ? { onDragEnd: handleDragEnd } : {})}
      style={{
        ...(shouldEnableDrag ? { x } : {}),
        ...(shouldEnableDrag ? { y } : {}),
        ...(shouldEnableDrag ? { rotateX } : {}),
        ...(shouldEnableDrag ? { rotateY } : {}),
        borderRadius,
        width: currentWidth,
        height: currentHeight,
        ...(shouldEnableDrag ? { perspective: "1000px" } : {}),
        ...(shouldEnableDrag ? { transformStyle: "preserve-3d" } : {}),
        ...(style as any),
      }}
      animate={{
        width: currentWidth,
        height: currentHeight,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      onClick={handleClick}
      className={cn(
        cardVariants({
          variant: "glass-premium",
          interactive: true,
        }),
        "inline-block",
        expandable && "transition-all duration-300",
        shouldEnableDrag && "cursor-move active:cursor-grabbing",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/30",
        className,
      )}
      tabIndex={onClick || expandable ? 0 : undefined}
      role={onClick || expandable ? "button" : undefined}
      data-testid="liquid-glass-card"
      {...restProps}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/10"
        style={{ borderRadius }}
      />

      <div
        className="card-border-overlay rounded-[calc(var(--radius)-1px)]"
        style={{ borderRadius: `calc(${borderRadius} - 1px)` }}
      />

      <div className="relative z-elevated h-full">{children}</div>

      <div
        className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block"
        style={{ borderRadius }}
      >
        <div className="shimmer-overlay z-elevated" />
      </div>
    </motion.div>
  );
};

LiquidGlassCard.displayName = "LiquidGlassCard";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string | undefined;
  icon?: React.ReactNode;
}

function CardHeader({ title, subtitle, icon, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div className="space-y-1.5">
        <h3
          className="font-semibold text-white leading-none tracking-tight"
          data-testid="card-title"
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-white/70" data-testid="card-subtitle">
            {subtitle}
          </p>
        )}
      </div>
      {icon && <div className="text-white/50">{icon}</div>}
    </div>
  );
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-6", className)} {...props} />;
}

interface LiquidGlassTitleProps {
  title: string;
  subtitle?: string | undefined;
  className?: string | undefined;
}

export const LiquidGlassTitle = function LiquidGlassTitle({
  title,
  subtitle,
  className,
}: LiquidGlassTitleProps) {
  return (
    <LiquidGlassCard borderRadius="24px" className={cn("px-4 py-4 sm:px-8 sm:py-6", className)}>
      <h2
        className="text-center font-bold font-neue-stance text-3xl text-white sm:text-4xl md:text-5xl"
        data-testid="title-text"
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="mt-3 max-w-3xl text-center font-thin text-sm text-white/80 sm:mt-4 sm:text-base"
          data-testid="subtitle-text"
        >
          {subtitle}
        </p>
      )}
    </LiquidGlassCard>
  );
};

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export const GlassCard = ({
  className,
  interactive,
  ref,
  ...props
}: GlassCardProps & { ref?: React.Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant: "glass-premium", interactive }), className)}
    {...props}
  />
);
GlassCard.displayName = "GlassCard";

export const GlassCardDecorations = ({ showShimmer = true }: { showShimmer?: boolean }) => (
  <>
    {/* Gradient overlay */}
    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/10" />
    {/* Inner glow */}
    <div className="card-border-overlay rounded-[calc(0.75rem-1px)]" />
    {/* Hover shimmer */}
    {showShimmer && (
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="shimmer-overlay" />
      </div>
    )}
  </>
);
GlassCardDecorations.displayName = "GlassCardDecorations";

export { LiquidGlassCard, CardHeader, CardContent };
