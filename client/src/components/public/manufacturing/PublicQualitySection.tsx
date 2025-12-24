import type { ManufacturingQuality, MediaAsset } from "@shared/schema";
import { motion } from "framer-motion";
import { ManufacturingErrorBoundary } from "@/components/manufacturing-error-boundary";
import { QualityCard } from "@/components/shared/manufacturing";
import { SmartBentoGrid } from "@/components/ui/smart-bento-grid";

interface PublicQualitySectionProps {
  mediaAssets: MediaAsset[];
  qualities: ManufacturingQuality[];
}

export function PublicQualitySection({ mediaAssets, qualities }: PublicQualitySectionProps) {
  // Filter active quality controls
  const activeQualityControls = Array.isArray(qualities)
    ? qualities.filter((quality) => quality.isActive !== false)
    : [];

  if (activeQualityControls.length === 0) {
    return null;
  }

  return (
    <ManufacturingErrorBoundary>
      <section className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 font-bold text-4xl text-gray-900">Quality Assurance</h2>
            <p className="mx-auto max-w-3xl text-gray-600 text-xl">
              Rigorous testing and quality control at every stage
            </p>
          </motion.div>

          <SmartBentoGrid>
            {activeQualityControls.map((quality, index) => (
              <QualityCard
                key={quality.id}
                quality={quality}
                index={index}
                mediaAssets={mediaAssets}
              />
            ))}
          </SmartBentoGrid>
        </div>
      </section>
    </ManufacturingErrorBoundary>
  );
}
