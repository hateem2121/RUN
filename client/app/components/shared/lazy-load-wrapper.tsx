import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Loader2 } from "lucide-react";
import { type ComponentType, lazy, Suspense, useEffect, useRef, useState } from "react";

interface LazyLoadWrapperProps {
  component: () => Promise<{ default: ComponentType<Record<string, unknown>> }>;
  fallback?: React.ReactNode;
  props?: Record<string, unknown>;
}

export function LazyLoadWrapper({ component, fallback, props = {} }: LazyLoadWrapperProps) {
  const LazyComponent = lazy(component);

  const defaultFallback = (
    <div className="center-flex p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
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
    if (typeof window === "undefined") {
      return;
    }

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
    onError: (_error: unknown) => {
      // toast({ title: "Error", description: "Animation failed" });
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

const gsapVariantMap: Record<
  keyof typeof mobileAnimationVariants,
  { opacity?: number; y?: number; scale?: number; duration: number; delay?: number }
> = {
  fadeIn: { opacity: 0, duration: 0.3 },
  slideUp: { opacity: 0, y: 20, duration: 0.3 },
  scale: { opacity: 0, scale: 0.95, duration: 0.2 },
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
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reducedMotion || !ref.current) {
        return;
      }
      const { duration, ...fromVars } = gsapVariantMap[variant];
      gsap.from(ref.current, { ...fromVars, duration, delay });
    },
    { scope: ref, dependencies: [variant, delay, reducedMotion] },
  );

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
