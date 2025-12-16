import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig(({ command: _command, mode: _mode, isSsrBuild }) => ({
    plugins: [
        react(),
        tailwindcss(),
        // TanStackRouterVite(), // DISABLE: Using Wouter, this plugin causes alias resolution conflicts
        // FORENSIC: Bundle analysis to identify large chunks
        visualizer({
            filename: "./dist/stats.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
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
        },
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
    },
}));
