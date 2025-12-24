/**
 * Lazy Media Image Component - Optimized image loading with intersection observer
 * Phase 1 Optimization: Smart image loading for homepage performance
 */

import type { MediaAsset } from "@shared/schema";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getOptimizedMediaUrl } from "@/lib/homepage-media-loader";
import { cn } from "@/lib/utils";

interface LazyMediaImageProps {
	asset: MediaAsset;
	alt?: string;
	className?: string;
	style?: React.CSSProperties;
	priority?: boolean; // Load immediately without intersection observer
	onLoad?: () => void;
	onError?: (error: Error) => void;
	placeholderClassName?: string;
}

export function LazyMediaImage({
	asset,
	alt,
	className,
	style,
	priority = false,
	onLoad,
	onError,
	placeholderClassName = "bg-gray-200 dark:bg-gray-800 animate-pulse",
}: LazyMediaImageProps) {
	const [isLoaded, setIsLoaded] = useState(false);
	const [isInView, setIsInView] = useState(priority); // Load immediately if priority
	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Intersection observer for lazy loading
	useEffect(() => {
		if (
			priority ||
			isInView ||
			typeof window === "undefined" ||
			!("IntersectionObserver" in window)
		) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !isInView) {
						setIsInView(true);
						observer.disconnect();
					}
				});
			},
			{
				rootMargin: "50px", // Start loading 50px before becoming visible
				threshold: 0.1,
			},
		);

		if (containerRef.current) {
			observer.observe(containerRef.current);
		}

		return () => {
			observer.disconnect();
		};
	}, [priority, isInView]);

	// Handle image loading
	const handleImageLoad = useCallback(() => {
		setIsLoaded(true);
		setIsLoading(false);
		setHasError(false);
		onLoad?.();
	}, [asset.id, asset.originalName, onLoad]);

	const handleImageError = useCallback(() => {
		setHasError(true);
		setIsLoading(false);
		const error = new Error(
			`Failed to load image asset ${asset.id}: ${asset.originalName}`,
		);
		onError?.(error);
	}, [asset.id, asset.originalName, onError]);

	// Start loading when in view
	useEffect(() => {
		if (isInView && !isLoaded && !isLoading && !hasError) {
			setIsLoading(true);
		}
	}, [isInView, isLoaded, isLoading, hasError]);

	// Generate optimized URL
	const imageUrl = getOptimizedMediaUrl(asset, !priority);

	if (!imageUrl) {
		return (
			<div
				ref={containerRef}
				className={cn(
					"flex items-center justify-center text-gray-400",
					placeholderClassName,
					className,
				)}
				style={style}
			>
				<span className="text-sm">No image</span>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={cn("relative overflow-hidden", className)}
			style={style}
		>
			{/* Loading placeholder */}
			{!isLoaded && (
				<div
					className={cn(
						"absolute inset-0 flex items-center justify-center",
						placeholderClassName,
					)}
				>
					{isLoading && (
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
					)}
					{hasError && (
						<span className="text-sm text-red-500">Failed to load</span>
					)}
				</div>
			)}

			{/* Actual image - only render when in view */}
			{isInView && (
				<img
					ref={imgRef}
					src={imageUrl}
					alt={alt || asset.originalName || "Media asset"}
					className={cn(
						"transition-opacity duration-300",
						isLoaded ? "opacity-100" : "opacity-0",
						className,
					)}
					style={style}
					onLoad={handleImageLoad}
					onError={handleImageError}
					loading={priority ? "eager" : "lazy"}
					decoding="async"
				/>
			)}
		</div>
	);
}
