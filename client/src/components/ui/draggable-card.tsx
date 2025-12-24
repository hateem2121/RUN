"use client";
import {
	animate,
	motion,
	useAnimationControls,
	useMotionValue,
	useSpring,
	useTransform,
	useVelocity,
} from "framer-motion";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Hook to detect mobile devices
function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return isMobile;
}

export const DraggableCardBody = ({
	className,
	children,
}: {
	className?: string;
	children?: React.ReactNode;
}) => {
	const isMobile = useIsMobile();
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);
	const cardRef = useRef<HTMLDivElement>(null);
	const controls = useAnimationControls();
	const [constraints, setConstraints] = useState({
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	});

	// physics biatch
	const velocityX = useVelocity(mouseX);
	const velocityY = useVelocity(mouseY);

	const springConfig = {
		stiffness: 100,
		damping: 20,
		mass: 0.5,
	};

	const rotateX = useSpring(
		useTransform(mouseY, [-300, 300], [25, -25]),
		springConfig,
	);
	const rotateY = useSpring(
		useTransform(mouseX, [-300, 300], [-25, 25]),
		springConfig,
	);

	const opacity = useSpring(
		useTransform(mouseX, [-300, 0, 300], [0.8, 1, 0.8]),
		springConfig,
	);

	const glareOpacity = useSpring(
		useTransform(mouseX, [-300, 0, 300], [0.2, 0, 0.2]),
		springConfig,
	);

	useEffect(() => {
		// Update constraints when component mounts or window resizes
		const updateConstraints = () => {
			if (typeof window !== "undefined" && cardRef.current) {
				// Find the section element instead of immediate parent
				const section = cardRef.current.closest("section");
				if (section) {
					const sectionRect = section.getBoundingClientRect();
					const cardRect = cardRef.current.getBoundingClientRect();

					// Calculate card dimensions (w-80 = 320px, min-h-96 = 384px)
					const cardWidth = 320;
					const cardHeight = 384;

					// Allow partial overflow but prevent complete exit
					const margin = 50; // Minimum amount of card that must stay visible

					// Get section padding from computed styles
					const sectionStyles = window.getComputedStyle(section);
					const paddingLeft = parseInt(sectionStyles.paddingLeft, 10) || 0;
					const paddingRight = parseInt(sectionStyles.paddingRight, 10) || 0;
					const paddingTop = parseInt(sectionStyles.paddingTop, 10) || 0;
					const paddingBottom = parseInt(sectionStyles.paddingBottom, 10) || 0;

					// Calculate the content area (excluding padding)
					const contentWidth = sectionRect.width - paddingLeft - paddingRight;
					const contentHeight = sectionRect.height - paddingTop - paddingBottom;

					// Calculate card's current position relative to section's content area
					const cardRelativeX = cardRect.left - sectionRect.left - paddingLeft;
					const cardRelativeY = cardRect.top - sectionRect.top - paddingTop;

					// Calculate maximum movement distances
					const maxRightMovement =
						contentWidth - cardRelativeX - cardWidth + margin;
					const maxBottomMovement =
						contentHeight - cardRelativeY - cardHeight + margin;

					setConstraints({
						top: -(cardHeight - margin),
						left: -(cardWidth - margin),
						right: Math.max(0, maxRightMovement),
						bottom: Math.max(0, maxBottomMovement),
					});
				} else {
					// Fallback to more restrictive window-based constraints
					setConstraints({
						top: -200,
						left: -200,
						right: window.innerWidth - 200,
						bottom: window.innerHeight - 200,
					});
				}
			}
		};

		updateConstraints();

		// Add resize listener
		window.addEventListener("resize", updateConstraints);

		// Clean up
		return () => {
			window.removeEventListener("resize", updateConstraints);
		};
	}, []);

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const { clientX, clientY } = e;
		const { width, height, left, top } =
			cardRef.current?.getBoundingClientRect() ?? {
				width: 0,
				height: 0,
				left: 0,
				top: 0,
			};
		const centerX = left + width / 2;
		const centerY = top + height / 2;
		const deltaX = clientX - centerX;
		const deltaY = clientY - centerY;
		mouseX.set(deltaX);
		mouseY.set(deltaY);
	};

	const handleMouseLeave = () => {
		mouseX.set(0);
		mouseY.set(0);
	};

	// Glassmorphism card styling with dark borders
	const glassCardStyles = {
		borderRadius: "20px",
	};

	return (
		<motion.div
			ref={cardRef}
			drag
			dragConstraints={constraints}
			onDragStart={() => {
				document.body.style.cursor = "grabbing";
			}}
			onDragEnd={(_event, info) => {
				document.body.style.cursor = "default";

				controls.start({
					rotateX: 0,
					rotateY: 0,
					transition: {
						type: "spring",
						...springConfig,
					},
				});
				const currentVelocityX = velocityX.get();
				const currentVelocityY = velocityY.get();

				const velocityMagnitude = Math.sqrt(
					currentVelocityX * currentVelocityX +
						currentVelocityY * currentVelocityY,
				);
				const bounce = Math.min(0.8, velocityMagnitude / 1000);

				animate(info.point.x, info.point.x + currentVelocityX * 0.3, {
					duration: 0.8,
					ease: [0.2, 0, 0, 1],
					bounce,
					type: "spring",
					stiffness: 50,
					damping: 15,
					mass: 0.8,
				});

				animate(info.point.y, info.point.y + currentVelocityY * 0.3, {
					duration: 0.8,
					ease: [0.2, 0, 0, 1],
					bounce,
					type: "spring",
					stiffness: 50,
					damping: 15,
					mass: 0.8,
				});
			}}
			style={{
				rotateX,
				rotateY,
				opacity,
				willChange: "transform",
				...glassCardStyles,
			}}
			animate={controls}
			whileHover={{ scale: 1.02 }}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			className={cn(
				"relative min-h-96 w-80 overflow-hidden p-6 transform-3d group",
				"bg-white/10 dark:bg-white/5 backdrop-blur-md",
				"border border-gray-800/60 dark:border-gray-900/70",
				"shadow-[0_0_15px_rgba(255,255,255,0.15)] shadow-[inset_0_2px_4px_rgba(255,255,255,0.15)]",
				className,
			)}
		>
			{/* Gradient overlay for depth */}
			<div
				className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none"
				style={{ borderRadius: "20px" }}
			/>

			{/* Inner glow */}
			<div className="absolute inset-[1px] rounded-[19px] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

			{/* Content */}
			<div className="relative z-10 h-full">{children}</div>

			{/* Hover shimmer effect - disabled on mobile for performance */}
			{!isMobile && (
				<div
					className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
					style={{ borderRadius: "20px" }}
				>
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
				</div>
			)}

			{/* Glare effect */}
			<motion.div
				style={{
					opacity: glareOpacity,
				}}
				className="pointer-events-none absolute inset-0 bg-white/5 select-none"
			/>
		</motion.div>
	);
};

export const DraggableCardContainer = ({
	className,
	children,
}: {
	className?: string;
	children?: React.ReactNode;
}) => {
	return (
		<div className={cn("[perspective:3000px]", className)}>{children}</div>
	);
};
