// Performance Optimization: Week 3 - Advanced Lazy Loading System
// Intelligent component and resource lazy loading with intersection observer

import { type ComponentType, type LazyExoticComponent, lazy } from "react";

interface LazyComponentOptions {
  preload?: boolean;
  threshold?: number;
  rootMargin?: string;
  fallback?: ComponentType;
}

interface LazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
  fadeIn?: boolean;
}

// Advanced lazy component wrapper with preloading capabilities
export const createLazyComponent = <T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {},
): LazyExoticComponent<T> => {
  const LazyComponent = lazy(importFn);

  // Preload component if requested
  if (options.preload) {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      importFn().catch(() => {});
    }, 100);
  }

  return LazyComponent;
};

// Intersection observer-based component lazy loading
export const createIntersectionLazyComponent = <T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {},
) => {
  let isLoaded = false;
  let componentPromise: Promise<{ default: T }> | null = null;

  const loadComponent = () => {
    if (!isLoaded && !componentPromise) {
      componentPromise = importFn();
      isLoaded = true;
    }
    return componentPromise || importFn();
  };

  // Setup intersection observer for viewport-based loading
  if (typeof window !== "undefined" && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadComponent();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || "50px",
      },
    );

    // Auto-observe elements with data-lazy-component attribute
    document.addEventListener("DOMContentLoaded", () => {
      const lazyElements = document.querySelectorAll("[data-lazy-component]");
      lazyElements.forEach((el) => {
        observer.observe(el);
      });
    });
  }

  return lazy(loadComponent);
};

// Heavy dependency lazy loader
export const lazyImport = <T>(importFn: () => Promise<T>): (() => Promise<T>) => {
  let cachedImport: Promise<T> | null = null;

  return () => {
    if (!cachedImport) {
      cachedImport = importFn();
    }
    return cachedImport;
  };
};

// Three.js lazy loaders removed as part of @google/model-viewer unification
// loadThreeJS, loadThreeFiber, loadThreeDrei removed - will be replaced with @google/model-viewer loader

// Animation library lazy loaders
// loadGSAP removed to fix split-chunk warning (GSAP is statically imported in critical path)
// export const loadGSAP = lazyImport(() => import("gsap"));
// loadLocomotiveScroll removed - package no longer used (Block 4A cleanup)

// Lazy image loading with intersection observer
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private loadedImages = new Set<string>();

  constructor(options: LazyImageOptions = {}) {
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || "50px",
      });
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer?.unobserve(img);
      }
    });
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (src && !this.loadedImages.has(src)) {
      this.loadedImages.add(src);

      // Create a new image to preload
      const newImg = new Image();
      newImg.onload = () => {
        img.src = src;
        img.classList.add("loaded");
        img.classList.remove("loading");
      };
      newImg.onerror = () => {
        img.classList.add("error");
        img.classList.remove("loading");
      };
      newImg.src = src;
    }
  }

  public observe(img: HTMLImageElement) {
    if (this.observer) {
      img.classList.add("loading");
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  public disconnect() {
    this.observer?.disconnect();
    this.loadedImages.clear();
  }
}

// Global lazy image loader instance
export const globalLazyImageLoader = new LazyImageLoader({
  threshold: 0.1,
  rootMargin: "100px",
});

// Resource preloader for critical resources
export class ResourcePreloader {
  private preloadedResources = new Set<string>();

  public preloadImage(src: string, priority: "high" | "low" = "low"): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      if (priority === "high") {
        link.setAttribute("fetchpriority", "high");
      }

      link.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      link.onerror = reject;

      document.head.appendChild(link);
    });
  }

  public preloadVideo(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.href = src;

      link.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      link.onerror = reject;

      document.head.appendChild(link);
    });
  }

  public preloadFont(src: string, type: string = "font/ttf"): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(src)) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "font";
      link.type = type;
      link.href = src;
      link.crossOrigin = "anonymous";

      link.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      link.onerror = reject;

      document.head.appendChild(link);
    });
  }

  public isPreloaded(src: string): boolean {
    return this.preloadedResources.has(src);
  }
}

// Global resource preloader instance
export const globalResourcePreloader = new ResourcePreloader();

// Lazy loading utilities for specific use cases
export const LazyLoadingUtils = {
  // Preload critical homepage resources
  preloadCriticalResources: async () => {
    // Note: Only preload actual media assets that exist in the system
    // Removed invalid static file references
    const criticalImages: string[] = [
      // Add actual media IDs here when needed
      // Example: '/api/media/proxy/1', '/api/media/proxy/2'
    ];

    const criticalFonts: string[] = []; // Removed deleted font

    // Preload in parallel
    await Promise.all([
      ...criticalImages.map((src) => globalResourcePreloader.preloadImage(src, "high")),
      ...criticalFonts.map((src) => globalResourcePreloader.preloadFont(src)),
    ]);
  },

  // Setup lazy loading for all images on page
  setupLazyImages: () => {
    const images = document.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      globalLazyImageLoader.observe(img as HTMLImageElement);
    });
  },

  // Cleanup lazy loading observers
  cleanup: () => {
    globalLazyImageLoader.disconnect();
  },
};

export default LazyLoadingUtils;
