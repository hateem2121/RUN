import type { MediaAsset, SustainabilityInitiative } from "@shared/schema";
import { motion } from "framer-motion";
import { InitiativeCard } from "../cards";

export function InitiativesSection({
  initiatives,
  mediaAssets = [],
  title = "Our Sustainability Initiatives",
  description = "Discover our comprehensive sustainability programs and initiatives driving positive environmental impact.",
}: {
  initiatives: SustainabilityInitiative[];
  mediaAssets?: MediaAsset[];
  title?: string | undefined;
  description?: string | undefined;
}) {
  return (
    <section className="relative bg-white py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-bold font-neue-stance text-3xl text-stone-900">{title}</h2>
          <p className="mx-auto max-w-3xl text-lg text-stone-600">{description}</p>
        </motion.div>

        <div
          className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          role="group"
          aria-label="Sustainability initiatives"
        >
          {initiatives.map((initiative, index) => {
            const initiativeImage = mediaAssets.find((asset) => asset.id === initiative.imageId);
            return (
              <InitiativeCard
                key={initiative.id}
                initiative={initiative}
                index={index}
                {...(initiativeImage ? { initiativeImage } : {})}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
