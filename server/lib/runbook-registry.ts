/**
 * Runbook Registry
 * 
 * Maps error codes to runbook documentation URLs for operational guidance.
 * Used by error handler to include runbook links in responses (non-production)
 * and by PagerDuty alerts to link responders to relevant documentation.
 */

/**
 * Base URL for runbook documentation
 * In production, this should point to your documentation site
 */
const RUNBOOK_BASE_URL = process.env.RUNBOOK_BASE_URL || 
  "https://github.com/your-org/run-remix/blob/main/docs/runbooks";

/**
 * Mapping of error codes to runbook file paths
 */
const RUNBOOK_PATHS: Record<string, string> = {
  // Database errors
  "DB_CONNECTION_ERROR": "database-outage.md",
  "DB_TIMEOUT": "database-outage.md",
  "DB_DEADLOCK": "database-outage.md",
  
  // Rate limiting
  "RATE_LIMIT_EXCEEDED": "rate-limit-surge.md",
  
  // Circuit breaker
  "CIRCUIT_BREAKER_OPEN": "circuit-breaker-trip.md",
  "EXTERNAL_SERVICE_ERROR": "circuit-breaker-trip.md",
  
  // Authentication/Authorization
  "AUTH_INVALID_TOKEN": "incident-response.md",
  "AUTH_FORBIDDEN": "incident-response.md",
  
  // Internal errors
  "INTERNAL_ERROR": "incident-response.md",
  
  // Deployment
  "DEPLOYMENT_ERROR": "deployment-rollback.md",
};

/**
 * Get the full runbook URL for an error code
 * 
 * @param errorCode - The error code (e.g., "DB_CONNECTION_ERROR")
 * @returns Full URL to the runbook, or undefined if no runbook exists
 * 
 * @example
 * ```typescript
 * getRunbookUrl("DB_CONNECTION_ERROR")
 * // => "https://github.com/.../docs/runbooks/database-outage.md"
 * ```
 */
export function getRunbookUrl(errorCode: string): string | undefined {
  const path = RUNBOOK_PATHS[errorCode];
  if (!path) return undefined;
  return `${RUNBOOK_BASE_URL}/${path}`;
}

/**
 * Get the runbook path (relative) for an error code
 * Useful for internal references
 */
export function getRunbookPath(errorCode: string): string | undefined {
  return RUNBOOK_PATHS[errorCode];
}

/**
 * Check if a runbook exists for an error code
 */
export function hasRunbook(errorCode: string): boolean {
  return errorCode in RUNBOOK_PATHS;
}

/**
 * Get all registered error codes with runbooks
 */
export function getRunbookErrorCodes(): string[] {
  return Object.keys(RUNBOOK_PATHS);
}

/**
 * Severity levels that should include runbook links
 */
const RUNBOOK_SEVERITIES = ["high", "critical"];

/**
 * Determine if an error should include a runbook link based on severity
 */
export function shouldIncludeRunbook(severity: string): boolean {
  return RUNBOOK_SEVERITIES.includes(severity);
}
