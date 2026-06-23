import type { KnipConfig } from "knip";

const config: KnipConfig = {
  workspaces: {
    client: {
      entry: ["app/routes.ts", "app/root.tsx", "app/entry.client.tsx", "app/entry.server.tsx"],
    },
    server: {
      entry: ["index.ts"],
    },
    shared: {
      entry: ["index.ts"],
    },
  },
  ignore: ["**/*.test.{ts,tsx}"],
};

export default config;
