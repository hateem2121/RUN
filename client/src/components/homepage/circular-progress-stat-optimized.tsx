import {
	animate,
	motion,
	useInView,
	useMotionValue,
	useTransform,
} from "framer-motion";
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

export const CircularProgressStatOptimized = memo(
	function CircularProgressStatOptimized({
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
				<div className="relative bg-white/5 border border-gray-800/50 dark:border-white/25 rounded-2xl p-6 h-full flex flex-col items-center">
					{/* Icon - simplified */}
					<div
						className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4`}
					>
						{icon}
					</div>

					{/* Circular Progress - simplified */}
					<div className="relative mb-4">
						<svg width={size} height={size} className="transform -rotate-90">
							{/* Green gradient */}
							<defs>
								<linearGradient
									id={gradientId}
									x1="0%"
									y1="0%"
									x2="100%"
									y2="100%"
								>
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
							<motion.span className="text-3xl sm:text-4xl font-bold text-white">
								{displayValue}
							</motion.span>
							<span className="text-sm font-medium text-white/80">
								{suffix}
							</span>
						</div>
					</div>

					{/* Label */}
					<h3 className="text-center text-base font-medium text-white/90">
						{label}
					</h3>
				</div>
			</motion.div>
		);
	},
);
