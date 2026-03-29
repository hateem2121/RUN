import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface ManufacturingStatusIndicatorProps {
  value?: number | undefined;
  maximum?: number | undefined;
  label?: string | undefined;
  status?: "active" | "inactive" | "pending" | "success" | "warning";
  variant?: "progress" | "badge" | "metric" | "quality";
  animate?: boolean | undefined;
  delay?: number | undefined;
  unit?: string | undefined;
  showIcon?: boolean | undefined;
  className?: string | undefined;
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
  const metricValueRef = useRef<HTMLSpanElement>(null);
  const progressValueRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate) {
      return;
    }

    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, animate, delay]);

  useGSAP(
    () => {
      if (variant === "metric" && metricValueRef.current) {
        gsap.from(metricValueRef.current, {
          opacity: 0,
          scale: 0.5,
          duration: 0.4,
          delay: delay / 1000,
          ease: "back.out(1.7)",
        });
      }
    },
    { scope: metricValueRef, dependencies: [variant, delay] },
  );

  useGSAP(
    () => {
      if (variant === "progress" && progressValueRef.current) {
        gsap.from(progressValueRef.current, {
          opacity: 0,
          duration: 0.3,
          delay: delay / 1000,
        });
      }
    },
    { scope: progressValueRef, dependencies: [variant, delay] },
  );

  // Status configurations
  const statusConfig = {
    active: {
      color: "text-green-600",
      bgColor: "bg-green-100",
      progressColor: "from-green-400 to-green-600",
      icon: CheckCircle2,
    },
    inactive: {
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      progressColor: "from-muted-foreground to-background0",
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
        className={`inline-flex items-center gap-1 rounded px-2 py-1 font-medium text-xs ${config.color} ${config.bgColor} ${className} `}
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
          <span ref={metricValueRef} className={`font-bold text-2xl ${config.color}`}>
            {Math.round(displayValue)}
            {unit}
          </span>
        </div>
        {label && <p className="text-muted-foreground text-sm">{label}</p>}
      </div>
    );
  }

  if (variant === "quality") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className={`font-bold ${config.color}`}>
            {Math.round(displayValue)}
            {unit}
          </span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-muted/20">
          <div
            ref={progressBarRef}
            className={`absolute inset-y-0 left-0 bg-linear-to-r ${config.progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Default: progress variant
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span ref={progressValueRef} className={`font-medium ${config.color}`}>
          {Math.round(displayValue)}
          {unit}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
