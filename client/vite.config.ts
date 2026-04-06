// Limit Node.js internal thread pool to avoid system overload
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "4";

import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";

dns.setDefaultResultOrder("ipv4first"); // CRITICAL: Fix localhost 504 errors on Node 17+

import ReactScan from "@react-scan/vite-plugin-react-scan";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tigger restart
export default defineConfig(
  ({ command: _command, mode, isSsrBuild }) =>
    ({
      plugins: [
        reactRouter(),
        tailwindcss(),
        // FORENSIC: Bundle analysis (Opt-in via VITE_ANALYZE=true)
        process.env.VITE_ANALYZE === "true" &&
          visualizer({
            filename: "../dist/stats.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
          }),
        ReactScan({
          enable: process.env.ENABLE_REACT_SCAN === "true", // P1 OPTIMIZATION: Opt-in only to save CPU
        }),
        // DEBUG: Inspect Vite transformation pipeline (localhost:5173/__inspect)
        // DEBUG: Inspect Vite pipeline (Opt-in via VITE_INSPECT=true)
        process.env.VITE_INSPECT === "true" && Inspect(),
        // Sentry Source Maps Upload (Requires SENTRY_AUTH_TOKEN)
        sentryVitePlugin({
          ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
          ...(process.env.SENTRY_PROJECT ? { project: process.env.SENTRY_PROJECT } : {}),
          ...(process.env.SENTRY_AUTH_TOKEN ? { authToken: process.env.SENTRY_AUTH_TOKEN } : {}),
          disable: mode !== "production", // Only upload in production
        }),
      ],

      resolve: {
        alias: {
          "@": path.resolve(__dirname, "app"),
          "@shared": path.resolve(__dirname, "../shared"), // Sibling folder
          "@assets": path.resolve(__dirname, "../attached_assets"),
          // Use the self-contained dist bundle (includes three.js) rather than the ESM
          // lib entry, which imports three as an external peer and requires an import map.
          "@google/model-viewer": path.resolve(
            __dirname,
            "../node_modules/@google/model-viewer/dist/model-viewer.min.js",
          ),
        },
        // CRITICAL: Prevent multiple React instances during SSR
        dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
      },
      root: __dirname, // Current folder is client
      envDir: path.resolve(__dirname, ".."), // Load .env from root
      // Move Vite's dep-optimization cache out of node_modules.
      // Note: this does NOT affect .vite-temp (Vite's config-evaluation temp dir,
      // which is hardcoded to node_modules/.vite-temp). The actual worktree restart
      // loop fix is in server/package.json via --ignore '../../../../client/**'.
      cacheDir: path.resolve(__dirname, "../.vite-cache"),
      build: {
        sourcemap: true, // Enable source maps for Sentry upload (plugin handles security/deletion if configured)
        outDir: isSsrBuild
          ? path.resolve(__dirname, "../dist/server")
          : path.resolve(__dirname, "../dist/public"),
        emptyOutDir: !isSsrBuild, // Only empty for client build
        minify: "terser",
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        rollupOptions: {
          onwarn(
            warning: { code?: string; message: string },
            warn: (w: { code?: string; message: string }) => void,
          ) {
            // Suppress "Can't resolve original location of error" source map warnings
            if (warning.code === "SOURCEMAP_ERROR") {
              return;
            }
            warn(warning);
          },
          output: {
            // Function-based manualChunks: only called for bundled modules, not
            // externals. Safe across both client and SSR environments — when
            // reactRouter() builds both in one vite build pass (Vite 7 Environments
            // API), react is externalized in SSR so this function is never called
            // for it, avoiding the "cannot be included in manualChunks" Rollup error.
            manualChunks: isSsrBuild
              ? undefined
              : (id: string): string | undefined => {
                  if (!id.includes("node_modules")) return undefined;
                  if (
                    id.includes("/react/") ||
                    id.includes("/react-dom/") ||
                    id.includes("/@tanstack/react-query") ||
                    id.includes("/react-router/") ||
                    id.includes("/react-router-dom/")
                  )
                    return "vendor-react";
                  if (
                    id.includes("/clsx/") ||
                    id.includes("/tailwind-merge/") ||
                    id.includes("/class-variance-authority/") ||
                    id.includes("/date-fns/") ||
                    id.includes("/zod/") ||
                    id.includes("/react-hook-form/")
                  )
                    return "vendor-utils";
                  if (
                    id.includes("/@radix-ui/") ||
                    id.includes("/cmdk/") ||
                    id.includes("/sonner/")
                  )
                    return "vendor-ui";
                  if (id.includes("/@google/model-viewer")) return "vendor-3d";
                  if (id.includes("/recharts/")) return "vendor-charts";
                  if (id.includes("/lucide-react/")) return "vendor-icons";
                  if (id.includes("/@run-remix/shared") || id.includes("/drizzle-orm/"))
                    return "vendor-schema";
                  return undefined;
                },
          },
        },
      },
      ssr: {
        // P0: Externalize backend dependencies
        external: ["pg", "drizzle-orm", "better-sqlite3", "fsevents"],
        noExternal: ["react-helmet-async", "recharts", "recharts-scale"], // REMOVED lucide-react from noExternal to allow tree-shaking if possible
      },
      server: {
        // FORENSIC: Dev server optimizations for faster module loading
        host: true, // Listen on all addresses (0.0.0.0) to support localhost/127.0.0.1/LAN
        // port: 5002, // REMOVED - Controlled by Express master process
        // strictPort: true, // REMOVED
        // proxy: { ... }, // REMOVED - Circular proxying prevented

        // Increase module graph size limit for admin pages
        hmr: {
          overlay: true,
          // clientPort: 5002, // Match server port
        },
        fs: {
          strict: true,
          deny: ["**/.*"],
        },
        watch: {
          ignored: [
            "**/node_modules/**",
            "**/.git/**",
            "**/dist/**",
            "**/coverage/**",
            "**/.idea/**",
            "**/.vscode/**",
            "**/check-secrets.sh", // Ignore scripts
          ],
        },
      },
      // biome-ignore lint/suspicious/noExplicitAny: Vite config type inference limitation with conditional plugins
    }) as any,
);
