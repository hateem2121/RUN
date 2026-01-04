import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    coverage: {
      enabled: false, // Enable with --coverage flag
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/tests/**",
        "**/e2e/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/attached_assets/**",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
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
