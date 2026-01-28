import type { AnimationItem } from "lottie-web";
import lottie from "lottie-web/build/player/lottie_light";
import { useEffect, useRef } from "react";

interface LottieIconProps {
  // biome-ignore lint/suspicious/noExplicitAny: Lottie animation data
  animationData: any;
  size: number;
  type: "client" | "facility";
}

export function LottieIcon({ animationData, size, type }: LottieIconProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current || !animationData) return;

    // Clean up previous animation
    if (animationRef.current) {
      animationRef.current.destroy();
    }

    try {
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
        },
      });
    } catch (_error) {}

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, [animationData]);

  // Use HSL values matching --color-status-info and --color-status-success tokens
  const fallbackColor = type === "client" ? "hsl(217 91% 60%)" : "hsl(142 76% 40%)";
  const fallbackShadow = type === "client" ? "hsl(217 91% 60% / 0.6)" : "hsl(142 76% 40% / 0.6)";

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
      className="relative"
    >
      {/* Fallback content if Lottie fails */}
      <div
        className="absolute inset-0 animate-pulse rounded-full border-2 border-white"
        style={{
          background: `radial-gradient(circle, ${fallbackColor} 30%, transparent 70%)`,
          boxShadow: `0 2px 8px ${fallbackShadow}`,
        }}
      />
    </div>
  );
}
