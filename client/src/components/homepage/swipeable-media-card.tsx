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
  }, []);

  // Optimized media component using ultra-high-resolution variants
  const OptimizedMediaItem = ({ item }: { item: MediaItem }) => {
    const { urls } = useOptimizedMedia(item.id, {
      width: 1200,
      quality: 90,
      format: "webp",
    });

    if (item.type === "video") {
      return (
        <video className="w-full h-full object-cover" autoPlay loop muted playsInline>
          <source src={urls?.large || item.url} type="video/mp4" />
        </video>
      );
    } else if (item.type === "model" && item.asset) {
      return (
        <div className="w-full h-full relative">
          <LazyUnifiedModelViewer
            asset={item.asset}
            className="w-full h-full"
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
            onError={(error: Error) => {}}
            onInteraction={(type: string, data: any) => {}}
          />

          {/* 3D Model Indicator */}
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full flex items-center gap-1">
            <Box className="w-3 h-3" />
            <span>3D</span>
          </div>
        </div>
      );
    } else if (item.type === "model") {
      // Fallback for models without asset info
      return (
        <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Box className="w-16 h-16 mx-auto text-white/60" />
            <p className="text-white/60 text-sm">3D Model Loading...</p>
          </div>
        </div>
      );
    } else {
      return (
        <img
          src={urls?.large || urls?.medium || item.url}
          alt={item.alt || name}
          className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
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
      className={cn("relative group transform-gpu perspective-1000 select-none", className)}
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
          className="aspect-[4/3] relative overflow-hidden rounded-lg mb-4 cursor-grab active:cursor-grabbing"
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
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background border border-white/20 dark:border-white/30 text-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-card z-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background border border-white/20 dark:border-white/30 text-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-card z-10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Media Type Indicator - Only show for 3D models */}
          {currentItem && currentItem.type === "model" && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-background border border-white/20 dark:border-white/30 text-foreground text-xs rounded-full">
              <span>3D</span>
            </div>
          )}
        </div>

        {/* Content - Clickable Area */}
        <div
          className="space-y-3 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={onClick}
        >
          <h3 className="text-xl font-bold text-white font-neue-stance">{name}</h3>
          {description && <p className="text-sm text-white/80 line-clamp-2">{description}</p>}

          {/* Media Counter */}
          {hasMultipleItems && (
            <div className="text-xs text-white/60">
              {currentIndex + 1} of {mediaItems.length}
            </div>
          )}
        </div>
      </LiquidGlassCard>

      {/* Swipe Instruction */}
      {hasMultipleItems && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Swipe to browse
        </div>
      )}
    </div>
  );
});
