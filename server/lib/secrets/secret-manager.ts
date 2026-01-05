/**
 * Google Secret Manager Integration
 *
 * Loads secrets from Secret Manager in production environments.
 * Falls back to environment variables in development.
 *
 * @see https://cloud.google.com/secret-manager/docs/overview
 */

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { logger } from "../monitoring/logger.js";

// Secrets to load from Secret Manager
const MANAGED_SECRETS = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "GOOGLE_CLIENT_SECRET",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

type ManagedSecret = (typeof MANAGED_SECRETS)[number];

let cachedSecrets: Record<string, string> | null = null;

/**
 * Load secrets from Google Secret Manager
 * Only runs in production; returns empty object in development.
 */
export async function loadSecrets(): Promise<Record<string, string>> {
  // Return cached secrets if already loaded
  if (cachedSecrets) {
    return cachedSecrets;
  }

  // Skip in development - use .env file
  if (process.env.NODE_ENV !== "production") {
    logger.info("[SecretManager] Development mode - using environment variables");
    cachedSecrets = {};
    return cachedSecrets;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    logger.warn("[SecretManager] GOOGLE_CLOUD_PROJECT not set - falling back to env vars");
    cachedSecrets = {};
    return cachedSecrets;
  }

  const client = new SecretManagerServiceClient();
  const loaded: Record<string, string> = {};
  const failed: string[] = [];

  logger.info("[SecretManager] Loading secrets from Secret Manager...");

  for (const secretName of MANAGED_SECRETS) {
    try {
      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await client.accessSecretVersion({ name });

      const payload = version.payload?.data;
      if (payload) {
        loaded[secretName] = Buffer.isBuffer(payload)
          ? payload.toString("utf8")
          : typeof payload === "string"
            ? payload
            : new TextDecoder().decode(payload);
        logger.info(`[SecretManager] ✅ Loaded: ${secretName}`);
      } else {
        failed.push(secretName);
        logger.warn(`[SecretManager] ⚠️ Empty payload: ${secretName}`);
      }
    } catch (error) {
      failed.push(secretName);
      logger.warn(`[SecretManager] ⚠️ Failed to load ${secretName}:`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (failed.length > 0) {
    logger.warn(`[SecretManager] ${failed.length} secrets failed to load - using env fallback`, {
      failed,
    });
  }

  cachedSecrets = loaded;
  return cachedSecrets;
}

/**
 * Get a secret value, preferring Secret Manager over environment variables
 */
export function getSecret(name: ManagedSecret): string | undefined {
  // Check Secret Manager first
  if (cachedSecrets && cachedSecrets[name]) {
    return cachedSecrets[name];
  }
  // Fall back to environment variable
  return process.env[name];
}

/**
 * Merge loaded secrets into process.env for compatibility
 * Call this after loadSecrets() during bootstrap
 */
export function injectSecretsToEnv(): void {
  if (!cachedSecrets) {
    logger.warn("[SecretManager] No secrets loaded - call loadSecrets() first");
    return;
  }

  for (const [key, value] of Object.entries(cachedSecrets)) {
    if (value && !process.env[key]) {
      process.env[key] = value;
      logger.debug(`[SecretManager] Injected ${key} into process.env`);
    }
  }
}

/**
 * Check if secrets are available (for health checks)
 */
export function hasRequiredSecrets(): boolean {
  const required = ["DATABASE_URL", "SESSION_SECRET"];
  return required.every((key) => getSecret(key as ManagedSecret));
}
