import type { MediaAsset } from "@shared/schema";
// Removed useMediaErrorHandler - using console.error for error handling
import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image,
  Layers,
  Maximize2,
  Pause,
  PictureInPicture,
  Play,
  Share2,
  Video,
  X,
  ZoomIn,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// STEP 3 INTEGRATION: Import UnifiedModelViewer to replace manual model-viewer elements
// CHUNK 6: Use lazy-loaded 3D viewer to reduce initial bundle by ~1MB
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import { cn } from "@/lib/utils";
import { useMediaPerformance } from "./MediaPerformanceMonitor";
// PHASE 6 FIX: Consolidated features from MediaTabsViewer and LazyMediaGallery

export interface EnhancedMediaAsset extends MediaAsset {
  loadPriority?: "high" | "medium" | "low";
  preloadUrl?: string;
  cameraPositions?: ModelViewerPosition[];
  chapters?: VideoChapter[];
}

interface ModelViewerPosition {
  name: string;
  orbit: string;
  target?: string;
  fieldOfView?: string;
}

interface VideoChapter {
  time: number;
  title: string;
}

interface MediaInteractionEvent {
  type: "view" | "interact" | "fullscreen" | "zoom";
  mediaType: "image" | "video" | "3d_model";
  duration?: number;
  action?: string;
}

interface UnifiedMediaTheaterProps {
  media: MediaAsset[];
  productName: string;
  primaryImageId?: number | null;
  primaryVideoId?: number | null;
  viewMode?: "theater" | "fullscreen" | "compact" | "tabs";
  defaultTab?: "gallery" | "3d" | "video";
  loadingStrategy?: "viewport" | "eager" | "lazy";
  onInteraction?: (event: MediaInteractionEvent) => void;
  onZoom?: (media: MediaAsset) => void;
  onMediaLoad?: (asset: MediaAsset) => void;
  className?: string;
}

