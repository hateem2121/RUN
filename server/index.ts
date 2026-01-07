import { initTelemetry } from "./lib/monitoring/telemetry.js";

// 0. Initialize Telemetry (Must be first)
initTelemetry();

import { injectSecretsToEnv, loadSecrets } from "./lib/secrets/secret-manager.js";
import "dotenv/config";
export let app: any;
export let serverReady: Promise<void>;

serverReady = (async () => {
  try {
    // 1. Load Secrets (Async)
    // biome-ignore lint/suspicious/noConsole: startup logging
    console.log("[Bootstrap] Loading secrets from Secret Manager...");
    const secrets = await loadSecrets();
    injectSecretsToEnv();
    // biome-ignore lint/suspicious/noConsole: startup logging
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
    // biome-ignore lint/suspicious/noConsole: Critical startup error
    console.error("[Bootstrap] Critical failure during startup:", error);
    process.exit(1);
  }
})();
