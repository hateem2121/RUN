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
        // FORENSIC: Bundle analysis to identify large chunks
        visualizer({
          filename: "../dist/stats.html", // Relative to client root
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
        ReactScan({
          enable: mode === "development",
        }),
        // DEBUG: Inspect Vite transformation pipeline (localhost:5173/__inspect)
        Inspect(),
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
        rollupOptions: {
          output: {
            manualChunks: isSsrBuild
              ? undefined
              : {
                  "vendor-react": ["react", "react-dom", "@tanstack/react-query"],
                  // OPTIMIZATION: Separate Admin Vendor Chunk
                  "admin-vendor": [
                    // Shared deps moved to respective vendor chunks to avoid duplication
                    // "@radix-ui/react-select", -> vendor-ui
                    // "react-hook-form", -> vendor-utils
                    // "recharts", -> vendor-charts
                    // "zod", -> vendor-utils

                    // Unique to Admin?
                    "@radix-ui/react-checkbox",
                    "@radix-ui/react-context-menu",
                    "@radix-ui/react-tabs",
                    "@radix-ui/react-toast",
                    "cmdk",
                  ],
                  "vendor-ui": [
                    "@radix-ui/react-dialog",
                    "@radix-ui/react-dropdown-menu",
                    "@radix-ui/react-select",

                    "framer-motion",
                    "clsx",
                  ],
                  "vendor-3d": ["three", "@google/model-viewer"],
                  "vendor-utils": ["date-fns", "zod", "react-hook-form"],
                  "vendor-schema": ["@run-remix/shared", "drizzle-orm", "drizzle-zod"], // Use package name
                  "vendor-icons-lucide": ["lucide-react"],
                  "vendor-icons-radix": ["@radix-ui/react-icons"],
                  "vendor-icons": ["react-icons"],
                  "vendor-charts": ["recharts", "recharts-scale"],
                },
          },
        },
      },
      ssr: {
        // P0: Externalize backend dependencies
        external: ["pg", "drizzle-orm", "better-sqlite3", "fsevents"],
        noExternal: ["react-helmet-async", "lucide-react", "recharts", "recharts-scale"],
      },
      server: {
        // FORENSIC: Dev server optimizations for faster module loading
        host: true, // Listen on all addresses (0.0.0.0) to support localhost/127.0.0.1/LAN

        // Increase module graph size limit for admin pages
        hmr: {
          overlay: true,
          clientPort: parseInt(process.env.PORT || "5002"), // Match server port
        },
        fs: {
          strict: true,
          deny: ["**/.*"],
        },
      },
    }) as any,
);
