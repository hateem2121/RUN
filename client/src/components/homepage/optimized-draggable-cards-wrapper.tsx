/**
 * Optimized Draggable Cards Wrapper
 * Performance-optimized wrapper for draggable card component
 * Includes adapter utilities for converting process cards to draggable format
 * Mobile-responsive: Uses swipeable carousel on mobile, draggable cards on desktop
 */

import { memo, useRef } from "react";
import { useIntersectionObserver } from "@/lib/performance-intersection-observer";
import {
  DraggableCardBody,
  DraggableCardContainer,
} from "@/components/ui/draggable-card";
import { AnimationErrorBoundary } from "@/components/error-boundaries/animation-error-boundary";
import type { MediaAsset } from "@shared/schema";

// Type for draggable card items
export interface DraggableCardItem {
  title: string;
  description?: string;
  image?: string;
  className?: string;
}

// Process card type from current system
export interface ProcessCard {
  id: number;
  title: string;
  description: string;
  icon?: string;
  iconMediaId?: number | null;
  iconType?: "text" | "image" | null;
}

// Sportswear-themed fallback images for authentic B2B presentation
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Athletic fabric
  "https://images.unsplash.com/photo-1556906781-9a412961c28c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3", // Manufacturing/fabric
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3", // Sportswear design
  "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Athletic gear
];

/**
 * Converts process cards to draggable card format
 * Removes icon system and focuses on media + text
 * Uses proper media URL format with ID-based proxy
 */
export function convertProcessCardsToDraggableCards(
  processCards: ProcessCard[],
  mediaAssets: MediaAsset[] = [],
): DraggableCardItem[] {
  // PERFORMANCE: Minimal logging for production optimization
  if (import.meta.env.DEV) {
    console.log(
      `[DraggableCardAdapter] Converting ${processCards.length} cards with ${mediaAssets.length} media assets`,
    );
  }

  // Helper to get media URL by ID with safe overflow protection
  const getMediaUrl = (mediaId: number | undefined) => {
    if (!mediaId) return null;

    const asset = mediaAssets.find((a) => a.id === mediaId);
    if (!asset) return null;

    // SAFETY: Prevent PostgreSQL integer overflow by checking ID size
    if (asset.id >= 1000000000000) {
      if (import.meta.env.DEV) {
        console.warn(
          "[DraggableCardAdapter] ID too large, skipping to prevent database overflow:",
          asset.id,
        );
      }
      return null;
    }

    return `/api/media/${asset.id}/content`;
  };

  // Mobile-first positioning patterns with incremental z-index and unique positions
  const IMPROVED_POSITIONING_PATTERNS = [
    "absolute top-5 left-[5%] rotate-[-5deg] z-10 sm:top-8 sm:left-[8%] md:top-10 md:left-[10%]",
    "absolute top-20 left-[25%] rotate-[-7deg] z-20 sm:top-28 sm:left-[28%] md:top-40 md:left-[30%]",
    "absolute top-8 left-[45%] rotate-[8deg] z-30 sm:top-10 sm:left-[48%] md:top-5 md:left-[50%]",
    "absolute top-25 left-[65%] rotate-[10deg] z-40 sm:top-28 sm:left-[68%] md:top-32 md:left-[70%]",
  ];

  return processCards.map((card, index) => {
    const mediaUrl = getMediaUrl(card.iconMediaId ?? undefined);
    const finalImageUrl =
      mediaUrl || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

    return {
      title: card.title,
      description: card.description,
      image: finalImageUrl,
      className:
        IMPROVED_POSITIONING_PATTERNS[
          index % IMPROVED_POSITIONING_PATTERNS.length
        ],
    };
  });
}

interface OptimizedDraggableCardsWrapperProps {
  items: DraggableCardItem[];
  className?: string;
}

// Loading fallback component
const DraggableCardsLoadingFallback = memo(
  function DraggableCardsLoadingFallback({
    className,
  }: {
    className?: string;
  }) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-neutral-50/50 rounded-lg border-2 border-dashed border-neutral-200`}
      >
        <div className="text-center p-8">
          <div className="animate-spin w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-500 text-sm">
            Loading Interactive Cards...
          </p>
        </div>
      </div>
    );
  },
);

const OptimizedDraggableCardsWrapperComponent = memo(
  function OptimizedDraggableCardsWrapperComponent({
    items,
    className,
  }: OptimizedDraggableCardsWrapperProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { isIntersecting, hasIntersected } = useIntersectionObserver(
      containerRef,
      {
        threshold: 0.1,
        rootMargin: "100px",
        triggerOnce: true,
      },
    );

    // Only render the component when it's needed
    const shouldRender = hasIntersected || isIntersecting;

    return (
      <div ref={containerRef} className={className}>
        {shouldRender ? (
          <DraggableCardContainer className="relative min-h-[500px] sm:min-h-[600px] md:min-h-[700px]">
            {items.map((item, index) => (
              <DraggableCardBody
                key={`card-${index}`}
                className={item.className}
              >
                <div className="relative h-full w-full overflow-hidden">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-3/4 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </DraggableCardBody>
            ))}
          </DraggableCardContainer>
        ) : (
          <DraggableCardsLoadingFallback className={className} />
        )}
      </div>
    );
  },
);

// Export wrapped component with enhanced error boundary protection
export function OptimizedDraggableCardsWrapper(
  props: OptimizedDraggableCardsWrapperProps,
) {
  return (
    <AnimationErrorBoundary componentName="OptimizedDraggableCardsWrapper">
      <OptimizedDraggableCardsWrapperComponent {...props} />
    </AnimationErrorBoundary>
  );
}
