/**
 * Enhanced LazyMedia Component with CDN Integration
 * Replaces LazyMedia to use OptimizedImage for better performance
 */

import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LazyMediaEnhancedProps {
	mediaId: number;
	alt: string;
	className?: string;
	priority?: boolean;
	quality?: number;
	onLoad?: () => void;
	onError?: (error: Error) => void;
}

export function LazyMediaEnhanced({
	mediaId,
	alt,
	className,
	priority = false,
	quality = 85,
	onLoad,
}: // onError
LazyMediaEnhancedProps) {
	const [isInView, setIsInView] = useState(priority);
	const [isLoading, setIsLoading] = useState(!priority);
	const [isLoaded, setIsLoaded] = useState(false);
	const [hasError, setHasError] = useState(false);
	const mediaRef = useRef<HTMLDivElement>(null);

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

		if (mediaRef.current) {
			observer.observe(mediaRef.current);
		}

		return () => {
			observer.disconnect();
		};
	}, [priority, isInView]);

	// Handle media loading events
	const handleMediaLoad = useCallback(() => {
		setIsLoaded(true);
		setIsLoading(false);
		setHasError(false);
		onLoad?.();
	}, [mediaId, onLoad]);

	// const handleMediaError = useCallback((error: Error) => {
	//   setHasError(true);
	//   setIsLoading(false);
	//    console.error('[LazyMediaEnhanced] CDN loading error:', error);
	//   onError?.(error);
	// }, [onError]);

	// Start loading when in view
	useEffect(() => {
		if (isInView && !isLoaded && !isLoading && !hasError) {
			setIsLoading(true);
		}
	}, [isInView, isLoaded, isLoading, hasError]);

	return (
		<div ref={mediaRef} className={cn("relative", className)}>
			{isInView ? (
				<>
					{/* Use OptimizedImage for CDN benefits */}
					<OptimizedImage
						mediaId={mediaId}
						alt={alt}
						quality={quality}
						priority={priority}
						className={cn(
							"w-full h-full object-cover transition-opacity duration-300",
							isLoading ? "opacity-0" : "opacity-100",
						)}
						onLoad={handleMediaLoad}
					/>

					{/* Loading state */}
					{isLoading && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
							<Skeleton className="w-full h-full" />
						</div>
					)}

					{/* Error state */}
					{hasError && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-50 border border-gray-200">
							<div className="text-center p-4">
								<AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
								<p className="text-xs text-gray-500">CDN Loading Failed</p>
								<p className="text-xs text-gray-400 mt-1">
									Media ID: {mediaId}
								</p>
							</div>
						</div>
					)}
				</>
			) : (
				/* Placeholder when not in view */
				<div className="w-full h-full bg-gray-100 flex items-center justify-center">
					<Skeleton className="w-full h-full" />
				</div>
			)}
		</div>
	);
}

export default LazyMediaEnhanced;
