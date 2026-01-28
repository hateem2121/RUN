import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { type ComponentType, lazy, Suspense, useEffect, useState } from "react";

interface LazyLoadWrapperProps {
  // biome-ignore lint/suspicious/noExplicitAny: Generic component type
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  // biome-ignore lint/suspicious/noExplicitAny: Generic props pass-through
  props?: any;
}

export function LazyLoadWrapper({ component, fallback, props = {} }: LazyLoadWrapperProps) {
  const LazyComponent = lazy(component);

  const defaultFallback = (
    <div className="center-flex p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-8 w-8 text-muted-foreground/70" />
      </motion.div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Hook for responsive animation settings
export function useReducedMotion() {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // SSR Check happens safely inside effect (only runs on client)
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return matches;
}

// Mobile-optimized animation variants
export const mobileAnimationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
    // biome-ignore lint/suspicious/noExplicitAny: Generic error handler
    onError: (_error: any) => {
      // toast({ title: "Error", description: "Animation failed" });
      // biome-ignore lint/suspicious/noConsole: Error logging
      console.error("Animation error");
    },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 },
  },
};

// Performance-optimized motion component
export function OptimizedMotion({
  children,
  variant = "fadeIn",
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  variant?: keyof typeof mobileAnimationVariants;
  className?: string | undefined;
  delay?: number | undefined;
}) {
  const reducedMotion = useReducedMotion();
  const animationProps = mobileAnimationVariants[variant];

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={animationProps.initial}
      animate={animationProps.animate}
      // biome-ignore lint/suspicious/noExplicitAny: Framer Motion transition type
      transition={{ ...animationProps.transition, delay } as any}
    >
      {children}
    </motion.div>
  );
}
