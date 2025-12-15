import { useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  threshold?: number;  // Minimum distance for a swipe
  allowedTime?: number;  // Maximum time for a swipe gesture
  preventScroll?: boolean;
}

export function useSwipeGesture(handlers: SwipeHandlers, config: SwipeConfig = {}) {
  const {
    threshold = 50,
    allowedTime = 300,
    preventScroll = true
  } = config;

  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (preventScroll) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    if (!touch) return;

    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !swiping) return;

    const touch = e.touches[0];
    if (!touch) return;

    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const endPoint = {
      x: touch.clientX,
      y: touch.clientY
    };

    const deltaX = endPoint.x - touchStart.x;
    const deltaY = endPoint.y - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Check if it's a valid swipe
    if (deltaTime <= allowedTime) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Horizontal swipe
      if (absX > threshold && absX > absY) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      }

      // Vertical swipe
      if (absY > threshold && absY > absX) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    }

    // Reset
    setTouchStart(null);
    setTouchEnd(null);
    setSwiping(false);
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isSwiping: swiping
  };
}