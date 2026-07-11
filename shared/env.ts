import { validateEnv } from "./schemas/env.schema.js";

/**
 * SINGLE SOURCE OF TRUTH for validated environment variables.
 * This ensures all parts of the app use the same validated config
 * instead of direct process.env access.
 */
export const env = validateEnv(typeof process !== "undefined" ? process.env : undefined);
