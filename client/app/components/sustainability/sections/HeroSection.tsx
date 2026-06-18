import type { MediaAsset } from "@shared/index";
import { OptimizedImage } from "@/components/ui/optimized-image";

/**
 * Optimized hero background media component for the sustainability page.
 * Supports both video and image backgrounds with proper overlays.
 */
export function OptimizedSustainabilityHero({ media }: { media: MediaAsset }) {
  return (
    <div className="absolute inset-0 min-h-full">
      {media.type === "video" ? (
        <video
          src={
            media.url ||
            (media.id && media.id < 1000000000000 ? `/api/media/${media.id}/content` : undefined)
          }
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <OptimizedImage
          mediaId={media.id}
          src={media.url || undefined}
          alt="Sustainability hero background"
          imageClassName="h-full w-full object-cover"
          className="h-full w-full"
          priority={true}
          sizes="100vw"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-b from-black/60 to-custom-color-235/40" />
    </div>
  );
}
