import type { MediaAsset } from "@shared/schema";
import { lazy, memo, Suspense, useMemo } from "react";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";

interface NavigationIconProps {
	iconType: "media" | "fallback";
	mediaIcon?: MediaAsset;
	fallbackIcon?: string;
	className?: string;
	useAbsolutePositioning?: boolean; // for floating dock vs admin display
}

// Define the type for the glob import module
type IconModule = { default: React.ComponentType<{ className?: string }> };

// Use import.meta.glob with a relative path to the project root's node_modules.
// Relative path from client/src/components/navigation/navigation-icon.tsx to node_modules/
const iconModules = import.meta.glob<IconModule>(
	"../../../../node_modules/@tabler/icons-react/dist/esm/icons/*.mjs",
);

// @ts-expect-error: Implicit any for @tabler/icons-react module
const DefaultHomeIcon = lazy(
	() => import("@tabler/icons-react/dist/esm/icons/IconHome.mjs"),
);

export const NavigationIcon = memo(function NavigationIcon({
	iconType,
	mediaIcon,
	fallbackIcon,
	className = "h-full w-full",
	useAbsolutePositioning = true,
}: NavigationIconProps) {
	// Get optimized media URL for navigation icons
	const { urls } = useOptimizedMedia(mediaIcon?.id || 0, {
		width: 80,
		quality: 90,
		format: "webp",
	});

	// Memoize the lazy component
	const LazyIconComponent = useMemo(() => {
		if (iconType === "fallback" && fallbackIcon) {
			// Construct the key matching the glob pattern
			const path = `../../../../node_modules/@tabler/icons-react/dist/esm/icons/${fallbackIcon}.mjs`;
			const loader = iconModules[path];

			if (loader) {
				return lazy(loader);
			} else {
				return null; // Will fallback to DefaultHomeIcon in render
			}
		}
		return null;
	}, [iconType, fallbackIcon]);

	if (iconType === "media" && mediaIcon) {
		if (useAbsolutePositioning) {
			// For floating dock - uses absolute positioning to fill entire container
			return (
				<div className="absolute inset-0 rounded-full overflow-hidden">
					<img
						src={
							urls?.small ||
							mediaIcon.url ||
							(mediaIcon.id && mediaIcon.id < 1000000000000
								? `/api/media/${mediaIcon.id}/content`
								: undefined)
						}
						alt={mediaIcon.originalName || ""}
						className="w-full h-full"
						style={{
							objectFit: "cover",
							objectPosition: "center",
							imageRendering: "crisp-edges",
						}}
					/>
				</div>
			);
		} else {
			// For admin display - stays within container bounds
			return (
				<div className="w-full h-full rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
					<img
						src={
							urls?.small ||
							mediaIcon.url ||
							(mediaIcon.id && mediaIcon.id < 1000000000000
								? `/api/media/${mediaIcon.id}/content`
								: undefined)
						}
						alt={mediaIcon.originalName || ""}
						className="w-full h-full"
						style={{
							objectFit: "cover",
							objectPosition: "center",
							imageRendering: "crisp-edges",
						}}
					/>
				</div>
			);
		}
	}

	const commonClasses = `${className} text-neutral-500 dark:text-neutral-300`;

	const Loader = (
		<div
			className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded ${className}`}
		/>
	);

	if (LazyIconComponent) {
		return (
			<Suspense fallback={Loader}>
				<LazyIconComponent className={commonClasses} />
			</Suspense>
		);
	}

	// Default fallback
	return (
		<Suspense fallback={Loader}>
			<DefaultHomeIcon className={commonClasses} />
		</Suspense>
	);
});
