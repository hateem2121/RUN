import { memo, useEffect, useRef } from "react";

type Mode = "lens" | "bar" | "cube";

interface GlassGeometryProps {
  scale?: number;
  [key: string]: unknown;
}

interface FluidGlassProps {
  mode?: Mode;
  lensProps?: GlassGeometryProps;
  barProps?: GlassGeometryProps;
  cubeProps?: GlassGeometryProps;
}

/**
 * FluidGlass — CSS glassmorphism mouse-tracking effect.
 * Replaces the previous three.js/WebGL implementation to comply with the
 * project's hard constraint: @google/model-viewer only for 3D; no three.js.
 */
export const FluidGlass = memo(function FluidGlass({
  mode = "lens",
  lensProps = {},
  barProps = {},
  cubeProps = {},
}: FluidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  const modeProps = mode === "lens" ? lensProps : mode === "bar" ? barProps : cubeProps;
  const baseSize = 80 * (modeProps.scale || 1);

  const borderRadius = mode === "lens" ? "50%" : mode === "bar" ? "12px" : "8px";

  useEffect(() => {
    const container = containerRef.current;
    const sphere = sphereRef.current;
    if (!container || !sphere) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };

    const animate = () => {
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.1;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.1;

      const tx = posRef.current.x * (container.clientWidth * 0.25);
      const ty = -posRef.current.y * (container.clientHeight * 0.25);
      const rx = posRef.current.y * 15;
      const ry = posRef.current.x * 15;

      sphere.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotateX(${rx}deg) rotateY(${ry}deg)`;
      animRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener("mousemove", handleMouseMove);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full min-h-[400px]"
      style={{ perspective: "600px", perspectiveOrigin: "center" }}
    >
      <div
        ref={sphereRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          borderRadius,
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.05), 0 8px 32px rgba(31,38,135,0.25)",
          border: "1px solid rgba(255,255,255,0.4)",
          willChange: "transform",
          transformStyle: "preserve-3d",
        }}
      />
    </div>
  );
});
