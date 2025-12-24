import type { ManufacturingProcess, MediaAsset } from "@shared/schema";
import {
	Activity,
	CheckCircle2,
	Cog,
	Cpu,
	Factory,
	Gauge,
	Settings,
	Shield,
	Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
	analyzeContent,
	BentoCard,
	calculateGridSpan,
} from "@/components/ui/smart-bento-grid";
import { cn } from "@/lib/utils";
import { CardDecorator } from "./CardDecorator";
import { ManufacturingStatusIndicator } from "./ManufacturingStatusIndicator";

interface ProcessCardProps {
	process: ManufacturingProcess;
	index: number;
	mediaAssets: MediaAsset[];
}

export function ProcessCard({ process, index, mediaAssets }: ProcessCardProps) {
	const iconMap = {
		Factory,
		Cpu,
		Cog,
		Settings,
		Gauge,
		Zap,
		Shield,
		CheckCircle2,
	} as const;

	const IconComponent =
		iconMap[process.iconName as keyof typeof iconMap] || Factory;

	// Analyze content and calculate grid span
	const analysis = analyzeContent(process);
	const gridSpan = calculateGridSpan(analysis, index);

	// Find primary media for this process using imageId or first mediaId
	const primaryMediaId =
		process.imageId ||
		(Array.isArray(process.mediaIds) && process.mediaIds.length > 0
			? process.mediaIds[0]
			: null);
	const primaryMedia = primaryMediaId
		? mediaAssets.find((asset) => asset.id === primaryMediaId)
		: null;

	return (
		<BentoCard gridSpan={gridSpan}>
			<Card
				className={cn(
					"group relative rounded-none h-full manufacturing-card-hover manufacturing-focus-glow",
					"border-2 border-gray-200",
				)}
			>
				<CardDecorator />

				<CardHeader className="pb-1">
					<div className="p-3">
						<span className="text-muted-foreground flex items-center gap-2 text-xs">
							<IconComponent className="size-3" />
							Manufacturing Process
						</span>
						<p
							className={cn(
								"mt-2 font-semibold leading-tight manufacturing-title-underline",
								gridSpan.colSpan >= 2 ? "text-xl" : "text-base",
							)}
						>
							{process.name}
						</p>
					</div>
				</CardHeader>

				<CardContent className="p-3 pt-0 space-y-3">
					{/* Dynamic media with optimized sizing */}
					{primaryMedia && (
						<OptimizedImage
							mediaId={primaryMedia.id}
							alt={process.name}
							className="manufacturing-media-hover rounded-lg"
						/>
					)}

					{process.description && (
						<p
							className={cn(
								"text-muted-foreground line-clamp-3",
								gridSpan.colSpan >= 2 ? "text-sm line-clamp-4" : "text-xs",
							)}
						>
							{process.description}
						</p>
					)}

					{/* Content based on card size */}
					<div className="space-y-2">
						{gridSpan.colSpan >= 2 && process.efficiency && (
							<ManufacturingStatusIndicator
								value={process.efficiency}
								label="Efficiency"
								variant="progress"
								animate={true}
								delay={index * 200}
							/>
						)}

						{process.duration && (
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<Activity className="w-3 h-3" />
								<span>Duration: {process.duration}</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</BentoCard>
	);
}
