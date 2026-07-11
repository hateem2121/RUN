import type { Request } from "express";
import { type LoginTicket, OAuth2Client } from "google-auth-library";
import { logger } from "./monitoring/logger.js";

// Initialize a single client to cache Google's public keys
export const oAuth2Client = new OAuth2Client();

/**
 * Extracts and verifies the OIDC token sent by Google Cloud Tasks.
 * This ensures the request actually originated from our managed queue.
 */
export async function verifyCloudTaskToken(req: Request): Promise<boolean> {
  // 1. Check if token exists in Authorization header
  const authHeader = req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    logger.warn("[CloudTasksConfig] Missing or malformed Authorization header");
    return false;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    logger.warn("[CloudTasksConfig] Missing token in Authorization header");
    return false;
  }

  // SEC-F05: Use validated environment variables
  const audience = process.env.CLOUD_TASKS_AUDIENCE;
  const serviceAccountEmail = process.env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL;

  if (!audience || !serviceAccountEmail) {
    logger.error("[CloudTasksConfig] Missing OIDC configuration in environment");
    return false;
  }

  try {
    // 2. Verify token signature and audience
    const ticket = (await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: audience,
    })) as LoginTicket;

    const payload = ticket.getPayload();
    if (!payload) {
      logger.warn("[CloudTasksConfig] Failed to get payload from token");
      return false;
    }

    // 3. Verify it was signed by our specific service account
    if (payload.email !== serviceAccountEmail) {
      logger.warn("[CloudTasksConfig] Token email does not match expected service account", {
        received: payload.email,
        expected: serviceAccountEmail,
      });
      return false;
    }

    // 4. Verify the issuer is Google
    if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") {
      logger.warn("[CloudTasksConfig] Invalid token issuer", { iss: payload.iss });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("[CloudTasksConfig] Token verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}
