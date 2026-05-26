import dns from "node:dns";

// Set global DNS servers early if explicitly requested via env variable
if (process.env.OVERRIDE_DNS === "true") {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
}

// Port binding: PORT=5002 (resolved in server.ts via process.env.PORT, defaults to 5002)

// OTel is initialized in server.ts (startOtel) as the first import — no duplicate init here.

import { injectSecretsToEnv, loadSecrets } from "./lib/secrets/secret-manager.js";
import "dotenv/config";
import type express from "express";
import { logger } from "./lib/monitoring/logger.js";
import { initSentry } from "./lib/monitoring/sentry.js";

export let app: express.Express;
export const serverReady: Promise<void> = (async () => {
  try {
    // 1. Load Secrets (Async)
    logger.info("[Bootstrap] Loading secrets from Secret Manager...");
    const secrets = await loadSecrets();
    injectSecretsToEnv();
    logger.info(`[Bootstrap] Loaded ${Object.keys(secrets).length} secrets.`);

    // 1.2. Initialize Sentry (ASAP after secrets/env are ready)
    initSentry();

    // 1.5. Validate Environment Variables
    const { validateEnv } = await import("../shared/schemas/env.schema.js");
    validateEnv();

    // 2. Import Main Server (Dynamic)
    // This defers evaluation of 'environment.ts' variables (Zod validation)
    // until after keys are present.
    const mod = await import("./server.js");
    app = mod.app;
    await mod.serverReady;
  } catch (error) {
    logger.error("[Bootstrap] Critical failure during startup:", undefined, error as Error);
    process.exit(1);
  }
})();
