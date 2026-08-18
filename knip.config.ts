import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    client: {
      entry: ["client/app/root.tsx"],
      project: ["client/app/**/*.{ts,tsx}"],
    },
    server: {
      entry: ["server.ts", "db.ts", "routes/**/*.ts", "services/**/*.ts"],
    },
    shared: {
      entry: ["env.ts", "routes.ts"],
    },
  },
  ignore: [
    "**/*.test.{ts,tsx}",
    "tests/**",
    "e2e/**",
    ".lintstagedrc.cjs",
    ".gemini/**",
    "scripts/**",
    "test-*.{cjs,mjs,js}",
    "server/lib/cache/redis-client.ts",
    "client/app/components/admin/product-management-unified/shared/hooks/**",
    "client/app/components/admin/shared/**",
    "client/app/components/ui/map/hooks/**",
    "ops/load-testing/**",
    "playwright-script.mjs",
    "server/scripts/benchmark-queries.ts",
    // Admin components - actively used but dynamically referenced
    "client/app/components/admin/**",
  ],
  ignoreDependencies: [
    "ts-morph",
    "pino-pretty",
    "neverthrow",
    "@vitejs/plugin-react",
    "protobufjs",
  ],
  ignoreBinaries: ["tsx", "pkill", "lhci", "wait-on", "react-router"],
  ignoreUnresolved: ["./database-metrics-tracker.js"],
  ignoreExportsUsedInFile: true,
  // Allow unused exports in test files and admin components
  rules: {
    "unused-files": "off",
    "unused-dependencies": "warn",
    "unused-exports": "warn",
  },
};

export default config;
