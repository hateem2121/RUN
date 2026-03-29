/**
 * Alert Service - Free Tier Implementation
 *
 * Provides incident alerting using free services:
 * - Discord webhooks (primary, completely free)
 * - Slack webhooks (alternative, free tier)
 * - Console logging (fallback)
 *
 * No paid services required!
 *
 * @configuration
 * Environment variables:
 * - DISCORD_WEBHOOK_URL: Discord webhook for alerts
 * - SLACK_WEBHOOK_URL: Slack webhook (alternative)
 * - ALERT_ENABLED: Set to 'true' to enable (default: true in production)
 */

import { logger } from "../monitoring/logger.js";

/**
 * Alert severity levels
 */
export type AlertSeverity = "critical" | "error" | "warning" | "info";

/**
 * Alert payload
 */
interface AlertPayload {
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  runbookUrl?: string | undefined;
}

/**
 * Discord embed colors by severity
 */
const DISCORD_COLORS: Record<AlertSeverity, number> = {
  critical: 0xff0000, // Red
  error: 0xff6b6b, // Light red
  warning: 0xffaa00, // Orange
  info: 0x00aaff, // Blue
};

/**
 * Severity emoji mapping
 */
const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  critical: "🚨",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

/**
 * Check if alerting is enabled
 */
function isEnabled(): boolean {
  const enabled = process.env.ALERT_ENABLED !== "false";
  const hasWebhook = !!(process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL);
  return enabled && hasWebhook;
}

/**
 * Send alert to Discord
 */
async function sendDiscordAlert(payload: AlertPayload): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return false;
  }

  try {
    const embed = {
      title: `${SEVERITY_EMOJI[payload.severity]} ${payload.title}`,
      description: payload.message,
      color: DISCORD_COLORS[payload.severity],
      timestamp: payload.timestamp || new Date().toISOString(),
      fields: [] as Array<{ name: string; value: string; inline?: boolean }>,
      footer: {
        text: "RUN Apparel Platform",
      },
    };

    // Add details as fields
    if (payload.details) {
      for (const [key, value] of Object.entries(payload.details)) {
        embed.fields.push({
          name: key,
          value: String(value).slice(0, 1024), // Discord limit
          inline: true,
        });
      }
    }

    // Add runbook link if available
    if (payload.runbookUrl) {
      embed.fields.push({
        name: "📚 Runbook",
        value: `[View Runbook](${payload.runbookUrl})`,
        inline: false,
      });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      logger.error("[Alert] Discord webhook failed", { status: response.status });
      return false;
    }

    logger.info("[Alert] Discord alert sent", { title: payload.title });
    return true;
  } catch (error) {
    logger.error("[Alert] Discord webhook error", error);
    return false;
  }
}

/**
 * Send alert to Slack
 */
async function sendSlackAlert(payload: AlertPayload): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return false;
  }

  try {
    const color =
      payload.severity === "critical"
        ? "danger"
        : payload.severity === "error"
          ? "danger"
          : payload.severity === "warning"
            ? "warning"
            : "good";

    const blocks: Array<{ type: string; text: { type: string; text: string } }> = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${SEVERITY_EMOJI[payload.severity]} ${payload.title}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: payload.message,
        },
      },
    ];

    // Add runbook button if available
    if (payload.runbookUrl) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `📚 <${payload.runbookUrl}|View Runbook>`,
        },
      });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [
          {
            color,
            blocks,
          },
        ],
      }),
    });

    if (!response.ok) {
      logger.error("[Alert] Slack webhook failed", { status: response.status });
      return false;
    }

    logger.info("[Alert] Slack alert sent", { title: payload.title });
    return true;
  } catch (error) {
    logger.error("[Alert] Slack webhook error", error);
    return false;
  }
}

/**
 * Alert Service - Free Tier
 */
export class AlertService {
  private dedupeCache = new Map<string, number>();
  private dedupeTtlMs = 60000; // 1 minute deduplication

  /**
   * Send an alert via available free channels
   */
  async sendAlert(payload: AlertPayload): Promise<boolean> {
    // Deduplication - prevent alert storms
    const dedupeKey = `${payload.title}-${payload.severity}`;
    const lastSent = this.dedupeCache.get(dedupeKey);
    if (lastSent && Date.now() - lastSent < this.dedupeTtlMs) {
      logger.debug("[Alert] Deduplicated alert", { title: payload.title });
      return true;
    }

    if (!isEnabled()) {
      logger.debug("[Alert] Alerting disabled or no webhook configured");
      return false;
    }

    // Try Discord first (preferred), then Slack
    let sent = await sendDiscordAlert(payload);
    if (!sent) {
      sent = await sendSlackAlert(payload);
    }

    if (sent) {
      this.dedupeCache.set(dedupeKey, Date.now());
    }

    // Always log the alert for record keeping
    logger.warn("[Alert] Alert triggered", {
      severity: payload.severity,
      title: payload.title,
      message: payload.message,
    });

    return sent;
  }

  /**
   * Alert on server errors (5xx)
   * Called by error handler middleware
   */
  async alertOnServerError(
    error: Error,
    requestPath: string,
    statusCode: number,
    runbookUrl?: string,
  ): Promise<void> {
    if (statusCode < 500) {
      return;
    }

    const severity: AlertSeverity = statusCode >= 500 ? "error" : "warning";

    await this.sendAlert({
      severity,
      title: `Server Error ${statusCode}`,
      message: error.message,
      details: {
        "Error Type": error.name,
        Path: requestPath,
        Status: statusCode,
      },
      runbookUrl,
    });
  }

  /**
   * Alert on SLO breach
   */
  async alertOnSLOBreach(metric: string, threshold: number, actual: number): Promise<void> {
    await this.sendAlert({
      severity: "warning",
      title: "SLO Breach Detected",
      message: `${metric} exceeded threshold`,
      details: {
        Metric: metric,
        Threshold: threshold,
        Actual: actual,
        "Breach %": `${((actual / threshold - 1) * 100).toFixed(1)}%`,
      },
    });
  }

  /**
   * Check if alerting is configured
   */
  isConfigured(): boolean {
    return isEnabled();
  }
}

/**
 * Global alert service instance
 */
export const alertService = new AlertService();
