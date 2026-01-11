import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["./tests/setup.ts"],
        globals: true,
        testTimeout: 60000,
        coverage: {
            enabled: false, // Enable with --coverage flag
            provider: "v8",
            reporter: ["text", "json", "html", "json-summary"],
            reportsDirectory: "./coverage",
            exclude: ["**/node_modules/**", "**/dist/**", "**/tests/**", "**/mocks/**"],
            thresholds: {
                lines: 80,
                functions: 70,
                branches: 60,
                statements: 80,
            },
        },
    },
    // PERFORMANCE: Limit concurrency to avoid checking out valid memory
    // @ts-expect-error - poolOptions is valid in Vitest 2+ but types might be strict
    poolOptions: {
        threads: {
            maxThreads: 4,
            minThreads: 1,
            // isolate: false, // Uncomment if tests are purely functional/stateless for 2x speed
        },
        vmThreads: {
            memoryLimit: "2GB",
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "client", "src"),
            "@shared": path.resolve(__dirname, "shared"),
            "@assets": path.resolve(__dirname, "attached_assets"),
        },
    },
});
