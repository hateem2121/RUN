/**
 * Smart Resolution Detection Utility
 * Automatically determines optimal image resolution based on viewport and device capabilities
 */

export type ImageResolution = "thumbnail" | "medium" | "high" | "original";

interface ViewportInfo {
  width: number;
  height: number;
  pixelRatio: number;
  isRetina: boolean;
}

/**
 * Get current viewport information
 */
export function getViewportInfo(): ViewportInfo {
  if (typeof window === "undefined") {
    return {
      width: 1200,
      height: 800,
      pixelRatio: 1,
      isRetina: false,
    };
  }

  const width = window.innerWidth || document.documentElement.clientWidth || 1200;
  const height = window.innerHeight || document.documentElement.clientHeight || 800;
  const pixelRatio = window.devicePixelRatio || 1;

  return {
    width,
    height,
    pixelRatio,
    isRetina: pixelRatio > 1,
  };
}

/**
 * Determine optimal resolution based on viewport and image size requirements
 */
export function getOptimalResolution(
  expectedImageWidth: number = 1200,
  forceHighQuality: boolean = false,
): ImageResolution {
  const viewport = getViewportInfo();

  // Force high quality for large displays or when explicitly requested
  if (forceHighQuality || viewport.width > 1920 || viewport.isRetina) {
    return "high"; // 2400x2400 at 90% quality
  }

  // Calculate effective image size considering pixel ratio
  const effectiveImageWidth = expectedImageWidth * viewport.pixelRatio;

  if (effectiveImageWidth <= 400) {
    return "thumbnail"; // 400x400 at 80% quality
  } else if (effectiveImageWidth <= 1200) {
    return "medium"; // 1200x1200 at 85% quality
  } else {
    return "high"; // 2400x2400 at 90% quality
  }
}

/**
 * Get optimized media URL with smart resolution
 */
export function getOptimizedMediaUrl(
  assetId: number,
  expectedWidth: number = 1200,
  forceHighQuality: boolean = false,
): string {
  const resolution = getOptimalResolution(expectedWidth, forceHighQuality);
  return `/api/media/${assetId}/content?resolution=${resolution}`;
}

/**
 * Enhance asset URL with smart resolution
 */
export function enhanceAssetUrl(
  asset: { id: string | number; url: string },
  expectedWidth: number = 1200,
): string {
  // If URL is already a proxy URL, use it as-is
  if (asset.url.includes("/api/media/")) {
    return asset.url;
  }

  // Convert ID to number and use smart resolution for direct asset references
  const assetId = typeof asset.id === "string" ? parseInt(asset.id, 10) : asset.id;
  return getOptimizedMediaUrl(assetId, expectedWidth, true); // Force high quality for main product images
}
