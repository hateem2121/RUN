import path from "node:path";
import { fileURLToPath } from "node:url";
import ReactScan from "@react-scan/vite-plugin-react-scan";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tigger restart
export default defineConfig(({ command: _command, mode, isSsrBuild }) => ({
  css: {
    lightningcss: {
      drafts: {
        customProperties: true,
      },
    },
    transformer: "lightningcss",
  },
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
    tailwindcss(),
    // TanStackRouterVite(), // DISABLE: Using Wouter, this plugin causes alias resolution conflicts
    // FORENSIC: Bundle analysis to identify large chunks
    visualizer({
      filename: "./dist/stats.html",
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
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: mode !== "production", // Only upload in production
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    sourcemap: true, // Enable source maps for local debugging
    outDir: isSsrBuild
      ? path.resolve(__dirname, "dist/server")
      : path.resolve(__dirname, "dist/public"),
    emptyOutDir: !isSsrBuild, // Only empty for client build to avoid wiping server build if run second, or handle via script
    rollupOptions: {
      input: isSsrBuild ? "src/entry-server.tsx" : undefined,
      output: {
        manualChunks: isSsrBuild
          ? undefined
          : {
              // 'admin-media' chunk removed to fix build error

              "vendor-react": ["react", "react-dom", "wouter", "@tanstack/react-query"],
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
              "vendor-schema": ["@shared/schema", "drizzle-orm", "drizzle-zod"],
              "vendor-icons": ["react-icons"],
              "vendor-charts": ["recharts", "recharts-scale"],
            },
      },
    },
  },
  ssr: {
    // P0: Externalize backend dependencies to match Monorepo structure
    external: ["pg", "drizzle-orm", "better-sqlite3", "fsevents"],
    noExternal: ["react-helmet-async", "lucide-react", "recharts", "recharts-scale"],
  },
  server: {
    // FORENSIC: Dev server optimizations for faster module loading
    warmup: {
      clientFiles: [
        "./src/App.tsx",
        "./src/pages/admin.tsx",
        "./src/components/admin/media-library/*.tsx",
      ],
    },
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
}));
