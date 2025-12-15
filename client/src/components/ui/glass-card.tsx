import * as React from "react";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useMobileDetection } from "@/hooks/use-mobile-detection";

const blurIntensityMap = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-xs",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
  "2xl": "backdrop-blur-2xl",
};

const mobileBlurIntensityMap = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-[2px]",
  md: "backdrop-blur-xs",
  lg: "backdrop-blur-md",
  xl: "backdrop-blur-lg",
  "2xl": "backdrop-blur-xl",
};

const glowIntensityMap = {
  none: "",
  xs: "shadow-[0_0_10px_rgba(255,255,255,0.1)]",
  sm: "shadow-[0_0_15px_rgba(255,255,255,0.15)]",
  md: "shadow-[0_0_20px_rgba(255,255,255,0.2)]",
  lg: "shadow-[0_0_30px_rgba(255,255,255,0.25)]",
  xl: "shadow-[0_0_40px_rgba(255,255,255,0.3)]",
  "2xl": "shadow-[0_0_50px_rgba(255,255,255,0.35)]",
};

const mobileGlowIntensityMap = {
  none: "",
  xs: "shadow-[0_0_5px_rgba(255,255,255,0.08)]",
  sm: "shadow-[0_0_8px_rgba(255,255,255,0.1)]",
  md: "shadow-[0_0_12px_rgba(255,255,255,0.12)]",
  lg: "shadow-[0_0_15px_rgba(255,255,255,0.15)]",
  xl: "shadow-[0_0_20px_rgba(255,255,255,0.18)]",
  "2xl": "shadow-[0_0_25px_rgba(255,255,255,0.2)]",
};

const shadowIntensityMap = {
  none: "",
  xs: "shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]",
  sm: "shadow-[inset_0_2px_4px_rgba(255,255,255,0.15)]",
  md: "shadow-[inset_0_4px_6px_rgba(255,255,255,0.2)]",
  lg: "shadow-[inset_0_6px_8px_rgba(255,255,255,0.25)]",
  xl: "shadow-[inset_0_8px_12px_rgba(255,255,255,0.3)]",
  "2xl": "shadow-[inset_0_12px_16px_rgba(255,255,255,0.35)]",
};

const mobileShadowIntensityMap = {
  none: "",
  xs: "shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]",
  sm: "shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]",
  md: "shadow-[inset_0_2px_3px_rgba(255,255,255,0.12)]",
  lg: "shadow-[inset_0_3px_4px_rgba(255,255,255,0.15)]",
  xl: "shadow-[inset_0_4px_6px_rgba(255,255,255,0.18)]",
  "2xl": "shadow-[inset_0_6px_8px_rgba(255,255,255,0.2)]",
};

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

