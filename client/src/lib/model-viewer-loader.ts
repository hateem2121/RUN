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
  
  loadingPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('[Model Viewer Loader] Starting local package initialization...');
      
      // CRITICAL FIX: Disable ImageBitmap to avoid Replit DevTools fetch interception
      // Forces @google/model-viewer to use HTMLImageElement for embedded textures
      if (typeof window !== 'undefined' && typeof window.createImageBitmap === 'function') {
        try {
          console.log('[Model Viewer Loader] 🛡️ Disabling ImageBitmap to prevent DevTools fetch conflicts...');
          const win = window as unknown as Record<string, unknown>;
          delete win.createImageBitmap;
          console.log('[Model Viewer Loader] ✅ ImageBitmap disabled - will use HTMLImageElement fallback');
        } catch (error) {
          console.warn('[Model Viewer Loader] Could not disable ImageBitmap:', error);
        }
      }
      
      // PHASE 2.1: Configure Lit for production mode before importing @google/model-viewer
      // This disables development warnings and optimizes performance
      if (typeof globalThis !== 'undefined') {
        const global = globalThis as Record<string, unknown>;
        
        // Set production mode flags for Lit
        global.litIsInSSR = false;
        global.litElementVersions = [];
        
        // Override process.env.NODE_ENV for Lit if needed
        if (typeof process === 'undefined') {
          global.process = { env: { NODE_ENV: 'production' } };
        } else if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
          // Force production mode for Lit even in development environment
          const originalEnv = process.env.NODE_ENV;
          process.env.NODE_ENV = 'production';
          
          console.log(`[Model Viewer Loader] 🎯 Configuring Lit for production mode (was: ${originalEnv})`);
        }
      }
      
      // Import the local @google/model-viewer package
      await import('@google/model-viewer');
      
      // Wait for custom element to be defined
      if (!customElements.get('model-viewer')) {
        console.log('[Model Viewer Loader] Waiting for custom element registration...');
        await customElements.whenDefined('model-viewer');
      }
      
      console.log('[Model Viewer Loader] ✅ Model Viewer successfully loaded and registered');
      isModelViewerLoaded = true;
      resolve();
    } catch (error) {
      console.error('[Model Viewer Loader] ❌ Failed to load model-viewer:', error);
      reject(error);
    }
  });
  
  return loadingPromise;
}

// Auto-initialize when this module is imported
if (typeof window !== 'undefined') {
  ensureModelViewerLoaded().catch(console.error);
}