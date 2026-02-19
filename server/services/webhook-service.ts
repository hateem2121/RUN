import crypto from "node:crypto";
import { webhookRepository } from "../lib/db/repositories/index.js";
import { logger } from "../lib/monitoring/logger.js";

/**
 * WEBHOOK SERVICE
 *
 * Handles triggering system events and delivering payloads to subscribers.
 * Includes HMAC signature generation for security and delivery logging for auditability.
 */
export class WebhookService {
  /**
   * Triggers a system event and delivers to all active subscribers.
   *
   * @param event - The event name (e.g., 'product.created')
   * @param payload - The event data payload
   */
  async trigger(event: string, payload: any): Promise<void> {
    try {
      const subscriptions = await webhookRepository.getWebhookSubscriptions();

      const activeSubs = subscriptions.filter(
        (sub) => sub.isActive === "Y" && (sub.events as string[]).includes(event),
      );

      if (activeSubs.length === 0) {
        logger.debug("[WebhookService] No active subscribers for event", { event });
        return;
      }

      logger.info("[WebhookService] Triggering event", {
        event,
        subscriberCount: activeSubs.length,
      });

      // Fire and forget deliveries to avoid blocking the main thread
      // In a production environment, this would be enqueued to a background worker
      for (const sub of activeSubs) {
        this.deliver(sub, event, payload).catch((err) => {
          logger.error("[WebhookService] Background delivery failed", {
            error: err,
            subscriptionId: sub.id,
          });
        });
      }
    } catch (error) {
      logger.error("[WebhookService] Failed to trigger event", { error, event });
    }
  }

  /**
   * Delivers a webhook to a specific subscriber and logs the result.
   */
  private async deliver(sub: any, event: string, payload: any): Promise<void> {
    const deliveryId = crypto.randomUUID();
    const deliveryPayload = {
      id: deliveryId,
      event,
      payload,
      timestamp: new Date().toISOString(),
    };

    const signature = this.generateSignature(deliveryPayload, sub.secret);

    try {
      const response = await fetch(sub.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
          "X-Webhook-Delivery-ID": deliveryId,
          "User-Agent": "Run-Remix-Webhooks/1.0",
        },
        body: JSON.stringify(deliveryPayload),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      const responseBody = await response.text().catch(() => "");

      // Log delivery attempt
      await webhookRepository.logWebhookDelivery({
        subscriptionId: sub.id,
        event,
        payload: deliveryPayload,
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 2000), // Truncate long bodies
        deliveredAt: response.ok ? new Date() : null,
        attemptCount: 1,
      });

      if (!response.ok) {
        logger.warn("[WebhookService] Delivery failed", { url: sub.url, status: response.status });
      }
    } catch (error) {
      logger.error("[WebhookService] Delivery failed", { error, url: sub.url });

      await webhookRepository.logWebhookDelivery({
        subscriptionId: sub.id,
        event,
        payload: deliveryPayload,
        responseStatus: 0,
        responseBody: error instanceof Error ? error.message : String(error),
        deliveredAt: null,
        attemptCount: 1,
      });
    }
  }

  /**
   * Generates a HMAC SHA256 signature for the payload to allow recipients to verify authenticity.
   */
  private generateSignature(payload: any, secret: string): string {
    return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
  }
}

export const webhookService = new WebhookService();
