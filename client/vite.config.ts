// Limit Node.js internal thread pool to avoid system overload
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "4";

import path from "node:path";
import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
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
          "@": path.resolve(__dirname, "src"),
          "@shared": path.resolve(__dirname, "../shared"), // Sibling folder
          "@assets": path.resolve(__dirname, "../attached_assets"),
        },
      },
      root: __dirname, // Current folder is client
      build: {
        sourcemap: mode === "development", // Enable source maps only for development
        outDir: isSsrBuild
          ? path.resolve(__dirname, "../dist/server")
          : path.resolve(__dirname, "../dist/public"),
        emptyOutDir: !isSsrBuild, // Only empty for client build
        rollupOptions: {
          output: {
            manualChunks: isSsrBuild
              ? undefined
              : {
                  "vendor-react": [
                    "react",
                    "react-dom",

                    "@tanstack/react-query",
                  ],
                  "vendor-ui": [
                    "@radix-ui/react-dialog",
                    "@radix-ui/react-dropdown-menu",
                    "@radix-ui/react-select",
                    "lucide-react",
                    "framer-motion",
                    "clsx",
                  ],
                  "vendor-3d": ["three", "@google/model-viewer"],
                  "vendor-utils": ["date-fns", "zod", "react-hook-form"],
                  "vendor-schema": ["@run-remix/shared", "drizzle-orm", "drizzle-zod"], // Use package name
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

        // Increase module graph size limit for admin pages
        hmr: {
          overlay: true,
          clientPort: 5001, // Force HMR to use the same port as the server
        },
        fs: {
          strict: true,
          deny: ["**/.*"],
        },
      },
    }) as any,
);
