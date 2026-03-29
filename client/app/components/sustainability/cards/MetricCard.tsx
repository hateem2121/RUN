import { useGSAP } from "@gsap/react";
import type { SustainabilityMetric } from "@shared/index";
import gsap from "gsap";
import { memo, useRef } from "react";
import { getSustainabilityIcon } from "@/lib/sustainability-utils";

export const MetricCard = memo(
  ({ metric, index }: { metric: SustainabilityMetric; index: number }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    useGSAP(
      () => {
        gsap.from(cardRef.current, {
          opacity: 0,
          y: 30,
          duration: 0.6,
          delay: index * 0.1,
          ease: "power2.out",
        });
      },
      { scope: cardRef },
    );

    return (
      <div ref={cardRef} className="text-center">
        <div
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-300"
          role="img"
          aria-label={`${metric.name} icon`}
        >
          {getSustainabilityIcon(metric.iconName, "lg")}
        </div>
        <h3 className="mb-2 font-bold text-2xl text-stone-900">
          {metric.value}
          {metric.unit}
        </h3>
        <p className="text-stone-600">{metric.name}</p>
        {metric.description && (
          <p className="mx-auto mt-2 max-w-xs text-sm text-stone-500">{metric.description}</p>
        )}
      </div>
    );
  },
);
MetricCard.displayName = "MetricCard";
