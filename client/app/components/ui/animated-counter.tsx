import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

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

  useGSAP(
    () => {
      const proxy = { value: 0 };
      gsap.to(proxy, {
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
    },
    { dependencies: [value, duration], scope: containerRef },
  );

  return (
    <div ref={containerRef} className={className}>
      {prefix}
      {displayValue.toFixed(decimals)}
      {suffix}
    </div>
  );
}
