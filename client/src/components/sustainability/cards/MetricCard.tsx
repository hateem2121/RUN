import { memo } from "react";
import { motion } from "framer-motion";
import type { SustainabilityMetric } from "@shared/schema";
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
        className="bg-stone-300 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
        role="img"
        aria-label={`${metric.name} icon`}
      >
        {getSustainabilityIcon(metric.iconName, "lg")}
      </div>
      <h3 className="text-2xl font-bold text-stone-900 mb-2">
        {metric.value}
        {metric.unit}
      </h3>
      <p className="text-stone-600">{metric.name}</p>
      {metric.description && (
        <p className="text-sm text-stone-500 mt-2 max-w-xs mx-auto">
          {metric.description}
        </p>
      )}
    </motion.div>
  ),
);
MetricCard.displayName = "MetricCard";
