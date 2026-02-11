import type { AnimationItem } from "lottie-web";
import lottie from "lottie-web/build/player/lottie_light";
import { useEffect, useRef } from "react";

interface LottieIconProps {
  // biome-ignore lint/suspicious/noExplicitAny: Lottie animation data is complex JSON
  animationData: Record<string, unknown>;
  size: number;
  type: "client" | "facility";
}

export function LottieIcon({ animationData, size, type }: LottieIconProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current || !animationData) {
      return;
    }

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
      // biome-ignore lint/style/noInlineStyles: Dynamic size prop required
      style={{
        "--size": `${size}px`,
        "--fallback-color": fallbackColor,
        "--fallback-shadow": fallbackShadow,
      } as React.CSSProperties}
      className="relative h-(--size) w-(--size) min-h-(--size) min-w-(--size)"
    >
      {/* Fallback content if Lottie fails */}
      <div
        className="absolute inset-0 animate-pulse rounded-full border-2 border-white bg-[radial-gradient(circle,var(--fallback-color)_30%,transparent_70%)] shadow-[0_2px_8px_var(--fallback-shadow)]"
      />
    </div>
  );
}
