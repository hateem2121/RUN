/**
 * CONSOLIDATED Frontend MediaUrlBuilder - Synchronized with Server Architecture
 * Unified URL generation with consistent behavior across client and server
 */

import type { MediaAsset } from "@shared/index";

// Type aliases using canonical MediaAsset from shared schema
export type MediaAssetBasic = Pick<MediaAsset, "id" | "url">;
export type MediaAssetWithMetadata = Pick<
  MediaAsset,
  "id" | "mimeType" | "originalName" | "filename"
>;

export type MediaPriority = "low" | "medium" | "high";
export type MediaContext = "grid" | "detail" | "thumbnail";

// In-flight request tracking types
interface InFlightRequest {
  promise: Promise<string>;
  controller: AbortController;
  timestamp: number;
}

// biome-ignore lint/complexity/noStaticOnlyClass: service pattern
export class MediaUrlBuilder {
  /**
   * Build a content URL for a media asset ID (ID-based for reliability)
   * UNIFIED: Now uses the new REST-compliant /content endpoint
   */
  static buildContentUrl(id: number | undefined | null): string | null {
    if (!id || id <= 0) {
      if (import.meta.env.DEV) {
      }
      return null;
    }

    // UNIFIED API: Use new REST-compliant content endpoint
    const baseUrl = `/api/media/${id}/content`;
    const cdnUrl = import.meta.env.VITE_CDN_URL;

    // Phase 2: CDN Support
    const fullUrl = cdnUrl ? `${cdnUrl}${baseUrl}` : baseUrl;

    // Phase 2: Cache Busting (if version provided)
    // We append it as query param ?v=...
    // Note: The caller needs to append this if they have the asset metadata
    return fullUrl;
  }

