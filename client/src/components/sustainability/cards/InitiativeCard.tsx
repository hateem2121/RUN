import { memo } from "react";
import { motion } from "framer-motion";
import type { SustainabilityInitiative, MediaAsset } from "@shared/schema";
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
    return (
      <motion.div
        key={initiative.id}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        className="bg-stone-50 rounded-xl p-6 shadow-lg border border-stone-200 hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-start space-x-4 mb-4">
          <div
            className="shrink-0"
            role="img"
            aria-label={`${initiative.title} icon`}
          >
            {getSustainabilityIcon(initiative.iconName, "md")}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-stone-900 mb-2">
              {initiative.title}
            </h3>
            {initiative.category && (
              <span className="inline-block px-3 py-1 text-xs font-medium bg-stone-200 text-stone-800 rounded-full mb-3">
                {initiative.category}
              </span>
            )}
          </div>
        </div>

        {initiativeImage && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={
                initiativeImage.url ||
                `/api/media/${initiativeImage.id}/content`
              }
              alt={initiative.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {initiative.description && (
          <p className="text-stone-600 mb-4 leading-relaxed">
            {initiative.description}
          </p>
        )}

        {initiative.impact && (
          <div className="border-t border-stone-200 pt-4">
            <p className="text-sm font-medium text-stone-700 mb-1">Impact:</p>
            <p className="text-sm text-stone-600">{initiative.impact}</p>
          </div>
        )}
      </motion.div>
    );
  },
);
InitiativeCard.displayName = "InitiativeCard";
