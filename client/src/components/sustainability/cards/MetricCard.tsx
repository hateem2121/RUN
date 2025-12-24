import type { SustainabilityMetric } from "@shared/schema";
import { motion } from "framer-motion";
import { memo } from "react";
import { getSustainabilityIcon } from "@/lib/sustainability-utils";

export const MetricCard = memo(
  ({ metric, index }: { metric: SustainabilityMetric; index: number }) => (
    <motion.div
      key={metric.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="text-center"
    >
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
    </motion.div>
  ),
);
MetricCard.displayName = "MetricCard";
