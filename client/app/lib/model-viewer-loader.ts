// Model Viewer Loader - Ensures proper registration without conflicts
// This replaces the CDN loading with proper local package initialization

import { gltfCache } from "./gltf-cache";

let isModelViewerLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Loads a 3D model through the IndexedDB cache layer, returning a cached object URL.
 */
export async function loadCachedModelUrl(url: string): Promise<string> {
  return gltfCache.fetchWithCache(url);
}

export async function ensureModelViewerLoaded(): Promise<void> {
  if (isModelViewerLoaded) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const run = async () => {
      try {
        // PHASE 2.1: Configure Lit for production mode before importing @google/model-viewer
        // This disables development warnings and optimizes performance without mutating process.env
        if (typeof globalThis !== "undefined") {
          const global = globalThis as Record<string, unknown>;

          // Set production mode flags for Lit
          global.litIsInSSR = false;
          global.litElementVersions = [];
          global.litDisableDevelopmentMode = true;
        }

        // Import the local @google/model-viewer package
        await import("@google/model-viewer");

        // Wait for custom element to be defined
        if (!customElements.get("model-viewer")) {
          await customElements.whenDefined("model-viewer");
        }
        isModelViewerLoaded = true;
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    run();
  });

  return loadingPromise;
}

// Auto-initialize when this module is imported
if (typeof window !== "undefined") {
  ensureModelViewerLoaded().catch(console.error);
}
