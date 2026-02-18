/**
 * WEBHOOK REPOSITORY
 * Handles webhook subscriptions and delivery logs
 */

import { eq, sql } from "drizzle-orm";
import {
  type InsertWebhookDelivery,
  type InsertWebhookSubscription,
  type WebhookSubscription,
  webhookDeliveries,
  webhookSubscriptions,
} from "../../../../shared/schema.js";
import { db } from "../../../db.js";

export class WebhookRepository {
  async getWebhookSubscriptions(): Promise<WebhookSubscription[]> {
    return await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.isActive, "Y"));
  }

  async getWebhookSubscription(id: number): Promise<WebhookSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.id, id));
    return subscription;
  }

  async createWebhookSubscription(
    subscription: InsertWebhookSubscription,
  ): Promise<WebhookSubscription> {
    const [created] = await db.insert(webhookSubscriptions).values(subscription).returning();
    return created!;
  }

  async updateWebhookSubscription(
    id: number,
    subscription: Partial<InsertWebhookSubscription>,
  ): Promise<WebhookSubscription | undefined> {
    const [updated] = await db
      .update(webhookSubscriptions)
      .set({ ...subscription, updatedAt: sql`NOW()` as any })
      .where(eq(webhookSubscriptions.id, id))
      .returning();
    return updated;
  }

  async deleteWebhookSubscription(id: number): Promise<boolean> {
    const result = await db.delete(webhookSubscriptions).where(eq(webhookSubscriptions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async logWebhookDelivery(delivery: InsertWebhookDelivery): Promise<void> {
    await db.insert(webhookDeliveries).values(delivery);
  }
}

export const webhookRepository = new WebhookRepository();
