import type React from "react";
import { useState } from "react";
import { CATEGORIES } from "../constants";
import { useStore } from "../store";
import { CursorVariant } from "../types";

const Categories: React.FC = () => {
	const setCursor = useStore((state) => state.setCursor);
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

	return (
		<section
			id="catalogue"
			className="relative w-full py-32 bg-white overflow-hidden"
			aria-label="Product Categories"
		>
			<div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5 bg-[radial-gradient(circle_at_50%_50%,_#3300FF_0%,_transparent_50%)]" />

			<div
				className="flex flex-col gap-0"
				onMouseLeave={() => setHoveredIndex(null)}
			>
				{/* Forward Marquee */}
				<div className="flex whitespace-nowrap animate-marquee will-change-transform">
					{/* Main Content */}
					{CATEGORIES.map((cat, index) => {
						const isHovered = hoveredIndex === index;
						const isAnyHovered = hoveredIndex !== null;
						const isBlurred = isAnyHovered && !isHovered;

						return (
							<div
								key={`${cat.id}-${index}`}
								role="listitem"
								className={`relative px-8 md:px-16 py-4 group cursor-none transition-all duration-500 ease-out ${isBlurred ? "opacity-20 blur-[2px]" : "opacity-100 blur-0"}`}
								onMouseEnter={() => {
									setHoveredIndex(index);
									if (!isMobile) setCursor(CursorVariant.VIEW, "", cat.image);
								}}
								onMouseLeave={() => {
									setCursor(CursorVariant.DEFAULT);
								}}
							>
								<h2 className="text-[10vw] md:text-[10vw] font-bold uppercase tracking-tighter text-transparent stroke-text group-hover:text-black transition-colors duration-300">
									{cat.name}{" "}
									<span className="text-blue-600 inline-block align-top text-[2vw]">
										●
									</span>
								</h2>
							</div>
						);
					})}
					{/* Duplicate Content for Marquee - Hidden from SR */}
					<div aria-hidden="true" className="flex">
						{CATEGORIES.map((cat, index) => {
							// Offset index for logic
							const virtualIndex = index + 50;
							const isHovered = hoveredIndex === virtualIndex;
							const isAnyHovered = hoveredIndex !== null;
							const isBlurred = isAnyHovered && !isHovered;

							return (
								<div
									key={`${cat.id}-dup-${index}`}
									className={`relative px-8 md:px-16 py-4 group cursor-none transition-all duration-500 ease-out ${isBlurred ? "opacity-20 blur-[2px]" : "opacity-100 blur-0"}`}
									onMouseEnter={() => {
										setHoveredIndex(virtualIndex);
										if (!isMobile) setCursor(CursorVariant.VIEW, "", cat.image);
									}}
									onMouseLeave={() => {
										setCursor(CursorVariant.DEFAULT);
									}}
								>
									<h2 className="text-[10vw] md:text-[10vw] font-bold uppercase tracking-tighter text-transparent stroke-text group-hover:text-black transition-colors duration-300">
										{cat.name}{" "}
										<span className="text-blue-600 inline-block align-top text-[2vw]">
											●
										</span>
									</h2>
								</div>
							);
						})}
					</div>
				</div>

				{/* Reverse Marquee - Entirely Decorative/Redundant */}
				<div
					className="flex whitespace-nowrap animate-marquee-reverse mt-[-2vw] will-change-transform"
					aria-hidden="true"
				>
					{[...CATEGORIES, ...CATEGORIES].reverse().map((cat, index) => {
						// Offset index to avoid conflict with top row state
						const uniqueIndex = index + 100;
						const isHovered = hoveredIndex === uniqueIndex;
						const isAnyHovered = hoveredIndex !== null;
						const isBlurred = isAnyHovered && !isHovered;

						return (
							<div
								key={`${cat.id}-rev-${index}`}
								className={`relative px-8 md:px-16 py-4 group cursor-none transition-all duration-500 ease-out ${isBlurred ? "opacity-20 blur-[2px]" : "opacity-100 blur-0"}`}
								onMouseEnter={() => {
									setHoveredIndex(uniqueIndex);
									if (!isMobile) setCursor(CursorVariant.VIEW, "", cat.image);
								}}
								onMouseLeave={() => {
									setCursor(CursorVariant.DEFAULT);
								}}
							>
								<h2 className="text-[10vw] md:text-[10vw] font-bold uppercase tracking-tighter text-transparent stroke-text group-hover:text-black transition-colors duration-300">
									{cat.name}{" "}
									<span className="text-[#CCFF00] inline-block align-top text-[2vw]">
										●
									</span>
								</h2>
							</div>
						);
					})}
				</div>
			</div>

			<style>{`
        .stroke-text {
          -webkit-text-stroke: 1px #050505;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 30s linear infinite;
        }
        /* Pause on hover for easier reading */
        .flex:hover .animate-marquee, .flex:hover .animate-marquee-reverse {
            animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee, .animate-marquee-reverse {
            animation-play-state: paused;
          }
        }
      `}</style>
		</section>
	);
};

export default Categories;
