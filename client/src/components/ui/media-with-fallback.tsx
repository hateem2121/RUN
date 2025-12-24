/**
 * Media Component with Replit Object Storage Fallback
 * Handles media loading failures using Replit's native infrastructure
 */

import { AlertCircle, ImageIcon, VideoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MediaWithFallbackProps {
	src: string;
	alt: string;
	type: "image" | "video";
	className?: string;
	onError?: () => void;
	onLoad?: () => void;
	poster?: string;
}

interface MediaPlaceholderProps {
	type: "image" | "video";
	className?: string;
	error?: string;
}

function MediaPlaceholder({ type, className, error }: MediaPlaceholderProps) {
	return (
		<div
			className={cn(
				"bg-gray-100 flex flex-col items-center justify-center p-8 rounded-lg",
				className,
			)}
		>
			{type === "image" ? (
				<ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
			) : (
				<VideoIcon className="h-12 w-12 text-gray-400 mb-2" />
			)}
			<p className="text-sm text-gray-500 text-center">
				{error ? "Media failed to load" : "Loading..."}
			</p>
			{error && (
				<div className="mt-2 flex items-center gap-1 text-xs text-red-500">
					<AlertCircle className="h-3 w-3" />
					<span>Try refreshing the page</span>
				</div>
			)}
		</div>
	);
}

export function MediaWithFallback({
	src,
	alt,
	type,
	className,
	onError,
	onLoad,
	poster,
}: MediaWithFallbackProps) {
	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [retryCount, setRetryCount] = useState(0);

	const maxRetries = 2;

	// Reset error state when src changes
	useEffect(() => {
		setHasError(false);
		setIsLoading(true);
		setRetryCount(0);
	}, [src]);

	const handleError = () => {
		if (retryCount < maxRetries) {
			// Retry with cache busting
			const retryUrl = `${src}${src.includes("?") ? "&" : "?"}retry=${retryCount + 1}`;
			setRetryCount((prev) => prev + 1);

			// For images, try to reload
			if (type === "image") {
				const img = new Image();
				img.onload = () => {
					setHasError(false);
					setIsLoading(false);
					onLoad?.();
				};
				img.onerror = () => {
					if (retryCount >= maxRetries - 1) {
						setHasError(true);
						setIsLoading(false);
						onError?.();
					}
				};
				img.src = retryUrl;
				return;
			}
		}

		setHasError(true);
		setIsLoading(false);
		onError?.();
	};

	const handleLoad = () => {
		setIsLoading(false);
		setHasError(false);
		onLoad?.();
	};

	// Show placeholder while loading or on error
	if (isLoading && hasError) {
		return (
			<MediaPlaceholder
				type={type}
				className={className}
				error="Failed to load"
			/>
		);
	}

	if (hasError) {
		return (
			<MediaPlaceholder
				type={type}
				className={className}
				error="Failed to load"
			/>
		);
	}

	// Render actual media
	if (type === "video") {
		return (
			<video
				className={className}
				onError={handleError}
				onLoadedData={handleLoad}
				poster={poster}
				controls
				preload="metadata"
				playsInline
			>
				<source src={src} />
				Your browser does not support video playback.
			</video>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			className={className}
			onError={handleError}
			onLoad={handleLoad}
			loading="lazy"
		/>
	);
}
