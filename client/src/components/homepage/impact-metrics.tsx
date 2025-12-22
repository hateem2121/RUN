import { motion } from "framer-motion";
import { Droplets, Trash2, Wind } from "lucide-react";

interface ImpactMetricsProps {
  metrics?: {
    waterSavedPerProduct: number;
    co2ReducedPerProduct: number;
    wastePreventedPerProduct: number;
  } | null;
}

export function ImpactMetrics({ metrics }: ImpactMetricsProps) {
  if (!metrics) return null;

  const items = [
    {
      label: "Water Saved",
      value: metrics.waterSavedPerProduct,
      unit: "L",
      icon: Droplets,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/20"
    },
    {
      label: "CO2 Reduced",
      value: metrics.co2ReducedPerProduct,
      unit: "kg",
      icon: Wind,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400/20"
    },
    {
      label: "Waste Prevented",
      value: metrics.wastePreventedPerProduct,
      unit: "g",
      icon: Trash2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      borderColor: "border-emerald-400/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className={`relative p-6 rounded-2xl border ${item.borderColor} ${item.bgColor} backdrop-blur-xs`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${item.bgColor} border ${item.borderColor}`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm text-white/60 mb-1">{item.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{item.value}</span>
                <span className={`text-sm font-medium ${item.color}`}>{item.unit}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
