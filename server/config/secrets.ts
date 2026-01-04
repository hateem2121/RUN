import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { logger } from "../lib/monitoring/logger.js";

const client = new SecretManagerServiceClient();

/**
 * Loads secrets from Google Secret Manager and populates process.env
 * This allows the app to start with explicit secrets without them being in the environment (e.g. .env file)
 */
export async function loadSecrets(): Promise<void> {
  // Only skip if explicitly disabled or if we lack credentials (in dev)
  if (process.env.SKIP_SECRET_LOADING === "true") return;

  // In production, we expect specific secrets
  const requiredSecrets = [
    "DATABASE_URL",
    "SESSION_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "SENTRY_DSN",
  ];

  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;

  if (!projectId) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("[Secrets] GCP Project ID not found, skipping Secret Manager load.");
    }
    return;
  }

  logger.info(`[Secrets] Loading secrets for project: ${projectId}`);

  // Parallel loading
  await Promise.all(
    requiredSecrets.map(async (key) => {
      // If already set (e.g. via Cloud Run env vars), skip to save latency
      if (process.env[key]) return;

      try {
        const secretName = `projects/${projectId}/secrets/${key}/versions/latest`;
        const [version] = await client.accessSecretVersion({
          name: secretName,
        });

        const payload = version.payload?.data?.toString();
        if (payload) {
          process.env[key] = payload;
          logger.info(`[Secrets] Loaded ${key} from Secret Manager`);
        }
      } catch (error) {
        // Log but don't crash - maybe the secret doesn't exist yet
        logger.debug(`[Secrets] Could not load ${key}:`, error);
      }
    }),
  );
}