  /**
   * Helper to append version parameter for cache busting
   */
  static appendVersion(url: string | null, updatedAt?: string | Date | number): string | null {
    if (!url || !updatedAt) return url;

    const version =
      typeof updatedAt === "object" && "toISOString" in updatedAt
        ? updatedAt.toISOString()
        : String(updatedAt);

    // Simple hash of the timestamp
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${btoa(version).slice(0, 8)}`;
  }

  /**
   * @deprecated PHASE 2.2: Raw endpoint no longer needed with unified strategy
   * All model files now use the content endpoint since they have embedded textures.
   * Kept for backward compatibility only.
   */
  static buildRawContentUrl(id: number | undefined | null): string | null {
    if (import.meta.env.DEV) {
    }
    return MediaUrlBuilder.buildContentUrl(id);
  }

  /**
   * Extract asset ID from any supported proxy URL format
   * Supports legacy and new consolidated formats
   */
  static extractAssetId(url: string): number | null {
    if (!url) {
      return null;
    }

    // New unified format: /api/media/{id}/content (preferred)
    if (url.includes("/content")) {
      const contentMatch = url.match(/\/api\/media\/(\d+)\/content/);
      if (contentMatch?.[1]) {
        const id = parseInt(contentMatch[1], 10);
        return Number.isNaN(id) ? null : id;
      }
    }

    // Legacy proxy format: /api/media/proxy/{id} (backward compatibility)
    if (url.startsWith("/api/media/proxy/")) {
      const segments = url.split("/");
      const idStr = segments[4]; // /api/media/proxy/{id}
      if (idStr) {
        const id = parseInt(idStr, 10);
        return Number.isNaN(id) ? null : id;
      }
    }

    // Legacy metadata format: /api/media/{id} (not for file serving)
    if (url.startsWith("/api/media/") && !url.includes("/proxy/")) {
      const segments = url.split("/");
      const idStr = segments[3]; // /api/media/{id}
      if (idStr) {
        const id = parseInt(idStr, 10);
        return Number.isNaN(id) ? null : id;
      }
    }

    // Legacy formats support for migration
    if (url.startsWith("/api/media/proxy/") || url.startsWith("/api/media/fast/")) {
      const idStr = url.replace("/api/media/proxy/", "").replace("/api/media/fast/", "");
      const id = parseInt(idStr, 10);
      return Number.isNaN(id) ? null : id;
    }

    return null;
  }

  /**
   * Build URL with comprehensive validation and fallback
   * Enhanced error handling and logging
   */
  static buildUrlSafe(id: number | undefined | null, fallback?: string): string {
    const url = MediaUrlBuilder.buildContentUrl(id);

    if (url && MediaUrlBuilder.isValidUrl(url)) {
      return url;
    }

    if (import.meta.env.DEV) {
    }

    return (
      fallback ||
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTA1LjUyMyA3MCAxMTAgNzQuNDc3IDExMCA4MEM4NTUuNDc3IDgwIDUwIDg0LjQ3NyA1MCA5MEw1MCA5MEM1MCA5NS41MjMgNTQuNDc3IDEwMCA2MCAxMDBIMTQwQzE0NS1MjMgMTAwIDE1MCA5NS41MjMgMTUwIDkwVjkwQzE1MCA4NC40NzcgMTQ1LjUyMyA4MCAxNDAgODBIMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8Y2lyY2xlIGN4PSI3NSIgY3k9IjgwIiByPSI1IiBmaWxsPSIjNjM3MEZGIi8+Cjwvc3ZnPgo="
    );
  }

  /**
   * PHASE 2 OPTIMIZATION: Build thumbnail URL for lightweight grid loading
   * Uses query parameters to request thumbnails for better performance
   */
  static buildThumbnailUrl(
    id: number | undefined | null,
    priority: MediaPriority = "low",
    fallback?: string,
  ): string {
    if (!id || id <= 0) {
      return fallback || MediaUrlBuilder.buildUrlSafe(id, fallback);
    }

    const baseUrl = MediaUrlBuilder.buildContentUrl(id);
    if (!baseUrl) {
      return fallback || MediaUrlBuilder.buildUrlSafe(id, fallback);
    }

    // Add thumbnail query parameters for backend optimization
    return `${baseUrl}?thumbnail=true&priority=${priority}`;
  }

  /**
   * PC-501: Build srcSet for responsive images
   * Leverages /thumbnail and /content endpoints as variants
   */
  static buildSrcSet(id: number | undefined | null): string | undefined {
    if (!id || id <= 0) return undefined;

    const thumbnail = `/api/media/${id}/thumbnail`;
    const content = `/api/media/${id}/content`;

    return `${thumbnail} 400w, ${content} 1200w`;
  }

  /**
   * Smart URL builder - automatically chooses thumbnail for grid contexts
   */
  static buildSmartUrl(
    id: number | undefined | null,
    context: MediaContext = "detail",
    priority: MediaPriority = "low",
    fallback?: string,
  ): string {
    if (context === "grid" || context === "thumbnail") {
      return MediaUrlBuilder.buildThumbnailUrl(id, priority, fallback);
    }
    return MediaUrlBuilder.buildUrlSafe(id, fallback);
  }

  /**
   * PHASE 2.2: UNIFIED - Single endpoint strategy for all model assets
   *
   * With Phase 1 GLTF validation ensuring only embedded-texture files are uploaded,
   * we can now use a single endpoint strategy for maximum simplicity and reliability.
   *
   * All GLTF/GLB files are guaranteed to have embedded textures, so the complex
   * endpoint selection logic is no longer needed.
   */
  static buildModelUrlSafe(
    id: number | undefined | null,
    _asset?: MediaAssetWithMetadata,
    fallback?: string,
  ): string {
    if (!id || id <= 0) {
      if (import.meta.env.DEV) {
      }
      return fallback || MediaUrlBuilder.getDefaultModelFallback();
    }

    // PHASE 2.2: UNIFIED - Single endpoint for all model files
    // Since Phase 1 validation ensures embedded textures, use content endpoint for everything
    let url = MediaUrlBuilder.buildContentUrl(id);

    // Phase 2: Add cache busting if asset metadata is available
    if (_asset && "updatedAt" in _asset) {
      url = MediaUrlBuilder.appendVersion(
        url,
        (_asset as MediaAssetWithMetadata & { updatedAt?: string | Date | number }).updatedAt,
      );
    }

    if (import.meta.env.DEV) {
      // debug
    }

    if (url && MediaUrlBuilder.isValidUrl(url)) {
      return url;
    }

    if (import.meta.env.DEV) {
    }

    return fallback || MediaUrlBuilder.getDefaultModelFallback();
  }

  /**
   * ARCHITECT FEEDBACK FIX: In-flight request tracking to prevent race conditions
   */
  private static inFlightRequests = new Map<string, InFlightRequest>();
  private static readonly REQUEST_TTL = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_BASE = 1000; // 1 second

  /**
   * ARCHITECT FEEDBACK FIX: Comprehensive request deduplication with cancellation
   */
  static buildModelUrlSafeWithRetry(
    id: number | undefined | null,
    asset?: MediaAssetWithMetadata,
    fallback?: string,
    retryCount: number = 0,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create cache key for deduplication
      const cacheKey = `model_${id}_${asset?.mimeType || ""}_${asset?.originalName || ""}`;

      // Check for existing in-flight request
      const existing = MediaUrlBuilder.inFlightRequests.get(cacheKey);
      const now = Date.now();

      if (existing && now - existing.timestamp < MediaUrlBuilder.REQUEST_TTL) {
        // Return existing promise to prevent duplicate requests
        existing.promise.then(resolve).catch(reject);
        return;
      }

      // Cancel any existing request
      if (existing) {
        existing.controller.abort();
        MediaUrlBuilder.inFlightRequests.delete(cacheKey);
      }

      // Create new AbortController for this request
      const controller = new AbortController();

      // Create the promise with retry logic
      const promise = MediaUrlBuilder.executeWithRetry(
        id,
        asset,
        fallback,
        retryCount,
        controller.signal,
      );

      // Track in-flight request
      MediaUrlBuilder.inFlightRequests.set(cacheKey, {
        promise,
        controller,
        timestamp: now,
      });

      // Clean up when done
      promise.finally(() => {
        MediaUrlBuilder.inFlightRequests.delete(cacheKey);
        MediaUrlBuilder.cleanupInFlightRequests();
      });

      promise.then(resolve).catch(reject);
    });
  }

  /**
   * ARCHITECT FEEDBACK FIX: Exponential backoff retry with endpoint failover
   */
  private static async executeWithRetry(
    id: number | undefined | null,
    asset?: MediaAssetWithMetadata,
    fallback?: string,
    retryCount: number = 0,
    signal?: AbortSignal,
  ): Promise<string> {
    try {
      // Check if request was cancelled
      if (signal?.aborted) {
        throw new Error("Request cancelled");
      }

      // Build URL using current logic
      const url = MediaUrlBuilder.buildModelUrlSafe(id, asset, fallback);

      // Validate URL can be fetched (for HTTP URLs only)
      if (url.startsWith("/api/media/")) {
        await MediaUrlBuilder.validateEndpoint(url, signal);
      }

      return url;
    } catch (_error) {
      // Check if we should retry
      if (retryCount < MediaUrlBuilder.MAX_RETRIES && !signal?.aborted) {
        const delay = MediaUrlBuilder.RETRY_DELAY_BASE * 2 ** retryCount; // Exponential backoff

        if (import.meta.env.DEV) {
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Try endpoint failover on retry
        if (retryCount === 1) {
          // On second retry, try switching endpoint if possible
          const altAsset = MediaUrlBuilder.createAlternativeAsset(asset);
          return MediaUrlBuilder.executeWithRetry(id, altAsset, fallback, retryCount + 1, signal);
        }

        return MediaUrlBuilder.executeWithRetry(id, asset, fallback, retryCount + 1, signal);
      }

      // Max retries reached or cancelled, use fallback
      if (import.meta.env.DEV) {
      }

      return fallback || MediaUrlBuilder.getDefaultModelFallback();
    }
  }

  /**
   * ARCHITECT FEEDBACK FIX: Endpoint validation with timeout
   */
  private static async validateEndpoint(url: string, signal?: AbortSignal): Promise<void> {
    if (typeof window === "undefined") {
      return; // Skip in SSR
    }

    try {
      const response = await fetch(url, {
        method: "HEAD", // Just check if endpoint exists
        signal: signal ?? null,
        cache: "no-cache",
      });

      if (!response.ok) {
        throw new Error(`Endpoint validation failed: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error; // Re-throw cancellation
      }
      throw new Error(`Endpoint unreachable: ${error}`);
    }
  }

  /**
   * ARCHITECT FEEDBACK FIX: Create alternative asset for endpoint failover
   */
  private static createAlternativeAsset(
    asset?: MediaAssetWithMetadata,
  ): MediaAssetWithMetadata | undefined {
    if (!asset) {
      return asset;
    }

    // Try switching between GLB and GLTF for failover
    const currentMime = asset.mimeType;
    let altMime = currentMime;

    if (currentMime === "model/gltf-binary") {
      altMime = "model/gltf+json"; // Try GLTF endpoint instead
    } else if (currentMime === "model/gltf+json") {
      altMime = "model/gltf-binary"; // Try GLB endpoint instead
    }

    return {
      ...asset,
      mimeType: altMime,
    };
  }

  /**
   * ARCHITECT FEEDBACK FIX: Cleanup old in-flight requests
   */
  private static cleanupInFlightRequests(): void {
    const now = Date.now();
    for (const [key, entry] of MediaUrlBuilder.inFlightRequests.entries()) {
      if (now - entry.timestamp > MediaUrlBuilder.REQUEST_TTL) {
        entry.controller.abort();
        MediaUrlBuilder.inFlightRequests.delete(key);
      }
    }
  }

  /**
   * PHASE 5 FIX: Enhanced ImageBitmapLoader-compatible fallback validation
   */
  private static getDefaultModelFallback(): string {
    // PHASE 5 FIX: Multiple fallback strategies for maximum ImageBitmapLoader compatibility

    // Strategy 1: Try 1x1 transparent PNG (most compatible)
    const pngFallback =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    // Strategy 2: Validate the fallback can be loaded by ImageBitmapLoader
    if (typeof window !== "undefined" && "createImageBitmap" in window) {
      try {
        // Test if ImageBitmapLoader can handle our fallback
        const testImg = new Image();
        testImg.src = pngFallback;
        return pngFallback;
      } catch (_error) {
        // If PNG fails, try a simple colored square
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAE0lEQVR42mN8/+8fAzYwOjjAAQBKLwH+VzVWogAAAABJRU5ErkJggg==";
      }
    }

    return pngFallback;
  }

  /**
   * PHASE 5 FIX: Enhanced URL validation with ImageBitmapLoader compatibility checks
   */
  static isValidUrl(url: string | null | undefined): boolean {
    if (!url) {
      return false;
    }
    if (url === "undefined" || url === "null") {
      return false;
    }
    if (url.includes("undefined") || url.includes("null")) {
      return false;
    }
    if (url === "/api/media/proxy/undefined") {
      return false;
    }
    if (url === "/api/media/fast/undefined") {
      return false;
    }
    if (url === "/api/media/undefined") {
      return false;
    }

    // PHASE 5 FIX: Additional validation for ImageBitmapLoader compatibility

    // Check for valid URL format
    try {
      if (url.startsWith("data:")) {
        // Validate data URLs
        const mimeMatch = url.match(/^data:([^;]+)/);
        if (!mimeMatch || !mimeMatch[1]) {
          return false;
        }

        const mimeType = mimeMatch[1];
        // Ensure ImageBitmapLoader-compatible MIME types
        const compatibleTypes = ["image/png", "image/jpeg", "image/webp", "image/bmp"];
        return compatibleTypes.includes(mimeType);
      }

      if (url.startsWith("/api/media/")) {
        // Validate API endpoint format
        const pathParts = url.split("/");
        return (
          pathParts.length >= 4 &&
          pathParts[3] !== undefined &&
          !Number.isNaN(parseInt(pathParts[3], 10))
        );
      }

      // For other URLs, do basic validation
      return url.startsWith("http") || url.startsWith("/");
    } catch (_error) {
      if (import.meta.env.DEV) {
      }
      return false;
    }
  }

  /**
   * Convert legacy URL formats to the new consolidated format
   * Facilitates migration from old proxy/fast URLs to new endpoint
   */
  static migrateToConsolidatedUrl(url: string): string | null {
    const assetId = MediaUrlBuilder.extractAssetId(url);
    return assetId ? MediaUrlBuilder.buildContentUrl(assetId) : null;
  }

  /**
   * Validate asset data and generate consistent URL
   * Mirrors server-side asset URL generation logic
   */
  static generateAssetUrl(asset: MediaAssetBasic): string | null {
    if (!asset) {
      return null;
    }

    // Prefer ID-based URL generation for consistency
    if (asset.id) {
      return MediaUrlBuilder.buildContentUrl(asset.id);
    }

    // Fallback to existing URL if valid
    if (asset.url && MediaUrlBuilder.isValidUrl(asset.url)) {
      // Migrate legacy URLs to consolidated format
      return MediaUrlBuilder.migrateToConsolidatedUrl(asset.url) || asset.url;
    }

    return null;
  }
}
