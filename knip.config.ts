import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "client/app/routes.ts", // React Router entry
    "server/index.ts", // Express entry
    "client/app/root.tsx", // Root layout
  ],
  project: ["client/app/**/*.{ts,tsx}", "server/**/*.{ts,tsx}"],
  ignore: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/node_modules/**"],
  ignoreDependencies: [],
};

export default config;
