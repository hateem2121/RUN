import type { MediaAsset } from "@shared/schema";
import { Box, Loader2 } from "lucide-react";
import React from "react";
import { ModelViewerErrorBoundary } from "@/components/ui/ModelViewerErrorBoundary";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Typography } from "@/components/ui/typography";
import { ensureModelViewerLoaded } from "@/lib/model-viewer-loader";
import { useIntersectionObserver } from "@/lib/performance-intersection-observer";
import { cn } from "@/lib/utils";

// Lazy load UnifiedModelViewer
const UnifiedModelViewer = React.lazy(() =>
  import("@/components/ui/UnifiedModelViewer").then((m) => ({ default: m.UnifiedModelViewer })),
);

export interface InteractiveExperienceSectionProps {
  media: MediaAsset | null;
  className?: string;
  version?: string;
}

function OptimizedTechnologyHero({ media }: { media: MediaAsset }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [shouldLoadModel, setShouldLoadModel] = React.useState(false);
  const [userRequestedLoad, setUserRequestedLoad] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const autoLoadTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    ensureModelViewerLoaded().catch((e) => {
      console.error(e);
    });
  }, []);

  const { isIntersecting } = useIntersectionObserver(containerRef, {
    threshold: 0.1,
    rootMargin: "50px",
    triggerOnce: false,
  });

  React.useEffect(() => {
    if (userRequestedLoad && !shouldLoadModel) {
      setShouldLoadModel(true);
      if (autoLoadTimerRef.current) {
        clearTimeout(autoLoadTimerRef.current);
        autoLoadTimerRef.current = null;
      }
    }
  }, [userRequestedLoad, shouldLoadModel]);

  React.useEffect(() => {
    if (media.type === "3d_model" && isIntersecting && !userRequestedLoad && !shouldLoadModel) {
      autoLoadTimerRef.current = setTimeout(() => {
        setShouldLoadModel(true);
      }, 2000);

      return () => {
        if (autoLoadTimerRef.current) {
          clearTimeout(autoLoadTimerRef.current);
          autoLoadTimerRef.current = null;
        }
      };
    } else if (media.type !== "3d_model" && isIntersecting && !shouldLoadModel) {
      setShouldLoadModel(true);
    }
    return undefined;
  }, [media.type, isIntersecting, userRequestedLoad, shouldLoadModel]);

  React.useEffect(() => {
    if (shouldLoadModel && media.type === "3d_model") {
      setIsLoading(true);
      const loadTimer = setTimeout(() => {
        setIsLoading(false);
      }, 4000);

      return () => clearTimeout(loadTimer);
    }
    return undefined;
  }, [shouldLoadModel, media.type]);

  const posterUrl = media.thumbnailFilename
    ? media.thumbnailFilename && media.id < 1000000000000
      ? `/api/media/${media.id}/content`
      : undefined
    : media.id && media.id < 1000000000000
      ? `/api/media/${media.id}/content?thumbnail=true`
      : undefined;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/5] md:aspect-[16/9] bg-black/40 rounded-lg overflow-hidden group border border-white/10 shadow-inner"
    >
      {/* 3D Model specific hints matching Stitch design */}
      {media.type === "3d_model" && (
        <div className="absolute top-4 left-4 md:top-8 md:left-8 z-30">
          <div className="flex flex-col gap-2 bg-black/60 p-3 rounded backdrop-blur-md border border-white/10 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse bg-[#00D4FF]"></div>
              <span className="text-[10px] text-[#00D4FF] font-mono uppercase tracking-widest font-bold">
                Model: Active
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono uppercase">Interactive Demo</span>
          </div>
        </div>
      )}

      {/* Decorative center target/crosshair overlay when not active */}
      {!shouldLoadModel && media.type === "3d_model" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
          <div className="absolute top-1/2 left-1/4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block">
            <div className="w-32 h-32 border border-[#00D4FF]/30 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 border border-[#00D4FF]/50 rounded-full"></div>
            </div>
          </div>
          {/* Center Icon */}
          <div className="text-center z-20">
            <span className="material-symbols-outlined text-6xl text-white/20 block mb-4">
              view_in_ar
            </span>
          </div>
        </div>
      )}

      {media.type === "3d_model" ? (
        <div className="relative w-full h-full">
          {/* Progressive enhancement overlay */}
          {!shouldLoadModel && (
            <div className="z-modal bg-black/60 absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="bg-[#00D4FF]/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#00D4FF]/30">
                <Box className="h-8 w-8 text-[#00D4FF]" />
              </div>
              <Typography.P className="mb-2 font-medium text-white tracking-widest uppercase text-sm">
                Interactive 3D Engine
              </Typography.P>
              <Typography.P className="text-white/60 mb-6 text-xs font-mono">
                {isIntersecting ? "INITIALIZING SUBSYSTEMS..." : "SCROLL TO ACTIVATE"}
              </Typography.P>
              <button
                onClick={() => setUserRequestedLoad(true)}
                className="bg-white/10 border border-white/20 hover:border-[#00D4FF] hover:bg-[#00D4FF]/10 text-white rounded-sm px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300"
              >
                Engage Viewer
              </button>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && shouldLoadModel && (
            <div className="z-modal-backdrop absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
              <Loader2 className="text-[#00D4FF] mb-4 h-10 w-10 animate-spin" />
              <Typography.P className="mb-2 text-xs font-mono font-bold tracking-widest text-white uppercase">
                Loading Assets...
              </Typography.P>
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-[#00D4FF] w-1/2 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Model Viewer */}
          {shouldLoadModel && (
            <ModelViewerErrorBoundary asset={media}>
              <React.Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center bg-black/40">
                    <Loader2 className="text-[#00D4FF] h-8 w-8 animate-spin" />
                  </div>
                }
              >
                <UnifiedModelViewer
                  asset={{
                    ...media,
                    id: typeof media.id === "number" ? media.id : 0,
                    filename: media.filename || "technology_demo.gltf",
                    originalName: media.filename || "Technology Hero 3D Model",
                    mimeType: "model/gltf+json",
                    type: "3d_model" as const,
                    url: media.url || `/api/media/${media.id || 0}/content`,
                    altText: media.altText || "Technology Interactive Display",
                    metadata: media.metadata || {},
                    tags: media.tags || [],
                    deletedAt: null,
                    folderId: null,
                    caption: null,
                  }}
                  config={{
                    cameraControls: true,
                    autoRotate: true,
                    backgroundColorHex: "transparent",
                    shadowIntensity: 1,
                    exposure: 1,
                  }}
                  className="h-full w-full transition-opacity duration-500"
                />
              </React.Suspense>
            </ModelViewerErrorBoundary>
          )}

          {/* Controls overlay matched to stitch */}
          <div className="absolute bottom-4 md:bottom-8 left-0 right-0 text-center z-30 px-4 pointer-events-none">
            <div className="inline-flex items-center gap-4 md:gap-6 px-4 md:px-6 py-2 md:py-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg max-w-full overflow-x-auto pointer-events-auto">
              <div className="flex items-center gap-2 whitespace-nowrap text-white/70">
                <span className="material-symbols-outlined text-[#00D4FF] text-sm md:text-base">
                  360
                </span>
                <span className="text-[10px] md:text-xs uppercase tracking-wide font-bold">
                  Rotate
                </span>
              </div>
              <div className="w-px h-3 md:h-4 bg-white/20"></div>
              <div className="flex items-center gap-2 whitespace-nowrap text-white/70">
                <span className="material-symbols-outlined text-[#00D4FF] text-sm md:text-base">
                  zoom_in
                </span>
                <span className="text-[10px] md:text-xs uppercase tracking-wide font-bold">
                  Zoom
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : media.type === "video" ? (
        <video
          src={
            media.url ||
            (media.id && media.id < 1000000000000 ? `/api/media/${media.id}/content` : undefined)
          }
          poster={posterUrl}
          autoPlay
          loop
          muted
          className="h-full w-full object-cover opacity-80"
        />
      ) : (
        <OptimizedImage
          mediaId={media.id}
          src={media.url || undefined}
          alt="Technology Hero Display"
          imageClassName="h-full w-full object-cover opacity-80"
          className="h-full w-full"
          priority={false}
        />
      )}
    </div>
  );
}

export function InteractiveExperienceSection({
  media,
  className,
  version = "v.4.2.0",
}: InteractiveExperienceSectionProps) {
  if (!media) return null;

  return (
    <section className={cn("py-24 px-4 sm:px-6 max-w-7xl mx-auto relative", className)}>
      <div className="bg-black/40 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-4 sm:p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-6 left-6 text-[10px] font-mono text-white/40 tracking-wider">
          MODULE: 3D-VIEW
        </div>

        {/* Radial glow behind viewer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00D4FF]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-white/10 pb-6 gap-4 pt-10 sm:pt-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-tight">
            Interactive <span className="text-[#00D4FF]">Experience</span>
          </h2>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-[#00D4FF] border border-[#00D4FF]/30 px-3 py-1 rounded font-mono bg-[#00D4FF]/10">
              {version}
            </span>
            <span className="text-[10px] text-white/50 font-mono uppercase hidden sm:inline-block">
              3D Viewer Module
            </span>
          </div>
        </div>

        <div className="bg-black/60 p-2 md:p-4 rounded-2xl relative border border-white/10 z-10">
          <OptimizedTechnologyHero media={media} />
        </div>
      </div>
    </section>
  );
}
