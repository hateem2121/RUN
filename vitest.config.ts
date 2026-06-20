import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// ROOT vitest config — the single source of truth for `turbo test` and `npm test`.
// Picks up ALL test files across the monorepo (client, server, shared) because
// there is no `include` restriction. The client/vitest.config.ts is ONLY used
// when running `vitest` locally inside the client/ directory (e.g. for watch mode).
// Do NOT add this file to client/package.json's test script — that would cause
// double-runs in CI.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [path.resolve(__dirname, "./tests/setup.ts")],
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/.stryker-tmp/**",
      ".claude/**",
      ".github/runner/**",
      "e2e/**",
      "tests/e2e/**",
    ],
    testTimeout: 60000,
    coverage: {
      enabled: false, // Enable with --coverage flag
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      reportsDirectory: "./coverage",
      exclude: ["**/node_modules/**", "**/dist/**", "**/tests/**", "**/mocks/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    // PERFORMANCE: Limit concurrency to avoid checking out valid memory
    // @ts-expect-error - poolOptions is valid in Vitest 2+ but types might be strict in this environment
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
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "app"),
      "@shared": path.resolve(__dirname, "shared"),
      "@run-remix/shared": path.resolve(__dirname, "shared/index.ts"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
});
