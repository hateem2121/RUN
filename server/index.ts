import { injectSecretsToEnv, loadSecrets } from "./lib/secrets/secret-manager.js";
import "dotenv/config";
import { z } from "zod";

console.log("[Bootstrap] Full process.env keys:", Object.keys(process.env).sort());
console.log("[Bootstrap] DATABASE_URL:", JSON.stringify(process.env.DATABASE_URL));
console.log("[Bootstrap] SESSION_SECRET:", JSON.stringify(process.env.SESSION_SECRET));
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
