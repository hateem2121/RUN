// Limit Node.js internal thread pool to avoid system overload
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "4";

import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";

dns.setDefaultResultOrder("ipv4first"); // CRITICAL: Fix localhost 504 errors on Node 17+

import ReactScan from "@react-scan/vite-plugin-react-scan";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";
import Inspect from "vite-plugin-inspect";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tigger restart
export default defineConfig((env) => {
  const { command: _command, isSsrBuild } = env;
  console.warn("[VITE-CONFIG-ARGS]", JSON.stringify(env));
  return {
    plugins: [
      reactRouter(),
      tailwindcss(),
      // PHASE 1: Asset compression (Gzip/Brotli)
      viteCompression({
        algorithm: "brotliCompress",
        ext: ".br",
        threshold: 1024,
        verbose: false,
      }),
      viteCompression({
        algorithm: "gzip",
        ext: ".gz",
        threshold: 1024,
        verbose: false,
      }),
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
    ],

    optimizeDeps: {
      include: [
        "react-helmet-async",
        "@radix-ui/react-checkbox",
        "@radix-ui/react-dialog",
        "@radix-ui/react-select",
        "@radix-ui/react-slider",
        "react-error-boundary",
        "leaflet",
      ],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "app"),
        "@shared": path.resolve(__dirname, "../shared"), // Sibling folder
        "@assets": path.resolve(__dirname, "../attached_assets"),
        // Use the modular ESM build which allows tree-shaking three.js and separate chunking
        "@google/model-viewer": path.resolve(
          __dirname,
          "../node_modules/@google/model-viewer/dist/model-viewer-module.min.js",
        ),
        "victory-vendor/d3-shape": path.resolve(
          __dirname,
          "../node_modules/victory-vendor/es/d3-shape.js",
        ),
        "victory-vendor/d3-scale": path.resolve(
          __dirname,
          "../node_modules/victory-vendor/es/d3-scale.js",
        ),
      },
      // CRITICAL: Prevent multiple React instances during SSR
      dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
    },
    root: __dirname, // Current folder is client
    envDir: path.resolve(__dirname, ".."), // Load .env from root
    build: {
      sourcemap: isSsrBuild ? "hidden" : false, // Enable source maps for Sentry upload (hidden mode)
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
    },
    ssr: {
      // P0: Externalize backend dependencies and CJS-only packages
      external: [
        "pg",
        "drizzle-orm",
        "better-sqlite3",
        "fsevents",
        "react-fast-compare",
        "invariant",
        "shallowequal",
        "isomorphic-dompurify",
      ],
      noExternal: ["@run-remix/shared", "react-helmet-async", "recharts", "recharts-scale"],
      resolve: {
        conditions: ["module", "node"],
        externalConditions: ["node"],
      },
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
  } as any;
});
