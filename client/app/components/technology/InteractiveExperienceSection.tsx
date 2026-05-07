import type { MediaAsset } from "@shared/index";
import { gsap } from "@/lib/gsap";
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
      className="relative w-full h-full min-h-[600px] bg-slate-100 dark:bg-[#0A0A0A] overflow-hidden group border border-slate-200 dark:border-white/[0.08] shadow-emboss-deep"
    >
      {/* Corner bracket overlays — Cobalt */}
      <div className="absolute top-4 left-4 w-4 h-4 border-l border-t border-[#0047AB] dark:border-[#00D4FF] dark:shadow-[0_0_5px_#00D4FF] z-20"></div>
      <div className="absolute top-4 right-4 w-4 h-4 border-r border-t border-[#0047AB] dark:border-[#00D4FF] dark:shadow-[0_0_5px_#00D4FF] z-20"></div>
      <div className="absolute bottom-4 left-4 w-4 h-4 border-l border-b border-[#0047AB] dark:border-[#00D4FF] dark:shadow-[0_0_5px_#00D4FF] z-20"></div>
      <div className="absolute bottom-4 right-4 w-4 h-4 border-r border-b border-[#0047AB] dark:border-[#00D4FF] dark:shadow-[0_0_5px_#00D4FF] z-20"></div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-arctic dark:bg-grid-tech opacity-40 dark:opacity-20 pointer-events-none mix-blend-overlay z-10"></div>
      <div className="absolute inset-0 shadow-inner-glow pointer-events-none z-10"></div>

      {/* Floating annotation pin */}
      <div className="absolute top-1/3 right-1/4 z-30 hidden md:block">
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur p-3 border border-[#0047AB] dark:border-[#00D4FF] shadow-lg dark:shadow-[0_0_15px_rgba(0,212,255,0.3)] rounded-sm animate-pulse">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full dark:shadow-[0_0_5px_red]"></div>
            <span className="text-[9px] text-[#0047AB] dark:text-[#00D4FF] font-bold font-mono uppercase tracking-tighter">
              High Tension
            </span>
          </div>
          <span className="text-[9px] text-black dark:text-white font-mono block">PSI: 14.2</span>
        </div>
        <div className="w-px h-8 bg-[#0047AB] dark:bg-[#00D4FF] mx-auto opacity-50 dark:opacity-70 dark:shadow-[0_0_5px_#00D4FF]"></div>
      </div>

      {/* HUD micro-copy left side */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2 hidden md:block z-30 pointer-events-none">
        <span className="micro-copy opacity-40 dark:text-[#00D4FF] -rotate-90 origin-left whitespace-nowrap block text-[10px] tracking-widest font-mono uppercase">
          ANALYSIS_GRID_V.9.4
        </span>
      </div>

      {media.type === "3d_model" ? (
        <div className="relative w-full h-full">
          {/* Progressive enhancement overlay */}
          {!shouldLoadModel && (
            <div className="z-modal bg-white/60 dark:bg-[#0A0A0A]/60 absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="bg-[#0047AB]/10 dark:bg-[#00D4FF]/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#0047AB]/20 dark:border-[#00D4FF]/30">
                <Box className="h-8 w-8 text-[#0047AB] dark:text-[#00D4FF]" />
              </div>
              <Typography.P className="mb-2 font-medium text-slate-900 dark:text-white tracking-widest uppercase text-sm">
                Interactive 3D Engine
              </Typography.P>
              <Typography.P className="text-slate-500 mb-6 text-xs font-mono">
                {isIntersecting ? "INITIALIZING SUBSYSTEMS..." : "SCROLL TO ACTIVATE"}
              </Typography.P>
              <button
                type="button"
                onClick={() => setUserRequestedLoad(true)}
                className="bg-[#0047AB] dark:bg-[#00D4FF] hover:bg-[#002F75] dark:hover:bg-white text-white dark:text-black rounded-sm px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md shadow-[#0047AB]/20 dark:shadow-[#00D4FF]/20"
              >
                Engage Viewer
              </button>
            </div>
          )}

          {/* Loading Overlay */}
          {isLoading && shouldLoadModel && (
            <div className="z-modal-backdrop absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-md">
              <Loader2 className="text-[#0047AB] dark:text-[#00D4FF] mb-4 h-10 w-10 animate-spin" />
              <Typography.P className="mb-2 text-xs font-mono font-bold tracking-widest text-slate-900 dark:text-white uppercase">
                Loading Assets...
              </Typography.P>
              <div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-[#0047AB] dark:bg-[#00D4FF] w-1/2 rounded-full animate-pulse dark:shadow-[0_0_8px_#00D4FF]"></div>
              </div>
            </div>
          )}

          {/* Model Viewer */}
          {shouldLoadModel && (
            <ModelViewerErrorBoundary asset={media}>
              <React.Suspense
                fallback={
                  <div className="flex h-full w-full items-center justify-center bg-black/40">
                    <Loader2 className="text-[#0047AB] dark:text-[#00D4FF] h-8 w-8 animate-spin" />
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
          className="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-[15s]"
        />
      ) : (
        <OptimizedImage
          mediaId={media.id}
          src={media.url || undefined}
          alt="Technology Hero Display"
          imageClassName="h-full w-full object-cover opacity-90 mix-blend-multiply group-hover:scale-105 transition-transform duration-[15s]"
          className="h-full w-full"
          priority={false}
        />
      )}

      {/* Bottom toolbar — rotate/zoom/fullscreen */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-30">
        <div className="flex items-center gap-1 bg-white dark:bg-black/80 border border-slate-200 dark:border-white/20 shadow-xl rounded-sm p-1 dark:backdrop-blur-md">
          <button
            type="button"
            className="p-2 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-400 hover:text-[#0047AB] dark:hover:text-[#00D4FF] transition-colors border-r border-slate-100 dark:border-white/10"
            aria-label="Rotate model"
          >
            <span className="material-symbols-outlined text-lg">rotate_right</span>
          </button>
          <button
            type="button"
            className="p-2 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-400 hover:text-[#0047AB] dark:hover:text-[#00D4FF] transition-colors border-r border-slate-100 dark:border-white/10"
            aria-label="Zoom in"
          >
            <span className="material-symbols-outlined text-lg">zoom_in</span>
          </button>
          <button
            type="button"
            className="p-2 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-400 hover:text-[#0047AB] dark:hover:text-[#00D4FF] transition-colors"
            aria-label="Fullscreen"
          >
            <span className="material-symbols-outlined text-lg">fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Active layer state type
type LayerOption = "active" | "compression" | "fiber" | "skeleton";

export function InteractiveExperienceSection({
  media,
  className,
  version = "v.4.2.0",
}: InteractiveExperienceSectionProps) {
  const [heatMapEnabled, setHeatMapEnabled] = React.useState(true);
  const [wireframeEnabled, setWireframeEnabled] = React.useState(false);
  const [activeLayer, setActiveLayer] = React.useState<LayerOption>("active");
  const sectionRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const statElements = sectionRef.current?.querySelectorAll(".stat-countup");
      if (!statElements?.length) return;

      statElements.forEach((el) => {
        const target = el.getAttribute("data-target") || "0";
        const suffix = el.getAttribute("data-suffix") || "";
        const prefix = el.getAttribute("data-prefix") || "";
        const numericValue = parseFloat(target.replace(/[^0-9.-]/g, ""));

        if (Number.isNaN(numericValue)) return;

        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none",
          },
          textContent: 0,
          duration: 1.5,
          ease: "power2.out",
          snap: { textContent: numericValue % 1 === 0 ? 1 : 0.1 },
          onUpdate: () => {
            const current = parseFloat(el.textContent || "0");
            el.textContent = `${prefix}${numericValue % 1 === 0 ? Math.round(current) : current.toFixed(1)}${suffix}`;
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (!media) return null;

  const layers: Array<{ id: LayerOption; label: string; icon: string; meta: string }> = [
    { id: "active", label: "Active View", icon: "checkroom", meta: "V.01" },
    { id: "compression", label: "Compression", icon: "accessibility_new", meta: "8MB" },
    { id: "fiber", label: "Micro-Fiber", icon: "texture", meta: "RAW" },
    { id: "skeleton", label: "Skeleton", icon: "schema", meta: "BONE" },
  ];

  return (
    <section ref={sectionRef} className={cn("py-32 px-6 max-w-7xl mx-auto", className)}>
      <div className="glass-panel p-2 rounded-2xl overflow-hidden border border-white dark:border-white/[0.08] shadow-2xl dark:shadow-neon-glow bg-white/60 dark:bg-white/[0.04] dark:backdrop-blur-xl">
        <div className="bg-white dark:bg-transparent rounded-xl p-6 md:p-10 border border-slate-100 dark:border-white/[0.08] relative overflow-hidden flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col justify-center items-center border-b border-slate-100 dark:border-white/10 pb-8 w-full text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
              <span className="tech-badge">Live View</span>
              <span className="micro-copy text-[#0047AB] dark:text-[#00D4FF] dark:drop-shadow-[0_0_5px_rgba(0,212,255,0.8)]">
                SYS.STATUS: ONLINE
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-neue-stance font-bold text-black dark:text-white uppercase tracking-tight mb-2">
              Technical Analysis
            </h2>
            <div className="w-16 h-1 bg-[#0047AB] dark:bg-[#00D4FF] mx-auto shadow-sm dark:shadow-[0_0_10px_rgba(0,212,255,0.5)] mt-4"></div>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-6">
              MODULE: 3D-RENDER_{version}
            </p>
          </div>

          {/* Main Content — Sidebar + Viewer */}
          <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
            {/* Left Sidebar (40%) */}
            <div className="w-full lg:w-[40%] flex flex-col gap-6">
              {/* Configurator Panel */}
              <div className="dashboard-panel p-6 border-l-2 border-l-[#0047AB] dark:border-l-[#00D4FF] dark:bg-black/40">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-black dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#0047AB] dark:text-[#00D4FF]">
                    tune
                  </span>
                  Configurator
                </h3>
                <div className="space-y-3">
                  {/* Heat Map Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-sm dark:hover:border-[#00D4FF]/30 transition-colors">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                      Heat Map Overlay
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={heatMapEnabled}
                        onChange={() => setHeatMapEnabled(!heatMapEnabled)}
                      />
                      <div className="w-9 h-4 bg-slate-200 dark:bg-slate-700 peer-checked:bg-[#0047AB] dark:peer-checked:bg-[#00D4FF] dark:peer-checked:shadow-[0_0_10px_rgba(0,212,255,0.5)] rounded-sm relative after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-sm after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full border border-slate-300 dark:border-slate-600"></div>
                    </label>
                  </div>
                  {/* Wireframe Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-sm dark:hover:border-[#00D4FF]/30 transition-colors">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                      Wireframe Mode
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={wireframeEnabled}
                        onChange={() => setWireframeEnabled(!wireframeEnabled)}
                      />
                      <div className="w-9 h-4 bg-slate-200 dark:bg-slate-700 peer-checked:bg-[#0047AB] dark:peer-checked:bg-[#00D4FF] dark:peer-checked:shadow-[0_0_10px_rgba(0,212,255,0.5)] rounded-sm relative after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-sm after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full border border-slate-300 dark:border-slate-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Layer Selection Panel */}
              <div className="dashboard-panel p-6 flex-1 flex flex-col dark:bg-black/40">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-black dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#0047AB] dark:text-[#00D4FF]">
                    layers
                  </span>
                  Layer Selection
                </h3>
                <div className="flex flex-col gap-3 h-full overflow-y-auto pr-2">
                  {layers.map((layer) => (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => setActiveLayer(layer.id)}
                      className={cn("control-btn group", activeLayer === layer.id && "active")}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg">{layer.icon}</span>
                        <span>{layer.label}</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-60">{layer.meta}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Biometric Analysis Panel */}
              <div className="dashboard-panel p-6 bg-slate-50 dark:bg-white/[0.02] border border-transparent dark:border-white/[0.08] border-t-2 border-t-[#0047AB] dark:!border-t-[#00D4FF] rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-black dark:text-white">
                    Biometric Analysis
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-[#00D4FF] dark:shadow-[0_0_8px_#00D4FF] animate-pulse"></span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="micro-copy block mb-1">Skin Temp</span>
                    <span
                      className="text-xl font-mono font-bold text-black dark:text-white stat-countup"
                      data-target="36.8"
                      data-suffix="°C"
                    >
                      36.8°C
                    </span>
                  </div>
                  <div>
                    <span className="micro-copy block mb-1">Moisture</span>
                    <span
                      className="text-xl font-mono font-bold text-black dark:text-white stat-countup"
                      data-target="42"
                      data-suffix="%"
                    >
                      42%
                    </span>
                  </div>
                  <div className="col-span-2 border-t border-slate-200 dark:border-white/10 pt-3 mt-1">
                    <div className="flex justify-between items-end">
                      <span className="micro-copy">Stress Load</span>
                      <span className="text-xs font-mono font-bold text-[#0047AB] dark:text-[#00D4FF] dark:drop-shadow-[0_0_3px_rgba(0,212,255,0.8)]">
                        CRITICAL ZONE DETECTED
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                      <div className="bg-[#0047AB] dark:bg-[#00D4FF] h-full w-[76%] dark:shadow-[0_0_8px_#00D4FF]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — 3D Viewer (60%) */}
            <div className="w-full lg:w-[60%] relative group">
              <OptimizedTechnologyHero media={media} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