export interface LiquidGlassCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
> {
  children?: React.ReactNode;
  draggable?: boolean;
  expandable?: boolean;
  width?: string;
  height?: string;
  expandedWidth?: string;
  expandedHeight?: string;
  blurIntensity?: keyof typeof blurIntensityMap;
  borderRadius?: string;
  glowIntensity?: keyof typeof glowIntensityMap;
  shadowIntensity?: keyof typeof shadowIntensityMap;
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
  const { isMobile } = useMobileDetection();
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
          "relative overflow-hidden border border-gray-800/60 dark:border-gray-900/70 cursor-pointer group inline-block",
          "bg-white/10 dark:bg-white/5",
          // Use default/desktop intensities for stable initial render
          blurIntensityMap[blurIntensity],
          glowIntensityMap[glowIntensity],
          shadowIntensityMap[shadowIntensity],
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
          className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none"
          style={{ borderRadius }}
        />
        <div className="relative z-10 h-full">{children}</div>
      </div>
    );
  }

  const blurClass = isMobile
    ? mobileBlurIntensityMap[blurIntensity]
    : blurIntensityMap[blurIntensity];

  const glowClass = isMobile
    ? mobileGlowIntensityMap[glowIntensity]
    : glowIntensityMap[glowIntensity];

  const shadowClass = isMobile
    ? mobileShadowIntensityMap[shadowIntensity]
    : shadowIntensityMap[shadowIntensity];

  return (
    <motion.div
      ref={ref}
      drag={shouldEnableDrag}
      dragConstraints={shouldEnableDrag ? dragConstraints : undefined}
      dragElastic={shouldEnableDrag ? 0.1 : undefined}
      dragTransition={shouldEnableDrag ? { bounceStiffness: 600, bounceDamping: 20 } : undefined}
      onDragEnd={shouldEnableDrag ? handleDragEnd : undefined}
      style={{
        x: shouldEnableDrag ? x : undefined,
        y: shouldEnableDrag ? y : undefined,
        rotateX: shouldEnableDrag ? rotateX : undefined,
        rotateY: shouldEnableDrag ? rotateY : undefined,
        borderRadius,
        width: currentWidth,
        height: currentHeight,
        perspective: shouldEnableDrag ? "1000px" : undefined,
        transformStyle: shouldEnableDrag ? "preserve-3d" : undefined,
        ...style,
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
        "relative overflow-hidden border border-gray-800/60 dark:border-gray-900/70 cursor-pointer group inline-block",
        "bg-white/10 dark:bg-white/5",
        blurClass,
        glowClass,
        shadowClass,
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
        className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none"
        style={{ borderRadius }}
      />

      <div
        className="absolute inset-[1px] rounded-[calc(var(--radius)-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
        style={{ borderRadius: `calc(${borderRadius} - 1px)` }}
      />

      <div className="relative z-10 h-full">{children}</div>

      {!isMobile && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ borderRadius }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      )}
    </motion.div>
  );
};

LiquidGlassCard.displayName = "LiquidGlassCard";

const liquidbuttonVariants = cva(
  "inline-flex items-center justify-center cursor-pointer gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 outline-hidden focus-visible:ring-2 focus-visible:ring-white/50",
  {
    variants: {
      variant: {
        default:
          "bg-white/10 backdrop-blur-md border border-gray-800/60 dark:border-gray-900/70 text-white hover:bg-white/20 hover:scale-105 active:scale-95",
        glass:
          "bg-white/5 backdrop-blur-lg border border-gray-800/50 dark:border-gray-900/60 text-white hover:bg-white/15 active:bg-white/20",
        solid: "bg-primary text-white hover:bg-primary/90 active:bg-primary/80",
        ghost: "hover:bg-white/10 text-white active:bg-white/15",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 text-xs gap-1.5 px-3",
        lg: "h-10 px-6",
        xl: "h-12 px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "lg",
    },
  },
);

interface LiquidButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof liquidbuttonVariants> {
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

const LiquidButton = ({
  className,
  variant,
  size,
  asChild = false,
  children,
  ref,
  ...props
}: LiquidButtonProps) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp className={cn(liquidbuttonVariants({ variant, size, className }))} ref={ref} {...props}>
      {children}
    </Comp>
  );
};

LiquidButton.displayName = "LiquidButton";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

function CardHeader({ title, subtitle, icon, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div className="space-y-1.5">
        <h3
          className="font-semibold leading-none tracking-tight text-white"
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
  subtitle?: string;
  className?: string;
}

export const LiquidGlassTitle = React.memo(function LiquidGlassTitle({
  title,
  subtitle,
  className,
}: LiquidGlassTitleProps) {
  return (
    <LiquidGlassCard
      blurIntensity="xl"
      glowIntensity="lg"
      shadowIntensity="md"
      borderRadius="24px"
      className={cn("px-4 py-4 sm:px-8 sm:py-6", className)}
    >
      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-center font-neue-stance text-white"
        data-testid="title-text"
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="mt-3 sm:mt-4 max-w-3xl text-[15px] sm:text-[17px] text-center font-thin text-white/80"
          data-testid="subtitle-text"
        >
          {subtitle}
        </p>
      )}
    </LiquidGlassCard>
  );
});

export const liquidGlassStyles = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 3s infinite;
}

.perspective-1000 {
  perspective: 1000px;
}
`;

export { LiquidGlassCard, LiquidButton, CardHeader, CardContent };
