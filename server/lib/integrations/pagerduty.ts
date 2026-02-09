/**
 * PagerDuty Integration Service
 *
 * @module pagerduty
 * @description Integrates with PagerDuty Events API v2 for incident management.
 * Triggers alerts on critical errors and enables automatic incident resolution.
 *
 * @configuration
 * Required environment variables:
 * - PAGERDUTY_ROUTING_KEY: Integration key from PagerDuty service
 * - PAGERDUTY_ENABLED: Set to 'true' to enable alerting (default: false)
 *
 * @documentation
 * - PagerDuty Events API v2: https://developer.pagerduty.com/docs/events-api-v2/overview/
 */

import { logger } from "../monitoring/logger.js";

/**
 * PagerDuty Events API v2 endpoint
 */
const PAGERDUTY_EVENTS_URL = "https://events.pagerduty.com/v2/enqueue";

/**
 * Severity levels for PagerDuty alerts
 */
export type PagerDutySeverity = "critical" | "error" | "warning" | "info";

/**
 * PagerDuty event payload structure
 */
interface PagerDutyEvent {
  routing_key: string;
  event_action: "trigger" | "acknowledge" | "resolve";
  dedup_key?: string | undefined;
  payload?: {
    summary: string;
    severity: PagerDutySeverity;
    source: string;
    timestamp?: string | undefined;
    component?: string | undefined;
    group?: string | undefined;
    class?: string | undefined;
    custom_details?: Record<string, unknown> | undefined;
  };
}

/**
 * PagerDuty API response
 */
interface PagerDutyResponse {
  status: string;
  message: string;
  dedup_key: string;
}

/**
 * Check if PagerDuty integration is enabled
 */
function isEnabled(): boolean {
  return process.env.PAGERDUTY_ENABLED === "true" && !!process.env.PAGERDUTY_ROUTING_KEY;
}

/**
 * Send event to PagerDuty
 */
async function sendEvent(event: PagerDutyEvent): Promise<PagerDutyResponse | null> {
  if (!isEnabled()) {
    logger.debug("[PagerDuty] Integration disabled, skipping event");
    return null;
  }

  try {
    const response = await fetch(PAGERDUTY_EVENTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("[PagerDuty] API error", { status: response.status, error: errorText });
      return null;
    }

    const result = (await response.json()) as PagerDutyResponse;
    logger.info("[PagerDuty] Event sent successfully", { dedup_key: result.dedup_key });
    return result;
  } catch (error) {
    logger.error("[PagerDuty] Failed to send event", error);
    return null;
  }
}

/**
 * PagerDuty Service
 *
 * Provides methods for triggering, acknowledging, and resolving incidents.
 */
export class PagerDutyService {
  private routingKey: string;
  private source: string;

  constructor() {
    this.routingKey = process.env.PAGERDUTY_ROUTING_KEY || "";
    this.source = process.env.SERVICE_NAME || "run-apparel-platform";
  }

  /**
   * Trigger a new incident
   *
   * @param severity - Incident severity (critical, error, warning, info)
   * @param summary - Brief description of the incident
   * @param details - Additional context for responders
   * @param dedupKey - Optional deduplication key (prevents duplicate incidents)
   *
   * @example
   * ```typescript
   * await pagerDuty.triggerIncident(
   *   'critical',
   *   'Database connection pool exhausted',
   *   { poolSize: 100, activeConnections: 100 }
   * );
   * ```
   */
  async triggerIncident(
    severity: PagerDutySeverity,
    summary: string,
    details?: Record<string, unknown>,
    dedupKey?: string,
  ): Promise<string | null> {
    const event: PagerDutyEvent = {
      routing_key: this.routingKey,
      event_action: "trigger",
      dedup_key: dedupKey,
      payload: {
        summary,
        severity,
        source: this.source,
        timestamp: new Date().toISOString(),
        component: "backend",
        group: "production",
        class: "application",
        custom_details: details,
      },
    };

    const result = await sendEvent(event);
    return result?.dedup_key || null;
  }

  /**
   * Acknowledge an existing incident
   *
   * @param dedupKey - The deduplication key of the incident to acknowledge
   */
  async acknowledgeIncident(dedupKey: string): Promise<boolean> {
    const event: PagerDutyEvent = {
      routing_key: this.routingKey,
      event_action: "acknowledge",
      dedup_key: dedupKey,
    };

    const result = await sendEvent(event);
    return result !== null;
  }

  /**
   * Resolve an existing incident
   *
   * @param dedupKey - The deduplication key of the incident to resolve
   */
  async resolveIncident(dedupKey: string): Promise<boolean> {
    const event: PagerDutyEvent = {
      routing_key: this.routingKey,
      event_action: "resolve",
      dedup_key: dedupKey,
    };

    const result = await sendEvent(event);
    return result !== null;
  }

  /**
   * Trigger alert for 5xx errors
   * Called by error handler middleware
   */
  async alertOnServerError(error: Error, requestPath: string, statusCode: number): Promise<void> {
    // Only alert on 5xx errors
    if (statusCode < 500) {
      return;
    }

    const severity: PagerDutySeverity = statusCode >= 500 ? "error" : "warning";

    await this.triggerIncident(
      severity,
      `Server Error ${statusCode}: ${error.message}`,
      {
        errorName: error.name,
        errorMessage: error.message,
        requestPath,
        statusCode,
        stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      },
      `server-error-${requestPath}-${statusCode}`, // Dedup by path and status
    );
  }

  /**
   * Check if PagerDuty integration is configured
   */
  isConfigured(): boolean {
    return isEnabled();
  }
}

/**
 * Global PagerDuty service instance
 */
export const pagerDuty = new PagerDutyService();
