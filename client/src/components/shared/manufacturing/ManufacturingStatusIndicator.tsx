import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface ManufacturingStatusIndicatorProps {
  value?: number;
  maximum?: number;
  label?: string;
  status?: "active" | "inactive" | "pending" | "success" | "warning";
  variant?: "progress" | "badge" | "metric" | "quality";
  animate?: boolean;
  delay?: number;
  unit?: string;
  showIcon?: boolean;
  className?: string;
}

/**
 * Unified status and progress indicator for manufacturing components
 * Supports various display modes and consistent styling
 */
export function ManufacturingStatusIndicator({
  value = 0,
  maximum = 100,
  label,
  status = "active",
  variant = "progress",
  animate = true,
  delay = 0,
  unit = "%",
  showIcon = true,
  className = "",
}: ManufacturingStatusIndicatorProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) return;

    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, animate, delay]);

  // Status configurations
  const statusConfig = {
    active: {
      color: "text-green-600",
      bgColor: "bg-green-100",
      progressColor: "from-green-400 to-green-600",
      icon: CheckCircle2,
    },
    inactive: {
      color: "text-gray-500",
      bgColor: "bg-gray-100",
      progressColor: "from-gray-400 to-gray-500",
      icon: Clock,
    },
    pending: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      progressColor: "from-yellow-400 to-yellow-600",
      icon: Clock,
    },
    success: {
      color: "text-green-600",
      bgColor: "bg-green-100",
      progressColor: "from-green-400 to-green-600",
      icon: CheckCircle2,
    },
    warning: {
      color: "text-red-600",
      bgColor: "bg-red-100",
      progressColor: "from-red-400 to-red-600",
      icon: AlertCircle,
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;
  const percentage = Math.min((displayValue / maximum) * 100, 100);

  if (variant === "badge") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-1 font-medium text-xs ${config.color} ${config.bgColor} ${className}
      `}
      >
        {showIcon && <IconComponent className="h-3 w-3" />}
        {label}
      </span>
    );
  }

  if (variant === "metric") {
    return (
      <div className={`text-center ${className}`}>
        <div className="center-flex mb-1 gap-2">
          {showIcon && <TrendingUp className={`h-4 w-4 ${config.color}`} />}
          <motion.span
            className={`font-bold text-2xl ${config.color}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay / 1000 }}
          >
            {animate ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: delay / 1000,
                  type: "spring",
                  stiffness: 200,
                }}
              >
                {Math.round(displayValue)}
                {unit}
              </motion.span>
            ) : (
              `${Math.round(displayValue)}${unit}`
            )}
          </motion.span>
        </div>
        {label && <p className="text-gray-600 text-sm">{label}</p>}
      </div>
    );
  }

  if (variant === "quality") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className={`font-bold ${config.color}`}>
            {Math.round(displayValue)}
            {unit}
          </span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${config.progressColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{
              duration: animate ? 1 : 0,
              delay: delay / 1000,
              ease: "easeOut",
            }}
          />
        </div>
      </div>
    );
  }

  // Default: progress variant
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <motion.span
          className={`font-medium ${config.color}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay / 1000 }}
        >
          {animate ? (
            <motion.span
              key={displayValue}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {Math.round(displayValue)}
              {unit}
            </motion.span>
          ) : (
            `${Math.round(displayValue)}${unit}`
          )}
        </motion.span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
