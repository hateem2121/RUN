import dns from "node:dns";

// Set global DNS servers early to ensure all lookups (secrets, DB, etc) use reliable resolvers
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import { initTelemetry } from "./lib/monitoring/telemetry.js";

// 0. Initialize Telemetry (Must be first)
initTelemetry();

import { injectSecretsToEnv, loadSecrets } from "./lib/secrets/secret-manager.js";
import "dotenv/config";
import type express from "express";
export let app: express.Express;
export let serverReady: Promise<void>;
// Port 5002 configuration is strictly enforced in server.ts

serverReady = (async () => {
  try {
    // 1. Load Secrets (Async)
    console.log("[Bootstrap] Loading secrets from Secret Manager...");
    const secrets = await loadSecrets();
    injectSecretsToEnv();
    console.log(`[Bootstrap] Loaded ${Object.keys(secrets).length} secrets.`);

    // 1.5. Validate Environment Variables
    const { validateEnv } = await import("./env.schema.js");
    validateEnv();

    // 2. Import Main Server (Dynamic)
    // This defers evaluation of 'environment.ts' variables (Zod validation)
    // until after keys are present.
    const mod = await import("./server.js");
    app = mod.app;
    await mod.serverReady;
  } catch (error) {
    console.error("[Bootstrap] Critical failure during startup:", error);
    process.exit(1);
  }
})();
