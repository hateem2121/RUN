import type React from "react";
import { cn } from "@/lib/utils";

interface ContentAnalysis {
	textLength: number;
	hasMedia: boolean;
	hasSpecs: boolean;
	hasExtras: boolean;
	mediaCount: number;
}

interface GridSpan {
	colSpan: number;
	rowSpan: number;
	className: string;
}

// Smart algorithm to determine grid span based on content richness
export function analyzeContent(item: any): ContentAnalysis {
	const description = item.description || "";
	const hasMedia = Boolean(
		item.mediaIds?.length || item.imageId || item.mediaId,
	);
	const hasSpecs = Boolean(
		item.specifications?.length || item.standards?.length || item.equipment,
	);
	const hasExtras = Boolean(
		item.frequency || item.duration || item.efficiency || item.capacity,
	);
	const mediaCount = item.mediaIds?.length || (hasMedia ? 1 : 0);

	return {
		textLength: description.length,
		hasMedia,
		hasSpecs,
		hasExtras,
		mediaCount,
	};
}

export function calculateGridSpan(
	analysis: ContentAnalysis,
	index: number,
): GridSpan {
	let colSpan = 1;
	let rowSpan = 1;

	// Base scoring system
	let contentScore = 0;

	// Text content scoring
	if (analysis.textLength > 200) contentScore += 2;
	else if (analysis.textLength > 100) contentScore += 1;

	// Media scoring
	if (analysis.mediaCount > 1) contentScore += 2;
	else if (analysis.hasMedia) contentScore += 1;

	// Additional content scoring
	if (analysis.hasSpecs) contentScore += 1;
	if (analysis.hasExtras) contentScore += 1;

	// Determine spans based on score and position
	if (contentScore >= 4) {
		// Rich content - large card
		colSpan = 2;
		rowSpan = 2;
	} else if (contentScore >= 2) {
		// Medium content - decide based on position
		if (index % 3 === 0) {
			colSpan = 2;
			rowSpan = 1;
		} else {
			colSpan = 1;
			rowSpan = 2;
		}
	} else {
		// Simple content - small card
		colSpan = 1;
		rowSpan = 1;
	}

	// Generate className
	const className = `col-span-${colSpan} row-span-${rowSpan}`;

	return { colSpan, rowSpan, className };
}

interface SmartBentoGridProps {
	children: React.ReactNode[];
	className?: string;
}

export function SmartBentoGrid({ children, className }: SmartBentoGridProps) {
	return (
		<div
			className={cn(
				"grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-min",
				className,
			)}
		>
			{children}
		</div>
	);
}

interface BentoCardProps {
	children: React.ReactNode;
	gridSpan: GridSpan;
	className?: string;
}

export function BentoCard({ children, gridSpan, className }: BentoCardProps) {
	return <div className={cn(gridSpan.className, className)}>{children}</div>;
}

// Dynamic media component that adapts to card size
interface NaturalMediaProps {
	src?: string;
	alt: string;
	className?: string;
	cardSpan?: GridSpan;
}

export function NaturalMedia({
	src,
	alt,
	className,
	cardSpan,
}: NaturalMediaProps) {
	if (!src) {
		return (
			<div
				className={cn(
					"w-full bg-muted rounded flex items-center justify-center",
					cardSpan && cardSpan.colSpan >= 2 ? "h-64" : "h-32",
					className,
				)}
			>
				<span className="text-muted-foreground text-sm">No image</span>
			</div>
		);
	}

	// Dynamic sizing based on card span
	const getMediaSize = () => {
		if (!cardSpan) return { maxHeight: "200px" };

		if (cardSpan.colSpan >= 2 && cardSpan.rowSpan >= 2) {
			// Large cards get bigger media
			return { maxHeight: "400px", minHeight: "200px" };
		} else if (cardSpan.colSpan >= 2 || cardSpan.rowSpan >= 2) {
			// Medium cards get medium media
			return { maxHeight: "280px", minHeight: "150px" };
		} else {
			// Small cards get compact media
			return { maxHeight: "180px", minHeight: "120px" };
		}
	};

	const mediaSize = getMediaSize();

	return (
		<div className={cn("relative w-full overflow-hidden rounded", className)}>
			<img
				src={src}
				alt={alt}
				className={cn(
					"w-full h-auto object-cover rounded",
					cardSpan && cardSpan.colSpan >= 2 ? "object-center" : "object-cover",
				)}
				style={mediaSize}
				loading="lazy"
			/>
		</div>
	);
}
