import {
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName: _mobileClassName,
  iconSize = "medium",
  disableMobile: _disableMobile,
}: {
  items: {
    id?: number | string;
    title: string;
    icon: React.ReactNode;
    href: string;
    iconSize?: string | undefined;
  }[];
  desktopClassName?: string | undefined;
  mobileClassName?: string | undefined;
  iconSize?: "small" | "medium" | "large";
  disableMobile?: boolean | undefined;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} iconSize={iconSize} />
    </>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
  iconSize = "medium",
}: {
  items: {
    id?: number | string;
    title: string;
    icon: React.ReactNode;
    href: string;
    iconSize?: string | undefined;
  }[];
  className?: string | undefined;
  iconSize?: "small" | "medium" | "large";
}) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <Card
      variant="glass-premium"
      className={cn("z-dock mx-auto hidden items-center gap-3 px-16 py-6 md:flex", className)}
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        role="navigation"
        aria-label="Desktop navigation dock"
        className="isolate flex w-full transform-gpu items-center gap-3"
      >
        {items.map((item) => (
          <IconContainer
            mouseX={mouseX}
            key={item.id || item.title}
            {...item}
            iconSize={item.iconSize || iconSize}
          />
        ))}
      </motion.div>
    </Card>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  iconSize = "medium",
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
  iconSize?: string | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  // Dynamic size values based on iconSize
  const sizeMap = {
    small: { base: 32, hover: 64, icon: 16, iconHover: 32 },
    medium: { base: 44, hover: 80, icon: 24, iconHover: 40 }, // Updated to meet 44px min touch target
    large: { base: 48, hover: 96, icon: 24, iconHover: 48 },
  };

  const sizes = sizeMap[iconSize as keyof typeof sizeMap] || sizeMap.medium;

  const widthTransform = useTransform(
    distance,
    [-150, 0, 150],
    [sizes.base, sizes.hover, sizes.base],
  );
  const heightTransform = useTransform(
    distance,
    [-150, 0, 150],
    [sizes.base, sizes.hover, sizes.base],
  );

  const widthTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [sizes.icon, sizes.iconHover, sizes.icon],
  );
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [sizes.icon, sizes.iconHover, sizes.icon],
  );

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: shouldReduceMotion ? 20 : 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: shouldReduceMotion ? 20 : 12,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: shouldReduceMotion ? 20 : 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: shouldReduceMotion ? 20 : 12,
  });

  return (
    <a
      href={href}
      aria-label={title}
      className="group flex min-h-11 flex-col items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <motion.div
        ref={ref}
        style={{ width, height }}
        className="center-flex relative overflow-hidden rounded-full border border-border/60 bg-white/10 shadow-glow-lg backdrop-blur-md transition-transform duration-150 group-active:scale-95 dark:border-border/70 dark:bg-white/5"
      >
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-br from-white/10 via-transparent to-black/10" />

        {/* Inner glow */}
        <div className="card-border-overlay rounded-full" />

        {/* Hover shimmer */}
        <div className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="shimmer-overlay rounded-full" />
        </div>

        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="center-flex relative z-elevated"
        >
          {icon}
        </motion.div>
      </motion.div>

      {/* Permanent title label with improved contrast */}
      <div className="max-w-20 truncate whitespace-nowrap text-center font-medium text-foreground text-xs drop-shadow-sm md:max-w-24">
        {title}
      </div>
    </a>
  );
}
