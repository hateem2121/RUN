import crypto from "node:crypto";
import type { WebhookEventName, WebhookPayloadMap, WebhookSubscription } from "@shared/index.js";
import { type Result, ResultAsync } from "neverthrow";
import { AppError, InternalError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import {
  DB_CIRCUIT_OPTIONS,
  EXTERNAL_API_CIRCUIT_OPTIONS,
  withCircuit,
} from "../lib/resilience/circuit-breaker.js";
import { webhookRepository } from "./repositories/index.js";

/**
 * WEBHOOK SERVICE
 *
 * Handles triggering system events and delivering payloads to subscribers.
 * Includes HMAC signature generation for security and delivery logging for auditability.
 */
class WebhookService {
  /**
   * Triggers a system event and delivers to all active subscribers.
   *
   * @param event - The event name (e.g., 'product.created')
   * @param payload - The event data payload
   */
  async trigger<E extends WebhookEventName>(
    event: E,
    payload: WebhookPayloadMap[E],
  ): Promise<Result<void, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<void> => {
        const subscriptions = await withCircuit(
          "get-webhook-subscriptions",
          () => webhookRepository.getWebhookSubscriptions(),
          DB_CIRCUIT_OPTIONS,
        );

        const activeSubs = subscriptions.filter(
          (sub) => sub.isActive === true && (sub.events as unknown as string[]).includes(event),
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
        for (const sub of activeSubs) {
          this.deliver(sub, event, payload).catch((err) => {
            logger.error("[WebhookService] Background delivery failed", {
              error: err,
              subscriptionId: sub.id,
            });
          });
        }
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[WebhookService] Failed to trigger event", { error, event });
        return new InternalError("Failed to trigger event", { error });
      },
    );
  }

  /**
   * Delivers a webhook to a specific subscriber and logs the result.
   */
  private async deliver(
    sub: WebhookSubscription,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<Result<void, AppError>> {
    const deliveryId = crypto.randomUUID();
    const deliveryPayload = {
      id: deliveryId,
      event,
      payload,
      timestamp: new Date().toISOString(),
    };

    const signature = this.generateSignature(deliveryPayload, sub.secret);

    return ResultAsync.fromPromise(
      (async (): Promise<void> => {
        // Use withCircuit for external API call
        const response = await withCircuit(
          `webhook-delivery-${sub.id}`,
          async () => {
            const res = await fetch(sub.url, {
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
            return res;
          },
          EXTERNAL_API_CIRCUIT_OPTIONS,
        );

        const responseBody = await response.text().catch(() => "");

        // Log delivery attempt
        await withCircuit(
          "log-webhook-delivery",
          () =>
            webhookRepository.logWebhookDelivery({
              subscriptionId: sub.id,
              event,
              payload: deliveryPayload,
              responseStatus: response.status,
              responseBody: responseBody.substring(0, 2000), // Truncate long bodies
              deliveredAt: response.ok ? new Date() : null,
              attemptCount: 1,
            }),
          DB_CIRCUIT_OPTIONS,
        );

        if (!response.ok) {
          logger.warn("[WebhookService] Delivery failed", {
            url: sub.url,
            status: response.status,
          });
        }
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[WebhookService] Delivery failed", { error, url: sub.url });

        // Fire-and-forget logging for failure so we don't block
        withCircuit(
          "log-webhook-delivery-failure",
          () =>
            webhookRepository.logWebhookDelivery({
              subscriptionId: sub.id,
              event,
              payload: deliveryPayload,
              responseStatus: 0,
              responseBody: error instanceof Error ? error.message : String(error),
              deliveredAt: null,
              attemptCount: 1,
            }),
          DB_CIRCUIT_OPTIONS,
        ).catch((logError) => {
          logger.error("[WebhookService] Failed to log delivery failure", { error: logError });
        });

        return new InternalError("Delivery failed", { error });
      },
    );
  }

  /**
   * Generates a HMAC SHA256 signature for the payload to allow recipients to verify authenticity.
   */
  private generateSignature(payload: Record<string, unknown>, secret: string): string {
    return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
  }
}

export const webhookService = new WebhookService();
