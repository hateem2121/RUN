import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedCounterProps {
  value: number;
  duration?: number | undefined;
  decimals?: number | undefined;
  prefix?: string | undefined;
  suffix?: string | undefined;
  className?: string | undefined;
}

export function AnimatedCounter({
  value,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const proxy = { value: 0 };
    const tween = gsap.to(proxy, {
      value,
      duration,
      ease: "power2.out",
      onUpdate: () => setDisplayValue(proxy.value),
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        once: true,
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, duration]);

  return (
    <div ref={containerRef} className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </div>
  );
}
