import type { MediaAsset } from "@shared/schema";
import { Box, FileX, Image as ImageIcon, Video } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { cn } from "@/lib/utils";

interface MediaPreviewProps {
	asset: MediaAsset;
	className?: string;
	size?: "sm" | "md" | "lg";
	showTypeIcon?: boolean;
}

const getTypeIcon = (type: string) => {
	switch (type) {
		case "video":
			return <Video className="h-4 w-4" />;
		case "3d_model":
			return <Box className="h-4 w-4" />;
		case "image":
			return <ImageIcon className="h-4 w-4" />;
		default:
			return <FileX className="h-4 w-4" />;
	}
};

export function MediaPreview({
	asset,
	className,
	size = "md",
	showTypeIcon = true,
}: Readonly<MediaPreviewProps>) {
	const [imageLoaded, setImageLoaded] = useState(false);
	const [hasError, setHasError] = useState(false);

	// Determine optimized size based on size prop
	let imageWidth: number;
	let optimizedSize: "small" | "medium" | "large";

	if (size === "sm") {
		imageWidth = 300;
		optimizedSize = "small";
	} else if (size === "lg") {
		imageWidth = 1200;
		optimizedSize = "large";
	} else {
		imageWidth = 600;
		optimizedSize = "medium";
	}

	// Use the hook at component level, not inside renderMedia
	const { urls } = useOptimizedMedia(asset.id, {
		width: imageWidth,
		quality: 85,
		format: "webp",
	});

	// Get optimized URL or fallback
	const mediaUrl =
		urls?.[optimizedSize] ||
		asset.url ||
		MediaUrlBuilder.buildUrlSafe(asset.id);

	const sizeClasses = {
		sm: "h-16",
		md: "h-24",
		lg: "h-32",
	};

	const renderMedia = () => {
		if (hasError) {
			return (
				<div className="flex items-center justify-center h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded">
					<div className="text-center">
						{getTypeIcon(asset.type)}
						<p className="text-xs text-gray-500 mt-1">Failed to load</p>
					</div>
				</div>
			);
		}

		switch (asset.type) {
			case "video":
				return (
					<div className="relative group h-full">
						<video
							src={mediaUrl}
							className="w-full h-full object-cover rounded"
							muted
							preload="metadata"
							onError={() => setHasError(true)}
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-all duration-300">
							<Video className="h-6 w-6 text-white drop-shadow-lg" />
						</div>
						{showTypeIcon && (
							<div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full">
								<Video className="h-2.5 w-2.5 inline mr-1" />
								Video
							</div>
						)}
					</div>
				);

			case "3d_model":
				return (
					<div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded">
						<div className="text-center">
							<Box className="h-6 w-6 mx-auto text-orange-600 mb-1" />
							<p
								className="text-xs text-orange-700 font-medium truncate max-w-[60px]"
								title={asset.originalName || ""}
							>
								{/* Handle potential null for originalName */}
								{(asset.originalName || "").length > 8
									? (asset.originalName || "").substring(0, 8) + "..."
									: asset.originalName || ""}
							</p>
							{showTypeIcon && (
								<div className="text-xs text-orange-500 mt-1">3D</div>
							)}
						</div>
					</div>
				);

			case "image":
			default:
				return (
					<div className="relative overflow-hidden rounded h-full">
						{!imageLoaded && (
							<div className="absolute inset-0 flex items-center justify-center">
								<Skeleton className="w-full h-full animate-pulse" />
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
								</div>
							</div>
						)}
						<img
							src={mediaUrl}
							// Handle potential null for originalName in alt text
							alt={asset.originalName || ""}
							className={cn(
								"w-full h-full object-cover rounded transition-all duration-300",
								"group-hover:scale-105",
								imageLoaded ? "opacity-100" : "opacity-0",
							)}
							onLoad={() => setImageLoaded(true)}
							onError={() => setHasError(true)}
						/>
						{showTypeIcon && imageLoaded && (
							<div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<ImageIcon className="h-2.5 w-2.5 inline mr-1" />
								Image
							</div>
						)}
					</div>
				);
		}
	};

	return (
		<div
			className={cn(
				"relative group rounded-lg overflow-hidden border border-gray-200 bg-white shadow-xs transition-all duration-300",
				"hover:shadow-md hover:border-gray-300",
				sizeClasses[size],
				className,
			)}
		>
			{renderMedia()}
		</div>
	);
}
