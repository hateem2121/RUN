// Model Viewer Loader - Ensures proper registration without conflicts
// This replaces the CDN loading with proper local package initialization

let isModelViewerLoaded = false;
let loadingPromise: Promise<void> | null = null;

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
        // CRITICAL FIX: Disable ImageBitmap to avoid Replit DevTools fetch interception
        // Forces @google/model-viewer to use HTMLImageElement for embedded textures
        if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
          try {
            const win = window as unknown as Record<string, unknown>;
            delete win.createImageBitmap;
          } catch (_error) {}
        }

        // PHASE 2.1: Configure Lit for production mode before importing @google/model-viewer
        // This disables development warnings and optimizes performance
        if (typeof globalThis !== "undefined") {
          const global = globalThis as Record<string, unknown>;

          // Set production mode flags for Lit
          global.litIsInSSR = false;
          global.litElementVersions = [];

          // Override process.env['NODE_ENV'] for Lit if needed
          if (typeof process === "undefined") {
            global.process = { env: { NODE_ENV: "production" } };
          } else if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
            // Force production mode for Lit even in development environment
            process.env.NODE_ENV = "production";
          }
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
  // biome-ignore lint/suspicious/noConsole: CLI
  ensureModelViewerLoaded().catch(console.error);
}
