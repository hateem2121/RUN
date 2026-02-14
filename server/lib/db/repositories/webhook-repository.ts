/**
 * WEBHOOK REPOSITORY
 * Handles webhook subscriptions and delivery logs
 */

import { webhookDeliveries, webhookSubscriptions } from "@run-remix/shared";
import { eq, sql } from "drizzle-orm";
import { db } from "../../../db.js";

export class WebhookRepository {
  async getWebhookSubscriptions() {
    return await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.isActive, "Y"));
  }

  async getWebhookSubscription(id: number) {
    const [subscription] = await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.id, id));
    return subscription;
  }

  async createWebhookSubscription(subscription: any) {
    const [created] = await db.insert(webhookSubscriptions).values(subscription).returning();
    return created;
  }

  async updateWebhookSubscription(id: number, subscription: any) {
    const [updated] = await db
      .update(webhookSubscriptions)
      .set({ ...subscription, updatedAt: sql`NOW()` })
      .where(eq(webhookSubscriptions.id, id))
      .returning();
    return updated;
  }

  async deleteWebhookSubscription(id: number) {
    const result = await db.delete(webhookSubscriptions).where(eq(webhookSubscriptions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async logWebhookDelivery(delivery: any) {
    await db.insert(webhookDeliveries).values(delivery);
  }
}

export const webhookRepository = new WebhookRepository();
