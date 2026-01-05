import {
  injectSecretsToEnv,
  loadSecrets,
} from "./lib/secrets/secret-manager.js";

/**
 * BOOTSTRAP ENTRY POINT
 *
 * P1 SECURITY: Runtime Secret Loading
 * Loads secrets from Google Secret Manager before importing the application code.
 * This ensures that 'process.env' is populated before 'environment.ts' validation runs.
 */

(async () => {
  try {
    // 1. Load Secrets (Async)
    console.log("[Bootstrap] Loading secrets from Secret Manager...");
    const secrets = await loadSecrets();
    injectSecretsToEnv();
    console.log(`[Bootstrap] Loaded ${Object.keys(secrets).length} secrets.`);

    // 2. Import Main Server (Dynamic)
    // This defers evaluation of 'environment.ts' variables (Zod validation)
    // until after keys are present.
    await import("./server.js");
  } catch (error) {
    console.error("[Bootstrap] Critical failure during startup:", error);
    process.exit(1);
  }
})();
