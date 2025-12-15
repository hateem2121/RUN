/**
 * Media Resolver Service
 * Handles robust media ID resolution and provides graceful fallbacks
 */

import type { MediaAsset } from "@shared/schema";

// Development-only logging
const errorLog = (message: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error(message, ...args);
  }
};

const warnLog = (message: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.warn(message, ...args);
  }
};

export interface MediaResolverOptions {
  fallbackAssetId?: number;
  enableLogging?: boolean;
}

export class MediaResolver {
  private static assets: MediaAsset[] = [];
  private static _enableLogging = false;
    public static get enableLogging() {
        return MediaResolver._enableLogging;
    }
    public static set enableLogging(value) {
        MediaResolver._enableLogging = value;
    }
  private static isInitialized = false;

  static initialize(assets: MediaAsset[], options?: MediaResolverOptions) {
    this.assets = assets || [];
    this.enableLogging = options?.enableLogging || false;
    this.isInitialized = true;
  }

  static getAsset(id?: number): MediaAsset | null {
    if (!id || !this.isInitialized || !this.assets) {
      return null;
    }
    
    const asset = this.assets.find(asset => asset.id === id);
    
    return asset || null;
  }

  static getAssetUrl(id?: number, fallbackId?: number): string | null {
    const asset = this.getAsset(id) || this.getAsset(fallbackId);
    
    if (!asset) {
      return null;
    }

    // SAFETY: Prevent PostgreSQL integer overflow by checking ID size
    if (asset.id >= 1000000000000) {
      warnLog('[MediaResolver] ID too large, skipping to prevent database overflow:', asset.id);
      return null;
    }

    return `/api/media/${asset.id}/content`;
  }

  static validateAssetExists(id?: number): boolean {
    if (!id || !this.isInitialized || !this.assets) return false;
    return this.assets.some(asset => asset.id === id);
  }

  static getFirstValidAssetId(ids: (number | undefined)[]): number | null {
    for (const id of ids) {
      if (id && this.validateAssetExists(id)) {
        return id;
      }
    }
    return null;
  }

  static getAssetsByType(type: string): MediaAsset[] {
    if (!this.isInitialized || !this.assets) return [];
    return this.assets.filter(asset => asset.type === type);
  }

  static getRandomAssetId(type?: string): number | null {
    if (!this.isInitialized || !this.assets) return null;
    
    const filteredAssets = type ? this.getAssetsByType(type) : this.assets;
    if (filteredAssets.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * filteredAssets.length);
    const asset = filteredAssets[randomIndex];
    return asset ? asset.id : null;
  }

  static healthCheck(): {
    totalAssets: number;
    imageAssets: number;
    videoAssets: number;
    availableIds: number[];
    isInitialized: boolean;
  } {
    if (!this.isInitialized || !this.assets) {
      return {
        totalAssets: 0,
        imageAssets: 0,
        videoAssets: 0,
        availableIds: [],
        isInitialized: false
      };
    }

    return {
      totalAssets: this.assets.length,
      imageAssets: this.getAssetsByType('image').length,
      videoAssets: this.getAssetsByType('video').length,
      availableIds: this.assets.map(a => a.id).sort((a, b) => a - b),
      isInitialized: true
    };
  }
}

/**
 * React Hook for using MediaResolver
 */
export function useMediaResolver(assets: MediaAsset[]) {
  // Initialize resolver SYNCHRONOUSLY during render - NOT in useEffect or useLayoutEffect!
  // This ensures assets are available immediately when JSX expressions execute
  // ONLY initialize if we have assets (prevent empty array from wiping out valid data)
  try {
    if (assets && assets.length > 0) {
      MediaResolver.initialize(assets, { enableLogging: false });
    }
  } catch (error) {
    errorLog('[useMediaResolver] Initialization failed:', error);
  }

  const getAssetUrl = (id?: number, fallback?: number) => {
    try {
      return MediaResolver.getAssetUrl(id, fallback);
    } catch (error) {
      warnLog('[useMediaResolver] getAssetUrl failed:', error);
      return null;
    }
  };

  const getAsset = (id?: number) => {
    try {
      return MediaResolver.getAsset(id);
    } catch (error) {
      warnLog('[useMediaResolver] getAsset failed:', error);
      return null;
    }
  };

  const validateAsset = (id?: number) => {
    try {
      return MediaResolver.validateAssetExists(id);
    } catch (error) {
      warnLog('[useMediaResolver] validateAsset failed:', error);
      return false;
    }
  };

  const findValidAsset = (ids: (number | undefined)[]) => {
    try {
      return MediaResolver.getFirstValidAssetId(ids);
    } catch (error) {
      warnLog('[useMediaResolver] findValidAsset failed:', error);
      return null;
    }
  };

  const healthCheck = () => {
    try {
      return MediaResolver.healthCheck();
    } catch (error) {
      warnLog('[useMediaResolver] healthCheck failed:', error);
      return {
        totalAssets: 0,
        imageAssets: 0,
        videoAssets: 0,
        availableIds: [],
        isInitialized: false
      };
    }
  };

  return {
    getAssetUrl,
    getAsset,
    validateAsset,
    findValidAsset,
    healthCheck
  };
}