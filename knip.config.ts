import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    client: {
      entry: [],
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
  ],
  ignoreDependencies: ["ts-morph", "pino-pretty", "neverthrow", "@vitejs/plugin-react", "protobufjs"],
  ignoreBinaries: ["tsx", "pkill", "lhci", "wait-on", "react-router"],
  ignoreUnresolved: ["./database-metrics-tracker.js"],
  ignoreExportsUsedInFile: true,
};

export default config;
