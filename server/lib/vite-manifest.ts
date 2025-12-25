import fs from "node:fs";
import path from "node:path";

/**
 * Strict Types for Vite Manifest (Client Build)
 * https://vitejs.dev/guide/backend-integration.html
 */
export interface ManifestChunk {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
  assets?: string[];
}

export type ViteManifest = Record<string, ManifestChunk>;

export interface CollectedAssets {
  css: string[];
  preload: string[]; // JS modules to modulepreload
}

/**
 * Dedicated Asset Manager for SSR
 * Handles recursive asset collection, deduplication, and production manifest lookup.
 */
export class ViteAssetManager {
  private manifest: ViteManifest | null = null;
  private readonly root: string;

  constructor(rootPath: string) {
    this.root = rootPath;
    this.loadManifest();
  }

  private loadManifest() {
    try {
      // Production build output location for manifest
      // Vite v5+ / v6 typically puts it in .vite/manifest.json if build.manifest is true
      const manifestPath = path.resolve(this.root, "dist/public/.vite/manifest.json");
      if (fs.existsSync(manifestPath)) {
        this.manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      } else {
        // Fallback for older Vite versions or specific configs
        const legacyPath = path.resolve(this.root, "dist/public/manifest.json");
        if (fs.existsSync(legacyPath)) {
          this.manifest = JSON.parse(fs.readFileSync(legacyPath, "utf-8"));
        }
      }
    } catch (e) {
      console.error("[ViteAssetManager] Failed to load manifest:", e);
      this.manifest = null;
    }
  }

  /**
   * Finds the Main Entry Chunk
   * Heuristic: Look for 'index.html', then specific entry files, then any chunk marked isEntry.
   */
  private getEntryChunk(): ManifestChunk | undefined {
    if (!this.manifest) return undefined;

    // 1. Standard Vite Entry Key
    if (this.manifest["index.html"]) return this.manifest["index.html"];

    // 2. Client Entry Source Key
    if (this.manifest["client/src/entry-client.tsx"])
      return this.manifest["client/src/entry-client.tsx"];
    if (this.manifest["src/entry-client.tsx"]) return this.manifest["src/entry-client.tsx"];

    // 3. Search for isEntry flag
    return Object.values(this.manifest).find((chunk) => chunk.isEntry === true);
  }

  /**
   * Recursively collects CSS and JS chunks for preloading
   * starting from the main entry point.
   */
  public getCriticalAssets(): CollectedAssets {
    const assets: CollectedAssets = { css: [], preload: [] };
    const seen = new Set<string>();

    const entry = this.getEntryChunk();
    if (!entry || !this.manifest) return assets;

    const collectRecursive = (chunkName: string) => {
      // In manifest, keys are file paths (src/...) or names
      // Ensure we look up by the correct key.
      // Sometimes imports are direct chunk filenames in the output.

      // If passing a chunk OBJECT directly creates recursion issues, we assume key driven
      const chunk = this.manifest?.[chunkName];
      if (!chunk) return;

      // Avoid cycles
      if (seen.has(chunk.file)) return;
      seen.add(chunk.file);

      // Collect CSS
      if (chunk.css) {
        chunk.css.forEach((cssFile) => {
          if (!assets.css.includes(cssFile)) assets.css.push(cssFile);
        });
      }

      // Collect Module Preload (JS)
      // Only preload import dependencies, NOT dynamicImports (lazy loaded)
      if (chunk.imports) {
        chunk.imports.forEach((importKey) => {
          collectRecursive(importKey); // Recurse
          // Add the chunk itself to preloads if it's a JS file
          const importChunk = this.manifest?.[importKey];
          if (importChunk?.file && !assets.preload.includes(importChunk.file)) {
            assets.preload.push(importChunk.file);
          }
        });
      }
    };

    // Find the key for the entry chunk to start recursion
    // The entry chunk object 'entry' comes from values; we need its Key or we pass it manually?
    // Actually imports[] are Keys into the manifest.

    // We already have the entry Object. Let's process it manually first, then its imports.
    if (entry.css) {
      entry.css.forEach((css) => {
        if (!assets.css.includes(css)) assets.css.push(css);
      });
    }

    // Process entry imports
    if (entry.imports) {
      entry.imports.forEach((key) => collectRecursive(key));
    }

    // Ensure the entry JS file itself is not preloaded (it's loaded by script tag usually),
    // OR we preload it too? Usually script tag is enough.

    return assets;
  }

  /**
   * Generates HTML tags for injection
   * P2 Enhancement: Deferred loading for non-critical CSS
   */
  public generateInjectionHtml(): string {
    const { css, preload } = this.getCriticalAssets();

    // Split CSS into critical (above-fold) and deferred
    const _criticalPatterns = [/index/, /base/, /reset/];
    const deferredPatterns = [/admin/, /dashboard/, /chart/, /animation/];

    const criticalCss: string[] = [];
    const deferredCss: string[] = [];

    css.forEach((file) => {
      const isDeferred = deferredPatterns.some((pattern) => pattern.test(file));
      if (isDeferred) {
        deferredCss.push(file);
      } else {
        criticalCss.push(file);
      }
    });

    const linkTags = [
      // CSS Preloads (High Priority) - Critical only
      ...criticalCss.map((file) => `<link rel="preload" href="/${file}" as="style">`),
      // JS Preloads (Parallel Fetch)
      ...preload.map((file) => `<link rel="modulepreload" href="/${file}">`),
      // CSS Stylesheets (Critical - Blocking)
      ...criticalCss.map((file) => `<link rel="stylesheet" href="/${file}">`),
      // CSS Stylesheets (Deferred - Non-blocking)
      // Uses media="print" trick: loads async, then applies on load
      ...deferredCss.map(
        (file) => `<link rel="stylesheet" href="/${file}" media="print" onload="this.media='all'">`,
      ),
      // Fallback for no-JS users
      ...deferredCss.map((file) => `<noscript><link rel="stylesheet" href="/${file}"></noscript>`),
    ];

    return linkTags.join("\n");
  }
}
