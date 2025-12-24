import { motion } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";

interface MagneticButtonProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
	variant?: "primary" | "secondary";
}

export const MagneticButton = memo(function MagneticButton({
	children,
	className = "",
	onClick,
	variant = "primary",
}: MagneticButtonProps) {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isHovered, setIsHovered] = useState(false);
	const [ripples, setRipples] = useState<
		{ x: number; y: number; id: number }[]
	>([]);

	useEffect(() => {
		const button = buttonRef.current;
		if (!button) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!isHovered) return;

			const rect = button.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;

			const distanceX = e.clientX - centerX;
			const distanceY = e.clientY - centerY;

			// Magnetic effect strength
			const strength = 0.3;
			const maxDistance = 100;

			const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

			if (distance < maxDistance) {
				const force = (maxDistance - distance) / maxDistance;
				setPosition({
					x: distanceX * strength * force,
					y: distanceY * strength * force,
				});
			}
		};

		const handleMouseLeave = () => {
			setPosition({ x: 0, y: 0 });
			setIsHovered(false);
		};

		window.addEventListener("mousemove", handleMouseMove);
		button.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			if (button) {
				button.removeEventListener("mouseleave", handleMouseLeave);
			}
		};
	}, [isHovered]);

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		const button = buttonRef.current;
		if (!button) return;

		const rect = button.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const newRipple = { x, y, id: Date.now() };
		setRipples((prev) => [...prev, newRipple]);

		// Remove ripple after animation
		setTimeout(() => {
			setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
		}, 1000);

		onClick?.();
	};

	const baseClasses =
		variant === "primary"
			? "bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]"
			: "bg-white/5 backdrop-blur-lg border border-white/10 text-white shadow-[0_4px_16px_0_rgba(31,38,135,0.2)]";

	return (
		<motion.button
			ref={buttonRef}
			onMouseEnter={() => setIsHovered(true)}
			onClick={handleClick}
			className={`relative overflow-hidden py-3 px-6 font-medium rounded-xl transition-all duration-500 transform ${baseClasses} ${className}`}
			style={{ WebkitBackdropFilter: "blur(16px)" }}
			animate={{
				x: position.x,
				y: position.y,
			}}
			transition={{
				type: "spring",
				stiffness: 350,
				damping: 15,
			}}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
		>
			{/* Liquid glass shimmer overlay */}
			<motion.div
				className="absolute inset-0 opacity-0 rounded-xl"
				style={{
					background:
						"linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.2) 100%)",
				}}
				animate={{ opacity: isHovered ? 1 : 0 }}
				transition={{ duration: 0.4 }}
			/>

			{/* Frosted glass inner glow */}
			<motion.div
				className="absolute inset-[1px] opacity-0 rounded-xl"
				style={{
					background:
						variant === "primary"
							? "radial-gradient(circle at 50% 0%, rgba(74, 222, 128, 0.15) 0%, transparent 60%)"
							: "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.1) 0%, transparent 60%)",
				}}
				animate={{ opacity: isHovered ? 1 : 0 }}
				transition={{ duration: 0.5 }}
			/>

			{/* Glass ripple effects */}
			{ripples.map((ripple) => (
				<motion.div
					key={ripple.id}
					className="absolute rounded-full"
					style={{
						left: ripple.x,
						top: ripple.y,
						x: "-50%",
						y: "-50%",
						background:
							"radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 40%, transparent 70%)",
						backdropFilter: "blur(4px)",
					}}
					initial={{ width: 0, height: 0, opacity: 1 }}
					animate={{
						width: 200,
						height: 200,
						opacity: 0,
					}}
					transition={{ duration: 0.8, ease: "easeOut" }}
				/>
			))}

			{/* Button content */}
			<span className="relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
				{children}
			</span>

			{/* Liquid glass border highlight */}
			<motion.div
				className="absolute inset-0 rounded-xl opacity-0 pointer-events-none"
				style={{
					background:
						"linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 40%, transparent 60%, rgba(255, 255, 255, 0.3) 100%)",
					backgroundSize: "200% 200%",
				}}
				animate={{
					backgroundPosition: isHovered ? ["0% 0%", "100% 100%"] : "0% 0%",
					opacity: isHovered ? 0.6 : 0,
				}}
				transition={{
					backgroundPosition: {
						duration: 2,
						repeat: isHovered ? Infinity : 0,
						ease: "linear",
					},
					opacity: {
						duration: 0.4,
					},
				}}
			/>

			{/* Glass refraction effect */}
			<div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
				<motion.div
					className="absolute -inset-full"
					style={{
						background:
							"linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)",
					}}
					animate={{
						x: isHovered ? ["100%", "-100%"] : "100%",
					}}
					transition={{
						duration: 1.2,
						repeat: isHovered ? Infinity : 0,
						ease: "easeInOut",
						repeatDelay: 0.5,
					}}
				/>
			</div>
		</motion.button>
	);
});
