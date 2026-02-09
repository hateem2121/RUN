import type { MediaAsset } from "@shared/schema";

/**
 * PHASE 3 ENHANCED: MediaService - Frontend service with WebP optimization support
 * Provides safe URL extraction, responsive image handling, and progressive loading
 */

export interface ResponsiveImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png" | "auto";
}

// biome-ignore lint/complexity/noStaticOnlyClass: service pattern
export class MediaService {
  /**
   * Generate safe URL from media asset, with fallback handling
   */
  /**
   * PHASE 3: Get responsive image URL with WebP optimization
   */
  static getResponsiveImageUrl(
    asset: MediaAsset | null | undefined,
    options: ResponsiveImageOptions = {},
  ): string | null {
    if (!asset || asset.type !== "image") {
      return MediaService.getSafeUrl(asset);
    }

    const { width = 800, format = "auto", quality = 85 } = options;
    const baseUrl = MediaService.getSafeUrl(asset);
    if (!baseUrl) {
      return null;
    }

    // Check if browser supports WebP (for format=auto)
    const supportsWebP = MediaService.supportsWebP();
    const targetFormat = format === "auto" ? (supportsWebP ? "webp" : "jpeg") : format;

    // Generate responsive parameters
    const params = new URLSearchParams();
    params.set("w", width.toString());
    params.set("q", quality.toString());
    params.set("f", targetFormat);

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate thumbnail URL for image assets
   */
  static getThumbnailUrl(asset: MediaAsset | null | undefined, size: number = 150): string | null {
    if (!asset) {
      return null;
    }

    // Use responsive image system for thumbnails
    return MediaService.getResponsiveImageUrl(asset, {
      width: size,
      height: size,
    });
  }

  static getSafeUrl(asset: MediaAsset | null | undefined): string | null {
    if (!asset) {
      return null;
    }

    try {
      // Prefer API-provided URL first (ID-based proxy URLs)
      if (asset.url && typeof asset.url === "string") {
        // Validate URL doesn't contain 'undefined'
        if (asset.url.includes("undefined") || asset.url.includes("null")) {
          return MediaService.generateIdBasedUrl(asset);
        }

        // Return valid API-provided URL
        return asset.url;
      }

      // Fallback to ID-based proxy URL (recommended)
      return MediaService.generateIdBasedUrl(asset);
    } catch (_error) {
      return null;
    }
  }

  /**
   * Generate safe URL with integer overflow protection
   */
  private static generateIdBasedUrl(asset: MediaAsset): string | null {
    if (!asset.id || typeof asset.id !== "number") {
      return MediaService.generateFallbackUrl(asset);
    }

    // SAFETY: Prevent PostgreSQL integer overflow by checking ID size
    if (asset.id >= 1000000000000) {
      return null;
    }

    return `/api/media/${asset.id}/content`;
  }

  /**
   * Generate fallback proxy URL from asset filename (legacy support)
   */
  private static generateFallbackUrl(asset: MediaAsset): string | null {
    if (!asset.filename || typeof asset.filename !== "string") {
      return null;
    }

    // Validate filename doesn't contain 'undefined'
    if (asset.filename.includes("undefined") || asset.filename.includes("null")) {
      return null;
    }
    return null;
  }

  /**
   * Validate media asset has required fields
   */
  static isValidAsset(asset: unknown): asset is MediaAsset {
    if (!asset || typeof asset !== "object") {
      return false;
    }

    const obj = asset as Record<string, any>;
    return (
      typeof obj.id === "number" &&
      typeof obj.filename === "string" &&
      obj.filename.length > 0 &&
      !obj.filename.includes("undefined") &&
      !obj.filename.includes("null") &&
      typeof obj.originalName === "string" &&
      obj.originalName.length > 0
    );
  }

  /**
   * Get video thumbnail URL (placeholder for future video thumbnail generation)
   */
  static getVideoThumbnailUrl(asset: MediaAsset): string | null {
    if (asset.type !== "video") {
      return MediaService.getSafeUrl(asset);
    }

    // For video assets, check if thumbnailFilename exists (actual property)
    if (asset.thumbnailFilename && asset.thumbnailFilename.length > 0) {
      return null;
    }

    // Fallback to main URL
    return MediaService.getSafeUrl(asset);
  }

  /**
   * Get display-ready filename (remove timestamp prefix)
   */
  static getDisplayName(asset: MediaAsset): string {
    if (!asset.originalName) {
      return asset.filename || "Unknown";
    }
    return asset.originalName;
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return "0 Bytes";
    }

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Get media type icon name for Lucide React
   */
  static getTypeIcon(type: string): string {
    switch (type) {
      case "image":
        return "Image";
      case "video":
        return "Video";
      case "3d_model":
        return "Box";
      case "pdf":
        return "FileText";
      default:
        return "File";
    }
  }

  /**
   * Check if asset can be previewed inline
   */
  static canPreview(asset: MediaAsset): boolean {
    const previewableTypes = ["image", "video", "3d_model", "pdf"];
    return previewableTypes.includes(asset.type);
  }

  /**
   * PHASE 3: Check if browser supports WebP
   */
  private static supportsWebP(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
    } catch {
      return false;
    }
  }

  /**
   * PHASE 3: Get optimal image size based on container dimensions
   */
  static getOptimalSize(containerWidth: number, _containerHeight?: number): ResponsiveImageOptions {
    // Mobile breakpoint
    if (containerWidth <= 480) {
      return { width: 480, quality: 85, format: "auto" };
    }

    // Tablet breakpoint
    if (containerWidth <= 768) {
      return { width: 768, quality: 90, format: "auto" };
    }

    // Desktop breakpoint
    return { width: 1200, quality: 95, format: "auto" };
  }

  /**
   * PHASE 3: Generate srcset for responsive images
   */
  static generateSrcSet(asset: MediaAsset | null | undefined): string {
    if (!asset || asset.type !== "image") {
      return "";
    }

    const baseUrl = MediaService.getSafeUrl(asset);
    if (!baseUrl) {
      return "";
    }

    const sizes = [480, 768, 1200];
    const srcset = sizes
      .map((size) => {
        const params = new URLSearchParams();
        params.set("w", size.toString());
        params.set("q", size <= 480 ? "85" : size <= 768 ? "90" : "95");
        params.set("f", "auto");
        return `${baseUrl}?${params.toString()} ${size}w`;
      })
      .join(", ");

    return srcset;
  }

  /**
   * PHASE 3: Check if image should be optimized
   */
  static shouldOptimize(asset: MediaAsset): boolean {
    if (asset.type !== "image") {
      return false;
    }
    if (!asset.size) {
      return false;
    }
    if (asset.filename?.toLowerCase().endsWith(".svg")) {
      return false;
    }

    // Only optimize files larger than 1MB
    return asset.size > 1024 * 1024;
  }
}
