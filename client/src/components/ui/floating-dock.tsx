import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";
import { LiquidGlassCard } from "@/components/ui/glass-card";
import { IconWrapper } from "@/components/ui/icon-wrapper";
import { cn } from "@/lib/utils";

// Maximum stagger delay to prevent sluggish animations on long lists
const MAX_STAGGER_DELAY = 0.15; // seconds

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
  iconSize = "medium",
  disableMobile = false,
}: {
  items: {
    id?: number | string;
    title: string;
    icon: React.ReactNode;
    href: string;
    iconSize?: string;
  }[];
  desktopClassName?: string;
  mobileClassName?: string;
  iconSize?: "small" | "medium" | "large";
  disableMobile?: boolean;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} iconSize={iconSize} />
      {!disableMobile && (
        <FloatingDockMobile items={items} className={mobileClassName} iconSize={iconSize} />
      )}
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
  iconSize = "medium",
}: {
  items: {
    id?: number | string;
    title: string;
    icon: React.ReactNode;
    href: string;
    iconSize?: string;
  }[];
  className?: string;
  iconSize?: "small" | "medium" | "large";
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn("relative z-dock block md:hidden", className)}
      role="navigation"
      aria-label="Mobile navigation dock"
      style={{
        // Safe area support for notched devices
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full z-dock mb-2 flex flex-col gap-2"
            role="menu"
          >
            {items.map((item, idx) => {
              // Cap stagger delay to prevent sluggish animations on long lists
              const exitDelay = Math.min(idx * 0.05, MAX_STAGGER_DELAY);
              const enterDelay = Math.min((items.length - 1 - idx) * 0.05, MAX_STAGGER_DELAY);

              return (
                <motion.div
                  key={item.id || item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    transition: {
                      delay: exitDelay,
                    },
                  }}
                  transition={{
                    delay: enterDelay,
                    duration: 0.2,
                  }}
                  role="menuitem"
                >
                  <LiquidGlassCard
                    blurIntensity="md"
                    glowIntensity="sm"
                    shadowIntensity="md"
                    className="min-h-11 min-w-[140px]"
                  >
                    <a
                      href={item.href}
                      aria-label={item.title}
                      className={cn(
                        "flex h-full w-full items-center gap-3 px-4 py-2",
                        // GPU acceleration and touch feedback
                        "transform-gpu transition-transform duration-150 active:scale-95",
                      )}
                    >
                      <IconWrapper
                        size={
                          (item.iconSize || iconSize) === "small"
                            ? "sm"
                            : (item.iconSize || iconSize) === "large"
                              ? "lg"
                              : "md"
                        }
                        className="relative z-elevated"
                        asChild
                      >
                        {item.icon}
                      </IconWrapper>

                      {/* Permanent title label for mobile navigation */}
                      <span className="relative z-elevated whitespace-nowrap text-foreground text-sm">
                        {item.title}
                      </span>
                    </a>
                  </LiquidGlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <LiquidGlassCard
        blurIntensity="md"
        glowIntensity="sm"
        shadowIntensity="md"
        className="h-10 w-10 rounded-full"
      >
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          className={cn(
            "relative z-dock flex h-full w-full items-center justify-center rounded-full",
            // GPU acceleration and touch feedback
            "transform-gpu transition-transform duration-150 active:scale-95",
          )}
        >
          <IconWrapper
            size="md"
            className="relative z-elevated text-neutral-500 dark:text-neutral-400"
            asChild
          >
            <IconLayoutNavbarCollapse />
          </IconWrapper>
        </button>
      </LiquidGlassCard>
    </div>
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
    iconSize?: string;
  }[];
  className?: string;
  iconSize?: "small" | "medium" | "large";
}) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <LiquidGlassCard
      blurIntensity="lg"
      glowIntensity="md"
      shadowIntensity="lg"
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
    </LiquidGlassCard>
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
  iconSize?: string;
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
        className="center-flex relative overflow-hidden rounded-full border border-gray-800/60 bg-white/10 shadow-glow-lg backdrop-blur-md transition-transform duration-150 group-active:scale-95 dark:border-gray-900/70 dark:bg-white/5"
      >
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-black/10" />

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
      <div
        className="max-w-20 truncate whitespace-nowrap text-center font-medium text-gray-800 text-xs drop-shadow-sm md:max-w-24 dark:text-gray-200"
        style={{ textShadow: "0 1px 2px rgba(255, 255, 255, 0.5)" }} // Light mode glow for glass contrast
      >
        {title}
      </div>
    </a>
  );
}
