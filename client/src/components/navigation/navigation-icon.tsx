import { memo } from "react";
import { MediaAsset } from "@shared/schema";
import * as TablerIcons from "@tabler/icons-react";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";

interface NavigationIconProps {
  iconType: "media" | "fallback";
  mediaIcon?: MediaAsset;
  fallbackIcon?: string;
  className?: string;
  useAbsolutePositioning?: boolean; // for floating dock vs admin display
}

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

  if (iconType === "fallback" && fallbackIcon) {
    // Get the icon component from Tabler Icons
    const IconComponent = (TablerIcons as any)[fallbackIcon];

    if (IconComponent) {
      return <IconComponent className={`${className} text-neutral-500 dark:text-neutral-300`} />;
    }
  }

  // Default fallback icon if nothing is configured
  const DefaultIcon = TablerIcons.IconHome;
  return <DefaultIcon className={`${className} text-neutral-500 dark:text-neutral-300`} />;
});
