import type { MediaAsset } from "@shared/schema";
import { AnimatePresence, motion } from "framer-motion";
import { Box, ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { memo, useEffect, useState } from "react";
import { LiquidGlassCard } from "@/components/ui/glass-card";
// CHUNK 6: Use lazy-loaded 3D viewer to reduce initial bundle by ~1MB
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";
import { validateAnimationSettings } from "@/lib/animation-utils";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: number;
  url: string;
  type: "image" | "video" | "model";
  alt?: string;
  asset?: MediaAsset; // For 3D models, contains full asset info
}

interface SwipeableMediaCardProps {
  id: number;
  name: string;
  description?: string;
  mediaItems: MediaItem[];
  onClick?: () => void;
  className?: string;
  swipeAnimation?: {
    transitionDuration: number;
    easing: string;
  };
}

export const SwipeableMediaCard = memo(function SwipeableMediaCard({
  name,
  description,
  mediaItems,
  onClick,
  className,
  swipeAnimation,
}: SwipeableMediaCardProps) {
  // Validate and sanitize animation settings with safe defaults
  const safeSwipeAnimation = validateAnimationSettings(swipeAnimation);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const hasMultipleItems = mediaItems.length > 1;
  const currentItem = mediaItems[currentIndex] || null;

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  // Touch/mouse event handlers
  const handleStart = (clientX: number) => {
    setStartX(clientX);
    setCurrentX(clientX);
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    setCurrentX(clientX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaX = currentX - startX;
    const threshold = 50;

    if (deltaX > threshold) {
      goToPrevious();
    } else if (deltaX < -threshold) {
      goToNext();
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) handleStart(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) handleMove(touch.clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    handleMove(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious]);

  // Optimized media component using ultra-high-resolution variants
  const OptimizedMediaItem = ({ item }: { item: MediaItem }) => {
    const { urls } = useOptimizedMedia(item.id, {
      width: 1200,
      quality: 90,
      format: "webp",
    });

    if (item.type === "video") {
      return (
        <video className="h-full w-full object-cover" autoPlay loop muted playsInline>
          <source src={urls?.large || item.url} type="video/mp4" />
        </video>
      );
    } else if (item.type === "model" && item.asset) {
      return (
        <div className="relative h-full w-full">
          <LazyUnifiedModelViewer
            asset={item.asset}
            className="h-full w-full"
            config={{
              autoRotate: true,
              cameraControls: true,
              backgroundColorHex: "var(--color-neutral-100)",
              exposure: 1,
              shadowIntensity: 1,
              loading: "auto",
            }}
            showControls={false}
            showLoadingProgress={true}
            showFileInfo={false}
            onLoad={() => {}}
            onError={(_error: Error) => {}}
            onInteraction={(_type: string, _data: any) => {}}
          />

          {/* 3D Model Indicator */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-white text-xs">
            <Box className="h-3 w-3" />
            <span>3D</span>
          </div>
        </div>
      );
    } else if (item.type === "model") {
      // Fallback for models without asset info
      return (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          <div className="space-y-2 text-center">
            <Box className="mx-auto h-16 w-16 text-white/60" />
            <p className="text-sm text-white/60">3D Model Loading...</p>
          </div>
        </div>
      );
    } else {
      return (
        <img
          src={urls?.large || urls?.medium || item.url}
          alt={item.alt || name}
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-110"
          draggable={false}
        />
      );
    }
  };

  const renderMedia = (item: MediaItem) => {
    return <OptimizedMediaItem item={item} />;
  };

  return (
    <div
      className={cn("group perspective-1000 relative transform-gpu select-none", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      <LiquidGlassCard
        blurIntensity="md"
        glowIntensity="sm"
        shadowIntensity="md"
        className="relative p-6 transition-all duration-500 hover:scale-[1.02]"
      >
        {/* Media Container - Flexible aspect ratio */}
        <div
          className="relative mb-4 aspect-[4/3] cursor-grab overflow-hidden rounded-lg active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={isDragging ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleEnd}
        >
          {/* Media Content */}
          <AnimatePresence mode="wait">
            {currentItem && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{
                  duration: safeSwipeAnimation.transitionDuration,
                  ease: safeSwipeAnimation.easing as any,
                }}
                className="absolute inset-0"
              >
                {renderMedia(currentItem)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Arrows */}
          {hasMultipleItems && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute top-1/2 left-2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-background text-foreground opacity-0 transition-opacity duration-300 hover:bg-card group-hover:opacity-100 dark:border-white/30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute top-1/2 right-2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-background text-foreground opacity-0 transition-opacity duration-300 hover:bg-card group-hover:opacity-100 dark:border-white/30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Media Type Indicator - Only show for 3D models */}
          {currentItem && currentItem.type === "model" && (
            <div className="absolute top-2 right-2 rounded-full border border-white/20 bg-background px-2 py-1 text-foreground text-xs dark:border-white/30">
              <span>3D</span>
            </div>
          )}
        </div>

        {/* Content - Clickable Area */}
        <div
          className="cursor-pointer space-y-3 transition-opacity hover:opacity-90"
          onClick={onClick}
        >
          <h3 className="font-bold font-neue-stance text-white text-xl">{name}</h3>
          {description && <p className="line-clamp-2 text-sm text-white/80">{description}</p>}

          {/* Media Counter */}
          {hasMultipleItems && (
            <div className="text-white/60 text-xs">
              {currentIndex + 1} of {mediaItems.length}
            </div>
          )}
        </div>
      </LiquidGlassCard>

      {/* Swipe Instruction */}
      {hasMultipleItems && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50 text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Swipe to browse
        </div>
      )}
    </div>
  );
});
