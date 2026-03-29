import { useGSAP } from "@gsap/react";
import type { MediaAsset, SustainabilityInitiative } from "@shared/index";
import gsap from "gsap";
import { memo, useRef } from "react";
import { getSustainabilityIcon } from "@/lib/sustainability-utils";

export const InitiativeCard = memo(
  ({
    initiative,
    index,
    initiativeImage,
  }: {
    initiative: SustainabilityInitiative;
    index: number;
    initiativeImage?: MediaAsset;
  }) => {
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
      <div
        ref={cardRef}
        className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
      >
        <div className="mb-4 flex items-start space-x-4">
          <div className="shrink-0" role="img" aria-label={`${initiative.title} icon`}>
            {getSustainabilityIcon(initiative.iconName, "md")}
          </div>
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-stone-900 text-xl">{initiative.title}</h3>
            {initiative.category && (
              <span className="mb-3 inline-block rounded-full bg-stone-200 px-3 py-1 font-medium text-stone-800 text-xs">
                {initiative.category}
              </span>
            )}
          </div>
        </div>

        {initiativeImage && (
          <div className="mb-4 overflow-hidden rounded-lg">
            <img
              src={initiativeImage.url || `/api/media/${initiativeImage.id}/content`}
              alt={initiative.title}
              className="h-48 w-full object-cover"
            />
          </div>
        )}

        {initiative.description && (
          <p className="mb-4 text-stone-600 leading-relaxed">{initiative.description}</p>
        )}

        {initiative.impact && (
          <div className="border-stone-200 border-t pt-4">
            <p className="mb-1 font-medium text-sm text-stone-700">Impact:</p>
            <p className="text-sm text-stone-600">{initiative.impact}</p>
          </div>
        )}
      </div>
    );
  },
);
InitiativeCard.displayName = "InitiativeCard";
