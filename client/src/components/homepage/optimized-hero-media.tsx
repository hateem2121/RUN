/**
 * Optimized Hero Media Component
 * Direct media loading for hero content without lazy loading complexity
 */

import type { MediaAsset } from "@shared/schema";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedHeroMediaProps {
	asset: MediaAsset;
	className?: string;
	onLoad?: () => void;
	onError?: (error: Error) => void;
}

export const OptimizedHeroMedia = memo(function OptimizedHeroMedia({
	asset,
	className,
	onLoad,
	onError,
}: OptimizedHeroMediaProps) {
	const [isLoaded, setIsLoaded] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);

	const handleLoad = useCallback(() => {
		setIsLoaded(true);
		onLoad?.();
		if (import.meta.env.DEV) {
		}
	}, [asset.id, asset.originalName, onLoad]);

	const handleError = useCallback(() => {
		// setHasError(true);
		const error = new Error(
			`Failed to load hero media asset ${asset.id}: ${asset.originalName}`,
		);
		if (import.meta.env.DEV) {
		}
		onError?.(error);
	}, [asset.id, asset.originalName, onError]);

	// PERFORMANCE FIX: Handle autoplay with promise-based error handling
	useEffect(() => {
		if (asset.type === "video" && videoRef.current && isLoaded) {
			const playPromise = videoRef.current.play();
			if (playPromise !== undefined) {
				playPromise.catch((error) => {});
			}
		}
	}, [asset.type, isLoaded]);

	const mediaUrl = `/api/media/${asset.id}/content`;

	if (asset.type === "video") {
		return (
			<>
				<video
					ref={videoRef}
					className={cn(
						"absolute inset-0 w-full h-full object-cover",
						className,
					)}
					loop
					muted
					playsInline
					preload="auto"
					onLoadedData={handleLoad}
					onError={handleError}
				>
					<source src={mediaUrl} type={asset.mimeType || "video/mp4"} />
					Your browser does not support the video tag.
				</video>
				<div className="absolute inset-0 bg-black/50" />
			</>
		);
	}

	// Image type
	// Note: HomepageHero schema doesn't include backgroundDisplayMode/FocalPoint fields
	// Using safe defaults until schema is extended
	return (
		<>
			<img
				src={mediaUrl}
				alt="Hero background"
				className={cn("absolute inset-0 w-full h-full object-cover", className)}
				style={{
					objectFit: "cover",
					objectPosition: "50% 50%",
				}}
				onLoad={handleLoad}
				onError={handleError}
			/>
			<div className="absolute inset-0 bg-black/40" />
		</>
	);
});
