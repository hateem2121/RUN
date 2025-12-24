import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { memo, useEffect, useRef } from "react";

interface CircularProgressStatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  color: string;
  gradientId: string;
  delay: number;
}

export const CircularProgressStatOptimized = memo(function CircularProgressStatOptimized({
  icon,
  label,
  value,
  suffix,
  gradientId,
  delay,
}: CircularProgressStatProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const inView = useInView(nodeRef, { once: true });
  const motionValue = useMotionValue(0);
  const displayValue = useTransform(motionValue, (v) => Math.round(v));

  // Circle dimensions
  const size = 140;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Smooth animation using framer-motion
  useEffect(() => {
    if (!inView) return;

    const controls = animate(motionValue, value, {
      duration: 2,
      delay: delay,
      ease: [0.25, 0.46, 0.45, 0.94], // Smooth easing curve
      onUpdate: (latest) => {
        // Trigger re-render for smooth counting
        motionValue.set(latest);
      },
    });

    return controls.stop;
  }, [value, inView, delay, motionValue]);

  // Calculate stroke-dashoffset based on percentage (value is 0-100)
  // When value is 0%, offset should be circumference (no fill)
  // When value is 100%, offset should be 0 (full fill)
  const strokeDashoffsetValue = useTransform(
    motionValue,
    (v) => circumference - (circumference * v) / 100,
  );

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative"
    >
      {/* Simplified card container - removed most effects */}
      <div className="relative flex h-full flex-col items-center rounded-2xl border border-gray-800/50 bg-white/5 p-6 dark:border-white/25">
        {/* Icon - simplified */}
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10`}>
          {icon}
        </div>

        {/* Circular Progress - simplified */}
        <div className="relative mb-4">
          <svg width={size} height={size} className="-rotate-90 transform">
            {/* Green gradient */}
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={strokeWidth}
            />

            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              style={{ strokeDashoffset: strokeDashoffsetValue }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span className="font-bold text-3xl text-white sm:text-4xl">
              {displayValue}
            </motion.span>
            <span className="font-medium text-sm text-white/80">{suffix}</span>
          </div>
        </div>

        {/* Label */}
        <h3 className="text-center font-medium text-base text-white/90">{label}</h3>
      </div>
    </motion.div>
  );
});
