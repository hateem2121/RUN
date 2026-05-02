import { validateEnv } from "@run-remix/shared";

/**
 * SINGLE SOURCE OF TRUTH for validated environment variables (Server-side)
 * This ensures all parts of the server use the same validated config
 * instead of direct process.env access.
 */
export const env = validateEnv();
