/**
 * WEBHOOK REPOSITORY
 * Handles webhook subscriptions and delivery logs
 */

import {
  type InsertWebhookDelivery,
  type InsertWebhookSubscription,
  type WebhookSubscription,
  webhookDeliveries,
  webhookSubscriptions,
} from "@run-remix/shared";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db.js";
import { StorageSingleton } from "../../lib/storage-singleton.js";

class WebhookRepository {
  async getWebhookSubscriptions(): Promise<WebhookSubscription[]> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getWebhookSubscriptions();
    }
    return await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.isActive, true));
  }

  async getWebhookSubscription(id: number): Promise<WebhookSubscription | undefined> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getWebhookSubscription(id);
    }
    const [subscription] = await db
      .select()
      .from(webhookSubscriptions)
      .where(eq(webhookSubscriptions.id, id));
    return subscription;
  }

  async createWebhookSubscription(
    subscription: InsertWebhookSubscription,
  ): Promise<WebhookSubscription> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createWebhookSubscription(subscription);
    }
    const [created] = await db.insert(webhookSubscriptions).values(subscription).returning();
    return created!;
  }

  async updateWebhookSubscription(
    id: number,
    subscription: Partial<InsertWebhookSubscription>,
  ): Promise<WebhookSubscription | undefined> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateWebhookSubscription(id, subscription);
    }
    const [updated] = await db
      .update(webhookSubscriptions)
      .set({ ...subscription, updatedAt: sql`NOW()` as unknown as Date })
      .where(eq(webhookSubscriptions.id, id))
      .returning();
    return updated;
  }

  async deleteWebhookSubscription(id: number): Promise<boolean> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteWebhookSubscription(id);
    }
    const result = await db.delete(webhookSubscriptions).where(eq(webhookSubscriptions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async logWebhookDelivery(delivery: InsertWebhookDelivery): Promise<void> {
    // In test mode with memory storage, redirect to the storage instance
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().logWebhookDelivery(delivery);
    }
    await db.insert(webhookDeliveries).values(delivery);
  }
}

export const webhookRepository = new WebhookRepository();
