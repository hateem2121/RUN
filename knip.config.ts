import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    client: {
      entry: ["app/routes.ts", "app/root.tsx", "app/entry.client.tsx", "app/entry.server.tsx"],
    },
    server: {
      entry: ["index.ts", "server.ts", "db.ts", "worker.ts", "routes/**/*.ts", "services/**/*.ts"],
    },
    shared: {
      entry: ["index.ts", "env.ts", "routes.ts"],
    },
  },
  ignore: [
    "**/*.test.{ts,tsx}",
    "tests/**",
    "e2e/**",
    ".claude/**",
    ".lintstagedrc.cjs",
    "client/app/components/admin/product-management-unified/shared/hooks/**",
    "client/app/components/admin/shared/**",
    "client/app/components/homepage/Preloader.tsx",
    "client/app/components/shared/ClientOnly.tsx",
    "client/app/components/ui/GsapWrappers.tsx",
    "client/app/components/ui/loading-state.tsx",
    "client/app/components/ui/map/hooks/**",
    "client/app/components/ui/map/MapMarkers.tsx",
    "client/app/components/ui/map/OptimizedMapContainer.tsx",
    "client/app/components/ui/SectionHeader.tsx",
    "ops/load-testing/**",
    "patch.js",
    "playwright-script.mjs",
    "server/scripts/benchmark-queries.ts",
    "test-globals.js",
  ],
  ignoreDependencies: [
    "react-leaflet",
    "ts-morph",
    "pino-pretty",
    "neverthrow",
    "@vitejs/plugin-react",
  ],
  ignoreBinaries: ["tsx", "pkill", "lhci"],
  ignoreExportsUsedInFile: true,
};

export default config;
