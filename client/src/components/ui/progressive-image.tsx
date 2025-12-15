/**
 * Progressive Image Component
 * Implements blur-to-sharp loading with multiple resolution support
 */

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { MediaAsset } from '@shared/schema';

interface ProgressiveImageProps {
  src?: string;
  alt: string;
  className?: string;
  thumbnailSrc?: string;
  blurhash?: string;
  sizes?: string;
  srcSet?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  aspectRatio?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  asset?: MediaAsset;
  width?: number;
  height?: number;
}

export function ProgressiveImage({
  src: srcProp,
  alt,
  className,
  thumbnailSrc,
  blurhash,
  sizes,
  srcSet,
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
  aspectRatio,
  objectFit = 'cover',
  asset
}: ProgressiveImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Derive src from asset if provided, otherwise use srcProp
  const src = asset?.url || srcProp || '';

  // Generate optimized URLs
  const getOptimizedSrcSet = () => {
    if (srcSet) return srcSet;
    if (!src) return '';
    
    // Extract base URL and extension
    const urlParts = src.match(/(.+?)(\.[^.]+)?$/);
    if (!urlParts) return '';
    
    const baseUrl = urlParts[1];
    const ext = urlParts[2] || '';
    
    // Generate srcset for different sizes (optimized for common breakpoints)
    const sizes = [640, 1024, 1920];
    return sizes.map(size => 
      `${baseUrl}?size=${size}${ext} ${size}w`
    ).join(', ');
  };

  // Load image progressively
  useEffect(() => {
    if (!src) return;
    
    if (priority) {
      // Load immediately for priority images
      loadFullImage();
    } else {
      // Set up intersection observer for lazy loading
      setupIntersectionObserver();
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [src, priority]);

  const setupIntersectionObserver = () => {
    if (!imgRef.current || typeof IntersectionObserver === 'undefined') {
      loadFullImage(); // Fallback for older browsers
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadFullImage();
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01
      }
    );

    observerRef.current.observe(imgRef.current);
  };

  const loadFullImage = () => {
    // First load thumbnail if available
    if (thumbnailSrc && thumbnailSrc !== currentSrc) {
      const thumbnailImg = new Image();
      thumbnailImg.src = thumbnailSrc;
      thumbnailImg.onload = () => {
        setCurrentSrc(thumbnailSrc);
        // Continue loading full image
        loadMainImage();
      };
      thumbnailImg.onerror = () => {
        // Skip thumbnail, load main image directly
        loadMainImage();
      };
    } else {
      loadMainImage();
    }
  };

  const loadMainImage = () => {
    const img = new Image();
    
    // Set srcset if available
    if (srcSet || src.includes('/api/media/')) {
      img.srcset = getOptimizedSrcSet();
    }
    
    img.src = src;
    
    img.onload = () => {
      setCurrentSrc(src);
      setImageState('loaded');
      onLoad?.();
    };
    
    img.onerror = () => {
      setImageState('error');
      onError?.(new Error(`Failed to load image: ${src}`));
      console.error('[ProgressiveImage] Failed to load:', src);
    };
  };

  // Render blurhash placeholder if available
  const renderBlurhash = () => {
    if (!blurhash) return null;
    
    // This would use a blurhash library in production
    return (
      <div 
        className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse"
        aria-hidden="true"
      />
    );
  };

  // Render placeholder
  const renderPlaceholder = () => {
    if (blurhash) {
      return renderBlurhash();
    }
    
    return (
      <div className="absolute inset-0 bg-gray-200 animate-pulse">
        <svg 
          className="absolute inset-0 w-full h-full text-gray-300"
          xmlns="http://www.w3.org/2000/svg" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-gray-100',
        className
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Placeholder / Loading state */}
      {imageState === 'loading' && renderPlaceholder()}
      
      {/* Thumbnail (blur-smred) */}
      {thumbnailSrc && currentSrc === thumbnailSrc && (
        <img
          src={thumbnailSrc}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full filter blur-md scale-110',
            `object-${objectFit}`
          )}
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={currentSrc || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
        alt={alt}
        className={cn(
          'w-full h-full transition-opacity duration-500',
          `object-${objectFit}`,
          imageState === 'loaded' && currentSrc === src ? 'opacity-100' : 'opacity-0',
          imageState === 'error' && 'hidden'
        )}
        loading={priority ? 'eager' : loading}
        sizes={sizes}
        srcSet={currentSrc === src ? getOptimizedSrcSet() : undefined}
        onError={() => setImageState('error')}
      />
      
      {/* Error state */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <svg 
              className="w-12 h-12 mx-auto text-gray-400 mb-2"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className="text-sm text-gray-500">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Preload utility for critical images
export function preloadImage(src: string, srcSet?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    if (srcSet) {
      img.srcset = srcSet;
    }
    
    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
  });
}

// Hook for managing image loading state
export function useProgressiveImage(src: string, thumbnailSrc?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc || '');

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Load thumbnail first if available
    if (thumbnailSrc) {
      const thumbnailImg = new Image();
      thumbnailImg.src = thumbnailSrc;
      thumbnailImg.onload = () => setCurrentSrc(thumbnailSrc);
    }

    // Load main image
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };
    
    img.onerror = () => {
      setError(new Error(`Failed to load image: ${src}`));
      setLoading(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, thumbnailSrc]);

  return { currentSrc, loading, error };
}