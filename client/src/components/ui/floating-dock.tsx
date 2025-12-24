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
      className={cn("relative block md:hidden z-dock", className)}
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
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2 z-dock"
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
                    className="min-w-[140px] min-h-[44px]"
                  >
                    <a
                      href={item.href}
                      aria-label={item.title}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 w-full h-full",
                        // GPU acceleration and touch feedback
                        "transform-gpu active:scale-95 transition-transform duration-150",
                      )}
                    >
                      <div
                        className={`${
                          (item.iconSize || iconSize) === "small"
                            ? "h-4 w-4"
                            : (item.iconSize || iconSize) === "large"
                              ? "h-6 w-6"
                              : "h-5 w-5"
                        } relative z-10 shrink-0`}
                      >
                        {item.icon}
                      </div>

                      {/* Permanent title label for mobile navigation */}
                      <span className="text-sm text-foreground whitespace-nowrap relative z-10">
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
        className="h-12 w-12 rounded-full"
      >
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          className={cn(
            "flex h-full w-full items-center justify-center relative z-dock rounded-full",
            // GPU acceleration and touch feedback
            "transform-gpu active:scale-95 transition-transform duration-150",
          )}
        >
          <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-500 dark:text-neutral-400 relative z-10" />
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
      className={cn("mx-auto hidden items-center gap-3 px-16 py-6 md:flex z-dock", className)}
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        role="navigation"
        aria-label="Desktop navigation dock"
        className="flex items-center gap-3 w-full transform-gpu"
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
      className="flex flex-col items-center gap-2 min-h-[44px] group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl"
    >
      <motion.div
        ref={ref}
        style={{ width, height }}
        className="relative flex items-center justify-center rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] overflow-hidden transition-transform duration-150 group-active:scale-95"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none rounded-full" />

        {/* Inner glow */}
        <div className="absolute inset-[1px] rounded-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        {/* Hover shimmer */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-full">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer rounded-full" />
        </div>

        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center relative z-10"
        >
          {icon}
        </motion.div>
      </motion.div>

      {/* Permanent title label with improved contrast */}
      <div
        className="text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap max-w-[80px] md:max-w-[100px] truncate text-center drop-shadow-sm font-medium"
        style={{ textShadow: "0 1px 2px rgba(255, 255, 255, 0.5)" }} // Light mode glow for glass contrast
      >
        {title}
      </div>
    </a>
  );
}