export function UnifiedMediaTheater({
  media,
  productName,
  primaryImageId,
  primaryVideoId,
  viewMode = "theater",
  defaultTab = "gallery",
  onInteraction,
  onZoom,
  onMediaLoad,
  className,
}: UnifiedMediaTheaterProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // PHASE 6 FIX: Added tabbed interface state from MediaTabsViewer
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPiPActive, setIsPiPActive] = useState(false);
  // WebGL state now managed by UnifiedModelViewer
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  // Removed modelViewerRef - now using UnifiedModelViewer component
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const { measureLoadTime } = useMediaPerformance();
  // Simple error handler to replace removed useMediaErrorHandler
  const handleError = (_error: Error, _context?: string) => {};

  // Sort media to prioritize primary items and ensure consistent URL patterns
  const sortedMedia = [...media]
    .sort((a, b) => {
      if (a.id === primaryImageId || a.id === primaryVideoId) return -1;
      if (b.id === primaryImageId || b.id === primaryVideoId) return 1;
      if (a.type === "image" && b.type !== "image") return -1;
      if (b.type === "image" && a.type !== "image") return 1;
      return 0;
    })
    .map((asset) => ({
      ...asset,
      // Ensure consistent URL pattern with admin interface
      url: asset.url?.startsWith("/api/media/") ? asset.url : `/api/media/${asset.id}/content`,
    }));

  const currentMedia = sortedMedia[selectedIndex];
  const isVideo = currentMedia?.type === "video";
  const is3DModel = currentMedia?.type === "3d_model" || currentMedia?.type === "model";

  // PHASE 3.2 FIX: Organize media by type for tabbed interface
  const imageAssets = sortedMedia.filter((asset) => asset.type === "image");
  const videoAssets = sortedMedia.filter((asset) => asset.type === "video");
  const model3DAssets = sortedMedia.filter(
    (asset) => asset.type === "3d_model" || asset.type === "model",
  );

  // Feature detection
  const features = {
    hasTouch: "ontouchstart" in window,
    hasWebGL: (() => {
      try {
        const canvas = document.createElement("canvas");
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
        );
      } catch (_e) {
        return false;
      }
    })(),
    connectionSpeed: (navigator as any).connection?.effectiveType || "unknown",
  };

  // WebGL Context Recovery now handled by UnifiedModelViewer component

  // Video Loading Progress Handler
  const handleVideoProgress = useCallback(
    (e: ProgressEvent<HTMLVideoElement>) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;

        if (progress >= 25 && isVideoLoading) {
          setIsVideoLoading(false);
        }
      }
    },
    [isVideoLoading],
  );

  // Optimize video quality based on connection
  const getOptimalVideoSettings = useCallback(() => {
    const { connectionSpeed } = features;

    switch (connectionSpeed) {
      case "slow-2g":
      case "2g":
        return { preload: "metadata", quality: "low" };
      case "3g":
        return { preload: "metadata", quality: "medium" };
      default:
        return { preload: "auto", quality: "high" };
    }
  }, [features]);

  // Auto-scroll thumbnails to show selected item
  useEffect(() => {
    if (thumbnailContainerRef.current && sortedMedia.length > 1) {
      const container = thumbnailContainerRef.current;
      const selectedThumb = container.children[selectedIndex] as HTMLElement;
      if (selectedThumb) {
        const scrollLeft =
          selectedThumb.offsetLeft - (container.offsetWidth - selectedThumb.offsetWidth) / 2;
        container.scrollTo({
          left: scrollLeft,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    }
  }, [selectedIndex, prefersReducedMotion, sortedMedia.length]);

  // WebGL Context Event Handlers now managed by UnifiedModelViewer

  // Enhanced video loading with progress tracking
  useEffect(() => {
    if (!videoRef.current || !isVideo) return;

    const video = videoRef.current;
    const { preload } = getOptimalVideoSettings();

    // PHASE 3.1 FIX: Ensure preload value is properly typed
    video.preload = preload as "" | "metadata" | "auto" | "none";
    setIsVideoLoading(true);

    const handleLoadStart = () => setIsVideoLoading(true);
    const handleCanPlay = () => setIsVideoLoading(false);
    const handleProgress = (e: Event) => {
      // PHASE 3.1 FIX: Properly handle progress event type
      handleVideoProgress(e as ProgressEvent<HTMLVideoElement>);
    };
    const handleVideoError = (_e: Event) => {
      setIsVideoLoading(false);
      // PHASE 3.1 FIX: Remove duplicate parameter to handleError
      handleError(new Error("Video loading failed"));
    };

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("progress", handleProgress);
    video.addEventListener("error", handleVideoError);

    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("progress", handleProgress);
      video.removeEventListener("error", handleVideoError);
    };
  }, [isVideo, getOptimalVideoSettings, handleVideoProgress, handleError]);

  // Handle video play/pause with enhanced autoplay support
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((_error) => {
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Auto-start video when switching to video media
  useEffect(() => {
    if (currentMedia?.type === "video" && videoRef.current) {
      // Attempt autoplay for video media
      videoRef.current.play().catch((_error) => {
        setIsPlaying(false);
      });
    } else {
      setIsPlaying(false);
    }
  }, [currentMedia]);

  // Enhanced swipe gesture handler
  const swipeHandlers = useSwipeGesture(
    {
      onSwipeLeft: () => {
        setDirection(-1);
        handleNext();
      },
      onSwipeRight: () => {
        setDirection(1);
        handlePrevious();
      },
    },
    {
      threshold: 50,
      allowedTime: 300,
      preventScroll: false,
    },
  );

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev - 1 + sortedMedia.length) % sortedMedia.length);
    onInteraction?.({
      type: "interact",
      mediaType: (currentMedia?.type as "image" | "video" | "3d_model") || "image",
      action: "navigate-prev",
    });
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % sortedMedia.length);
    onInteraction?.({
      type: "interact",
      mediaType: (currentMedia?.type as "image" | "video" | "3d_model") || "image",
      action: "navigate-next",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === " " && isVideo) {
      e.preventDefault();
      setIsPlaying(!isPlaying);
    }
    if (e.key === "f") toggleFullscreen();
    if (e.key === "Escape" && isFullscreen) {
      setIsFullscreen(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    onInteraction?.({
      type: "fullscreen",
      mediaType: (currentMedia?.type as "image" | "video" | "3d_model") || "image",
      action: isFullscreen ? "exit" : "enter",
    });
  };

  const handleZoom = () => {
    if (currentMedia && currentMedia.type === "image") {
      onZoom?.(currentMedia);
      onInteraction?.({ type: "zoom", mediaType: "image" });
    }
  };

  // Picture-in-Picture support for videos
  const togglePiP = async () => {
    if (!videoRef.current || !("pictureInPictureEnabled" in document)) return;

    try {
      if (isPiPActive) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (_error) {}
  };

  // Share functionality
  const handleShare = async () => {
    if (!currentMedia || !navigator.share) return;

    try {
      await navigator.share({
        title: productName,
        text: `Check out this ${
          currentMedia.type === "3d_model" ? "3D model" : currentMedia.type
        } of ${productName}`,
        url: window.location.href,
      });
      onInteraction?.({
        type: "interact",
        mediaType: (currentMedia.type as "image" | "video" | "3d_model") || "image",
        action: "share",
      });
    } catch (_error) {}
  };

  // Track media load performance - 3D models now tracked via UnifiedModelViewer onLoad callback
  useEffect(() => {
    const startTime = performance.now();
    const handleLoad = () => measureLoadTime(startTime);

    if (currentMedia && isVideo && videoRef.current) {
      const element = videoRef.current;
      element.addEventListener("load", handleLoad);
      return () => element.removeEventListener("load", handleLoad);
    }
    return undefined;
  }, [currentMedia, measureLoadTime, isVideo]);

  if (sortedMedia.length === 0) {
    return (
      <div
        className={cn(
          "center-flex rounded-lg bg-gray-50",
          isMobile ? "aspect-[4/3]" : "aspect-square",
          className,
        )}
      >
        <div className="text-center text-gray-400">
          <Layers className="mx-auto mb-2 h-16 w-16" />
          <p>No media available</p>
        </div>
      </div>
    );
  }

  // PHASE 3.2 FIX: Implement tabbed interface from MediaTabsViewer
  if (viewMode === "tabs") {
    return (
      <div className={cn("space-y-4", className)}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "gallery" | "3d" | "video")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Gallery ({imageAssets.length})
            </TabsTrigger>
            <TabsTrigger
              value="3d"
              className="flex items-center gap-2"
              disabled={model3DAssets.length === 0}
            >
              <Box className="h-4 w-4" />
              3D ({model3DAssets.length})
            </TabsTrigger>
            <TabsTrigger
              value="video"
              className="flex items-center gap-2"
              disabled={videoAssets.length === 0}
            >
              <Video className="h-4 w-4" />
              Video ({videoAssets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="mt-4">
            {imageAssets.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {imageAssets.map((asset, index) => (
                  <div
                    key={asset.id}
                    className="group relative cursor-pointer"
                    onClick={() => onZoom?.(asset)}
                  >
                    <OptimizedImage
                      mediaId={Number(asset.id)}
                      alt={`${productName} - Image ${index + 1}`}
                      quality={85}
                      priority={index < 6}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    {onZoom && (
                      <div className="absolute inset-0 center-flex rounded-lg bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">No images available</div>
            )}
          </TabsContent>

          <TabsContent value="3d" className="mt-4">
            {model3DAssets.length > 0 ? (
              <div className="space-y-4">
                {model3DAssets.map((asset) => (
                  <div key={asset.id} className="relative aspect-square rounded-lg bg-gray-100">
                    {/* STEP 3 INTEGRATION: Replace manual model-viewer with UnifiedModelViewer */}
                    <LazyUnifiedModelViewer
                      asset={{
                        ...asset,
                        filename: asset.filename || `${productName}_3d_model.gltf`,
                        originalName:
                          asset.originalName || asset.filename || `${productName} - 3D Model`,
                        fileSize: asset.fileSize ?? asset.size ?? null,
                        size: asset.size ?? asset.fileSize ?? null,
                        mimeType: asset.mimeType || "model/gltf+json",
                        type: asset.type || "3d_model",
                        url: asset.url || `/api/media/${asset.id}/content`,
                        storagePath: asset.storagePath || "",
                        bucketName: asset.bucketName || "",
                        metadata: asset.metadata || {},
                        tags: asset.tags || [],
                      }}
                      config={{
                        cameraControls: true,
                        autoRotate: true,
                        backgroundColorHex: "#f5f5f5",
                        exposure: 1.0,
                        shadowIntensity: 1,
                        interactionPolicy: "always-allow",
                        loading: "lazy",
                      }}
                      onLoad={() => {
                        onMediaLoad?.(asset);
                      }}
                      className="h-full w-full"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">No 3D models available</div>
            )}
          </TabsContent>

          <TabsContent value="video" className="mt-4">
            {videoAssets.length > 0 ? (
              <div className="space-y-4">
                {videoAssets.map((asset) => (
                  <div key={asset.id} className="relative aspect-video rounded-lg bg-black">
                    <video
                      src={asset.url || `/api/media/${asset.id}/content`}
                      controls
                      className="h-full w-full rounded-lg"
                      preload="metadata"
                      onLoadedData={() => onMediaLoad?.(asset)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">No videos available</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Default theater/carousel view
  return (
    <div
      className={cn(
        "space-y-4",
        isFullscreen && "fixed inset-0 z-modal flex flex-col bg-black",
        className,
      )}
      onKeyDown={handleKeyDown}
    >
      {/* Main Display */}
      <div
        ref={containerRef}
        className={cn(
          "group relative",
          !isFullscreen && "overflow-hidden rounded-lg",
          isFullscreen && "flex flex-1 items-center justify-center",
        )}
        {...(features.hasTouch ? swipeHandlers : {})}
      >
        <div
          className={cn(
            "relative bg-gray-100",
            !isFullscreen && (isMobile ? "aspect-[4/3]" : "aspect-square"),
            isFullscreen && "h-full w-full",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {currentMedia && (
              <motion.div
                key={currentMedia.id}
                initial={{ opacity: 0, x: direction * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 100 }}
                transition={{
                  duration: prefersReducedMotion ? 0.1 : 0.3,
                  ease: "easeInOut",
                }}
                className="absolute inset-0"
              >
                {isVideo ? (
                  <div className="relative h-full w-full">
                    <video
                      ref={videoRef}
                      src={currentMedia.url || `/api/media/${currentMedia.id}/content`}
                      className="h-full w-full object-contain transition-transform duration-300"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      onClick={() => setIsPlaying(!isPlaying)}
                      onLoadedData={() => {
                        // Ensure autoplay starts when video loads
                        if (videoRef.current && !isPlaying) {
                          setIsPlaying(true);
                        }
                      }}
                    />

                    {/* Enhanced Video Controls Overlay */}
                    <motion.div
                      className={cn(
                        "pointer-events-none absolute inset-0 center-flex",
                        "transition-opacity duration-200",
                        isPlaying ? "opacity-0" : "opacity-100",
                      )}
                      initial={false}
                      animate={{ scale: isPlaying ? 0.8 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPlaying(!isPlaying);
                        }}
                        className="pointer-events-auto rounded-full bg-black/50 p-4 text-white transition-all hover:bg-black/70"
                        aria-label={isPlaying ? "Pause video" : "Play video"}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                      </motion.button>
                    </motion.div>

                    {/* Video indicator */}
                    <div className="absolute top-3 right-3 rounded bg-black/70 px-2 py-1 text-sm text-white">
                      Video
                    </div>
                  </div>
                ) : is3DModel ? (
                  <div className="relative h-full w-full">
                    {/* STEP 3 INTEGRATION: Replace complex manual model-viewer with UnifiedModelViewer */}
                    <LazyUnifiedModelViewer
                      asset={useMemo(
                        () => ({
                          ...currentMedia,
                          filename: currentMedia.filename || `${productName}_main_model.gltf`,
                          originalName:
                            currentMedia.originalName || currentMedia.filename || productName,
                          fileSize: currentMedia.fileSize ?? currentMedia.size ?? null,
                          size: currentMedia.size ?? currentMedia.fileSize ?? null,
                          mimeType: currentMedia.mimeType || "model/gltf+json",
                          type: currentMedia.type || "model",
                          url: currentMedia.url || `/api/media/${currentMedia.id}/content`,
                          storagePath: currentMedia.storagePath || "",
                          bucketName: currentMedia.bucketName || "",
                          metadata: currentMedia.metadata || {},
                          tags: currentMedia.tags || [],
                        }),
                        [
                          currentMedia.id,
                          currentMedia.url,
                          currentMedia.filename,
                          productName,
                          currentMedia.bucketName,
                          currentMedia.fileSize,
                          currentMedia.metadata,
                          currentMedia.mimeType,
                          currentMedia.originalName,
                          currentMedia.size,
                          currentMedia.storagePath,
                          currentMedia.tags,
                          currentMedia,
                        ],
                      )}
                      config={useMemo(
                        () => ({
                          cameraControls: true,
                          autoRotate: true,
                          backgroundColorHex: "#f5f5f5",
                          exposure: 0.95,
                          shadowIntensity: 0.7,
                          interactionPolicy: "always-allow",
                          loading: "auto",
                        }),
                        [],
                      )}
                      onLoad={useCallback(() => {
                        measureLoadTime(performance.now());
                        onMediaLoad?.(currentMedia);
                      }, [currentMedia, measureLoadTime, onMediaLoad])}
                      onInteraction={useCallback(
                        (event: string) => {
                          onInteraction?.({
                            type: "interact",
                            mediaType: "3d_model",
                            action: `model-${event}`,
                            duration: 0,
                          });
                        },
                        [onInteraction],
                      )}
                      className="h-full w-full"
                    />

                    {/* NOTE: ModelViewerControls integration requires ref access - consider future enhancement */}

                    {/* 3D Model indicator */}
                    <div className="absolute top-3 right-3 z-elevated rounded bg-purple-600 px-2 py-1 text-sm text-white">
                      3D Model
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full w-full">
                    {/* PHASE 3.1 FIX: Remove onClick from OptimizedImage and wrap with div */}
                    <div
                      className={cn("h-full w-full", onZoom && "cursor-pointer")}
                      onClick={handleZoom}
                    >
                      <OptimizedImage
                        mediaId={currentMedia.id}
                        alt={`${productName} - ${currentMedia.filename || "Image"}`}
                        quality={85}
                        priority={true}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    {/* Zoom button for desktop */}
                    {onZoom && !isMobile && (
                      <button
                        onClick={handleZoom}
                        className={cn(
                          "absolute right-3 bottom-3 rounded-lg bg-white/90 p-2 shadow-lg hover:bg-white",
                          "opacity-0 transition-opacity group-hover:opacity-100",
                        )}
                        aria-label="Zoom image"
                      >
                        <ZoomIn className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Arrows - Hidden on mobile (use swipe instead) */}
          {sortedMedia.length > 1 && !isMobile && (
            <>
              <button
                onClick={handlePrevious}
                className={cn(
                  "absolute top-1/2 left-4 -translate-y-1/2 border p-3 transition-opacity",
                  "opacity-0 group-hover:opacity-100",
                )}
                style={{
                  backgroundColor: "var(--product-background)",
                  borderColor: "var(--product-border)",
                }}
                aria-label="Previous media"
              >
                <ChevronLeft className="h-5 w-5" style={{ color: "var(--product-text)" }} />
              </button>
              <button
                onClick={handleNext}
                className={cn(
                  "absolute top-1/2 right-4 -translate-y-1/2 border p-3 transition-opacity",
                  "opacity-0 group-hover:opacity-100",
                )}
                style={{
                  backgroundColor: "var(--product-background)",
                  borderColor: "var(--product-border)",
                }}
                aria-label="Next media"
              >
                <ChevronRight className="h-5 w-5" style={{ color: "var(--product-text)" }} />
              </button>
            </>
          )}

          {/* Media Counter */}
          {sortedMedia.length > 1 && (
            <div
              className="absolute bottom-4 left-4 border px-3 py-1 font-mono text-xs"
              style={{
                backgroundColor: "var(--product-background)",
                borderColor: "var(--product-border)",
                color: "var(--product-text)",
              }}
            >
              {selectedIndex + 1} / {sortedMedia.length}
            </div>
          )}

          {/* Action buttons overlay */}
          <div className="absolute top-4 left-4 flex gap-2">
            {/* Fullscreen button */}
            {!isMobile && (
              <button
                onClick={toggleFullscreen}
                className={cn(
                  "border p-2 transition-opacity",
                  isFullscreen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
                style={{
                  backgroundColor: "var(--product-background)",
                  borderColor: "var(--product-border)",
                }}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <X className="h-4 w-4" style={{ color: "var(--product-text)" }} />
                ) : (
                  <Maximize2 className="h-4 w-4" style={{ color: "var(--product-text)" }} />
                )}
              </button>
            )}

            {/* Share button */}
            {typeof navigator !== "undefined" &&
              navigator.share &&
              typeof navigator.share === "function" && (
                <button
                  onClick={handleShare}
                  className="border p-2 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    backgroundColor: "var(--product-background)",
                    borderColor: "var(--product-border)",
                  }}
                  aria-label="Share"
                >
                  <Share2 className="h-4 w-4" style={{ color: "var(--product-text)" }} />
                </button>
              )}

            {/* PiP button for videos */}
            {isVideo && "pictureInPictureEnabled" in document && (
              <button
                onClick={togglePiP}
                className={cn(
                  "border p-2 opacity-0 transition-opacity group-hover:opacity-100",
                  isPiPActive && "border-blue-500",
                )}
                style={{
                  backgroundColor: "var(--product-background)",
                  borderColor: isPiPActive ? undefined : "var(--product-border)",
                }}
                aria-label="Picture in Picture"
              >
                <PictureInPicture className="h-4 w-4" style={{ color: "var(--product-text)" }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {!isFullscreen && sortedMedia.length > 1 && (
        <div className="relative mt-4">
          <div
            ref={thumbnailContainerRef}
            className={cn(
              "scrollbar-hide flex gap-3 overflow-x-auto",
              "-mx-4 px-4 md:mx-0 md:px-0", // Full width on mobile
            )}
          >
            {sortedMedia.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedIndex(index);
                  onInteraction?.({
                    type: "interact",
                    mediaType: (item.type as "image" | "video" | "3d_model") || "image",
                    action: "thumbnail-click",
                  });
                }}
                className={cn(
                  "relative shrink-0 overflow-hidden border transition-all",
                  "h-20 w-20 min-w-[80px] md:h-24 md:w-24",
                )}
                style={{
                  borderColor:
                    selectedIndex === index ? "var(--product-text)" : "var(--product-border)",
                  borderWidth: selectedIndex === index ? "2px" : "1px",
                }}
              >
                {item.type === "video" ? (
                  <div className="relative h-full w-full bg-gray-100">
                    <video
                      src={item.url || `/api/media/${item.id}/content`}
                      className="h-full w-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 center-flex bg-black/30">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ) : item.type === "3d_model" ? (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                    <Layers className="h-6 w-6 text-purple-600" />
                  </div>
                ) : (
                  <img
                    src={item.url || `/api/media/${item.id}/content`}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Primary indicator */}
                {(item.id === primaryImageId || item.id === primaryVideoId) && (
                  <div
                    className="absolute top-1 left-1 border px-1 text-xs"
                    style={{
                      backgroundColor: "var(--product-text)",
                      borderColor: "var(--product-text)",
                      color: "var(--product-background)",
                    }}
                  >
                    Primary
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Mobile Instructions */}
      {!isFullscreen && (
        <motion.div
          className="mt-3 space-y-1 text-center text-xs"
          style={{ color: "var(--product-muted)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="center-flex gap-3">
            {isMobile && sortedMedia.length > 1 && (
              <span className="flex items-center gap-1">Swipe to navigate</span>
            )}
            {isVideo && (
              <span className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                Tap to play/pause
              </span>
            )}
            {!isMobile && sortedMedia.length > 1 && (
              <span className="flex items-center gap-1">← → Arrow keys</span>
            )}
          </div>
          {currentMedia?.type === "image" && onZoom && (
            <div className="center-flex gap-1">
              <ZoomIn className="h-3 w-3" />
              <span>{isMobile ? "Tap to zoom" : "Click to zoom"}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
