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
    ".agent/**",
    "scripts/**",
    "ops/load-testing/**",
    "server/scripts/benchmark-queries.ts",
    "client/public/**",
  ],
  ignoreDependencies: [
    "ts-morph",
    "pino-pretty",
    "@vitejs/plugin-react",
    "@hookform/resolvers",
    "@asteasolutions/zod-to-openapi",
    "@gltf-transform/core",
    "@gltf-transform/extensions",
    "@gltf-transform/functions",
    "@google-cloud/bigquery",
    "@google-cloud/secret-manager",
    "@google-cloud/storage",
    "@react-router/express",
    "compression",
    "helmet",
    "lru-cache",
    "opossum",
    "prom-client",
    "sharp",
    "ws",
    "zod",
  ],
  ignoreBinaries: ["tsx", "pkill", "lhci", "wait-on", "react-router", "markdownlint-cli2"],
  ignoreExportsUsedInFile: true,
};

export default config;
