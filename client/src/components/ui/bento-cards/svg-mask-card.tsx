import { memo, useEffect, useState } from "react";

// import { motion } from "framer-motion";
// import { EnhancedBentoCardErrorBoundary } from "./enhanced-error-boundary";
// import { LoadingState } from "./enhanced-loading-states";
// import { AnimatedCardWrapper, ImageLoadAnimation } from "./enhanced-animations";

interface SvgMaskCardProps {
	title: string;
	description: string;
	// Enhanced dual media props
	maskSvgUrl?: string | null; // New: Custom SVG mask file
	contentMediaUrl?: string | null; // New: Content media (video/image)
	// Legacy support
	mediaUrl?: string | null; // Backward compatibility
	link?: string;
}

const SvgMaskCard = memo(function SvgMaskCard({
	title,
	// description,
	maskSvgUrl,
	contentMediaUrl,
	mediaUrl,
	link,
}: SvgMaskCardProps) {
	const [hasError, setHasError] = useState(false);
	const [contentLoadError, setContentLoadError] = useState(false);
	const [isLoadingMask, setIsLoadingMask] = useState(false);
	// const [isContentLoaded, setIsContentLoaded] = useState(false);
	const [contentType, setContentType] = useState<"image" | "video" | "unknown">(
		"unknown",
	);

	// Default SVG mask to prevent undefined errors
	const getDefaultSvgMask = () => {
		return "url(\"data:image/svg+xml,%3Csvg width='221' height='122' viewBox='0 0 221 122' fill='none' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMidYMid slice'%3E%3Cpath fillRule='evenodd' clipRule='evenodd' d='M183 4C183 1.79086 184.791 0 187 0H217C219.209 0 221 1.79086 221 4V14V28V99C221 101.209 219.209 103 217 103H182C179.791 103 178 104.791 178 107V118C178 120.209 176.209 122 174 122H28C25.7909 122 24 120.209 24 118V103V94V46C24 43.7909 22.2091 42 20 42H4C1.79086 42 0 40.2091 0 38V18C0 15.7909 1.79086 14 4 14H24H43H179C181.209 14 183 12.2091 183 10V4Z' fill='%23D9D9D9'/%3E%3C/svg%3E%0A\")";
	};

	// Initialize svgMaskDataUri with default mask to prevent undefined errors
	const [svgMaskDataUri, setSvgMaskDataUri] = useState<string>(
		getDefaultSvgMask(),
	);

	// Determine actual content media URL (new field takes priority over legacy)
	const actualContentMediaUrl = contentMediaUrl || mediaUrl;

	// HTTP-driven content type detection
	useEffect(() => {
		if (!actualContentMediaUrl) return;

		fetch(actualContentMediaUrl, { method: "HEAD" })
			.then((r) => {
				const ct = r.headers.get("content-type");
				if (ct?.startsWith("video")) setContentType("video");
				else if (ct?.startsWith("image")) setContentType("image");
				else setContentType("unknown");
			})
			.catch(() => setContentType("unknown"));
	}, [actualContentMediaUrl]);

	// ENHANCED DUAL MEDIA SYSTEM: Parallel loading with intelligent caching
	useEffect(() => {
		const loadSvgMask = async () => {
			if (!maskSvgUrl) {
				setSvgMaskDataUri(getDefaultSvgMask());
				setIsLoadingMask(false);
				return;
			}

			setIsLoadingMask(true);
			setHasError(false);

			// Check cache first for faster performance
			const cacheKey = `svg-mask-${maskSvgUrl}`;
			const cached = sessionStorage.getItem(cacheKey);

			if (cached) {
				try {
					const parsedCache = JSON.parse(cached);
					// Check if cache is still valid (1 hour TTL)
					if (Date.now() - parsedCache.timestamp < parsedCache.ttl) {
						setSvgMaskDataUri(parsedCache.dataUri);
						setIsLoadingMask(false);
						return;
					}
				} catch {
					// Fallback to raw cached value
					setSvgMaskDataUri(cached);
					setIsLoadingMask(false);
					return;
				}
			}

			try {
				// Fetch with timeout and enhanced error handling
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

				const response = await fetch(maskSvgUrl, {
					signal: controller.signal,
					headers: {
						"Cache-Control": "max-age=3600", // Cache for 1 hour
					},
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`Failed to fetch SVG: ${response.status}`);
				}

				const svgText = await response.text();

				if (!svgText || svgText.trim() === "") {
					throw new Error("Empty SVG content");
				}

				// Create optimized data URI from SVG content with preserveAspectRatio
				const svgWithAspectRatio = svgText.replace(
					"<svg ",
					'<svg preserveAspectRatio="xMidYMid slice" ',
				);
				const encodedSvg = encodeURIComponent(svgWithAspectRatio);
				const dataUri = `url("data:image/svg+xml,${encodedSvg}")`;

				// Cache the processed data URI with expiration
				const cacheData = {
					dataUri,
					timestamp: Date.now(),
					ttl: 3600000, // 1 hour TTL
				};
				sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

				setSvgMaskDataUri(dataUri);
				setIsLoadingMask(false);
			} catch (error) {
				// Fallback to default mask
				const defaultMask = getDefaultSvgMask();
				setSvgMaskDataUri(defaultMask);
				// Cache the default mask for this URL to prevent repeated failures
				sessionStorage.setItem(
					cacheKey,
					JSON.stringify({
						dataUri: defaultMask,
						timestamp: Date.now(),
						ttl: 3600000,
					}),
				);
				setIsLoadingMask(false);
				setHasError(true);
			}
		};

		loadSvgMask();
	}, [maskSvgUrl]);

	// PARALLEL CONTENT MEDIA PRELOADING for enhanced performance
	useEffect(() => {
		if (!actualContentMediaUrl) return;

		const preloadContentMedia = async () => {
			try {
				if (contentType === "video") {
					// Preload video metadata with enhanced error handling
					const video = document.createElement("video");
					video.preload = "metadata";
					video.src = actualContentMediaUrl;
					video.onloadedmetadata = () => {};
					video.onerror = () => {
						setContentLoadError(true);
						// Don't spam the console with errors, just handle gracefully
					};
				} else if (contentType === "image") {
					// Preload image
					const img = new Image();
					img.onload = () => {};
					img.onerror = () => {
						setContentLoadError(true);
					};
					img.src = actualContentMediaUrl;
				}
			} catch (error) {
				setContentLoadError(true);
			}
		};

		preloadContentMedia();
	}, [actualContentMediaUrl, contentType]);

	const handleContentError = () => {
		setContentLoadError(true);
	};

	// const handleGeneralError = () => {
	//   setHasError(true);
	// };

	// Show loading state while SVG mask is being processed
	if (isLoadingMask) {
		return (
			<section
				className="relative w-full bg-gray-100"
				style={{ minHeight: "300px", height: "auto", maxHeight: "600px" }}
			>
				<div className="w-full h-full flex items-center justify-center">
					<div className="text-center text-gray-500">
						<div className="text-sm">Loading mask...</div>
						<div className="text-xs mt-1">
							{maskSvgUrl ? "Processing custom SVG" : "Using default mask"}
						</div>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section
			className="relative w-full flex flex-col"
			style={{
				minHeight: "300px",
				height: "auto",
				maxHeight: "600px",
				backgroundColor:
					hasError || contentLoadError
						? "#f3f4f6"
						: actualContentMediaUrl
							? "transparent"
							: "transparent",
				maskImage: svgMaskDataUri,
				WebkitMaskImage: svgMaskDataUri,
				maskRepeat: "no-repeat",
				WebkitMaskRepeat: "no-repeat",
				maskSize: "contain",
				WebkitMaskSize: "contain",
				maskPosition: "center",
				WebkitMaskPosition: "center",
			}}
			role="region"
			aria-label={`Masked media: ${title || "Category content"}`}
		>
			{/* Error state */}
			{(hasError || contentLoadError) && (
				<div className="w-full h-full flex items-center justify-center bg-gray-100">
					<div className="text-center text-gray-500">
						<div className="text-sm font-medium">
							{hasError ? "Media configuration error" : "Content not found"}
						</div>
						<div className="text-xs">{title}</div>
						{maskSvgUrl && contentMediaUrl && (
							<div className="text-xs mt-1 space-y-1">
								<div>🎭 Mask: {maskSvgUrl ? "Custom SVG" : "Default"}</div>
								<div>🎬 Content: {contentLoadError ? "Failed" : "Loading"}</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Video content */}
			{!hasError &&
				!contentLoadError &&
				(contentType === "video" || contentType === "unknown") &&
				actualContentMediaUrl && (
					<video
						autoPlay
						muted
						loop
						playsInline
						className="w-full h-full object-cover"
						style={{ minHeight: "300px", height: "auto", maxHeight: "600px" }}
						onError={handleContentError}
						// onLoadStart={() => setIsContentLoaded(true)}
						// onLoadedData={() => setIsContentLoaded(true)}
						// onPlaying={() => setIsContentLoaded(true)}
						// onPause={() => setIsContentLoaded(true)}
					>
						<source src={actualContentMediaUrl} type="video/mp4" />
						Your browser does not support the video tag.
					</video>
				)}

			{/* Image content */}
			{!hasError &&
				!contentLoadError &&
				contentType === "image" &&
				actualContentMediaUrl && (
					<img
						src={actualContentMediaUrl}
						alt={title || "Category content"}
						className="w-full h-full object-cover"
						style={{ minHeight: "300px", height: "auto", maxHeight: "600px" }}
						onError={handleContentError}
					/>
				)}

			{/* Fallback content when no media is available */}
			{!hasError && !contentLoadError && !actualContentMediaUrl && (
				<div className="w-full h-full flex items-center justify-center bg-gray-100">
					<div className="text-center text-gray-500">
						<div className="text-sm font-medium">No media content</div>
						<div className="text-xs">{title}</div>
						<div className="text-xs mt-1">
							🎭 Mask: {maskSvgUrl ? "Custom SVG" : "Default"}
						</div>
					</div>
				</div>
			)}

			{/* Click handler */}
			{link && (
				<a
					href={link}
					className="absolute inset-0 z-20"
					aria-label={`View ${title}`}
					onClick={(e) => {
						e.preventDefault();
						window.location.href = link;
					}}
				/>
			)}
		</section>
	);
});

export default SvgMaskCard;
