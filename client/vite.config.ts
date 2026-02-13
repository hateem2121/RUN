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
        },
        // CRITICAL: Prevent multiple React instances during SSR
        dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
      },
      root: __dirname, // Current folder is client
      envDir: path.resolve(__dirname, ".."), // Load .env from root
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
          onwarn(warning: any, warn: any) {
            // Suppress "Can't resolve original location of error" source map warnings
            if (warning.code === "SOURCEMAP_ERROR") {
              return;
            }
            warn(warning);
          },
          output: {
            manualChunks: isSsrBuild
              ? undefined
              : {
                  "vendor-react": [
                    "react",
                    "react-dom",
                    "@tanstack/react-query",
                    "react-router",
                    "react-router-dom",
                  ],

                  // LOW-LEVEL UTILS: Must be loaded first, shared by everyone
                  "vendor-utils": [
                    "clsx",
                    "tailwind-merge",
                    "class-variance-authority",
                    "date-fns",
                    "zod",
                    "react-hook-form",
                  ],

                  // UI LIBRARY: All Radix primitives to prevent circular deps
                  "vendor-ui": [
                    "@radix-ui/react-accordion",
                    "@radix-ui/react-alert-dialog",
                    "@radix-ui/react-aspect-ratio",
                    "@radix-ui/react-avatar",
                    "@radix-ui/react-checkbox",
                    "@radix-ui/react-collapsible",
                    "@radix-ui/react-context-menu",
                    "@radix-ui/react-dialog",
                    "@radix-ui/react-dropdown-menu",
                    "@radix-ui/react-hover-card",
                    "@radix-ui/react-label",
                    "@radix-ui/react-menubar",
                    "@radix-ui/react-navigation-menu",
                    "@radix-ui/react-popover",
                    "@radix-ui/react-progress",
                    "@radix-ui/react-radio-group",
                    "@radix-ui/react-scroll-area",
                    "@radix-ui/react-select",
                    "@radix-ui/react-separator",
                    "@radix-ui/react-slider",
                    "@radix-ui/react-slot",
                    "@radix-ui/react-switch",
                    "@radix-ui/react-tabs",
                    "@radix-ui/react-toast",
                    "@radix-ui/react-toggle",
                    "@radix-ui/react-toggle-group",
                    "@radix-ui/react-tooltip",
                    "@radix-ui/react-visually-hidden",
                    "cmdk",
                    "vaul",
                    "sonner",
                    "framer-motion",
                  ],

                  // HEAVY VENDORS: Isolated
                  "vendor-3d": ["three", "@google/model-viewer"],
                  "vendor-charts": ["recharts", "recharts-scale"],
                  "vendor-icons": ["lucide-react", "@radix-ui/react-icons", "react-icons"],

                  // SCHEMA
                  "vendor-schema": ["@run-remix/shared", "drizzle-orm", "drizzle-zod"],
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
    }) as any,
);
