import type { ManufacturingCapability, MediaAsset } from "@shared/schema";
import { motion } from "framer-motion";
import { ManufacturingErrorBoundary } from "@/components/manufacturing-error-boundary";
import { CapabilityCard } from "@/components/shared/manufacturing";
import { SmartBentoGrid } from "@/components/ui/smart-bento-grid";

interface PublicCapabilitySectionProps {
  mediaAssets: MediaAsset[];
  capabilities: ManufacturingCapability[];
}

export function PublicCapabilitySection({
  mediaAssets,
  capabilities,
}: PublicCapabilitySectionProps) {
  // Filter active capabilities
  const activeCapabilities = Array.isArray(capabilities)
    ? capabilities.filter((capability) => capability.isActive !== false)
    : [];

  if (activeCapabilities.length === 0) {
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
            <h2 className="mb-4 font-bold text-4xl text-foreground">Manufacturing Capabilities</h2>
            <p className="mx-auto max-w-3xl text-muted-foreground text-xl">
              State-of-the-art facilities and equipment delivering exceptional results
            </p>
          </motion.div>

          <SmartBentoGrid>
            {activeCapabilities.map((capability, index) => (
              <CapabilityCard
                key={capability.id}
                capability={capability}
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
