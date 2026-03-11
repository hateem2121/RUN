/**
 * INQUIRY SERVICE
 * Handles business logic for contact form inquiries,
 * including statistics, caching, and state management.
 */

import { BigQuery } from "@google-cloud/bigquery";
import { CloudTasksClient } from "@google-cloud/tasks";
import type { Inquiry, InsertInquiry } from "../../shared/schemas/content/common.js";
import { unifiedCache } from "../lib/cache/unified-cache.js";
import { CircuitBreaker } from "../lib/circuit-breaker.js";
import { miscRepository } from "../lib/db/repositories/index.js";
import { emailService } from "../lib/integrations/email-service.js";
import { logger } from "../lib/monitoring/logger.js";

const CACHE_TTL_INQUIRIES = 300; // 5 minutes

// Initialize Google Cloud Clients for production flow
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const EMAIL_QUEUE_KEY = "email-queue";

import { emailQueue } from "../lib/queue/email-queue.js";

const tasksClient = new CloudTasksClient();
const bigquery = new BigQuery();

// Initialize Circuit Breakers
const emailBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30s
  requestTimeout: 10000, // 10s
});

const analyticsBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1m
  requestTimeout: 5000, // 5s
});

export class InquiryService {
  /**
   * Creates a new inquiry, ensuring consistent encryption and validation.
   * Centralizes all side-effects (Encryption, Webhooks, BigQuery, Cloud Tasks).
   */
  async createInquiry(data: InsertInquiry): Promise<Inquiry> {
    const inquiry = await miscRepository.createInquiry(data);

    // 1. Invalidate Relevant Caches
    try {
      await unifiedCache.delete("inquiries:stats");
    } catch (error) {
      logger.debug("[InquiryService] Cache invalidation failed:", error);
    }

    // 2. Trigger Webhook
    try {
      const { webhookService } = await import("./webhook-service.js");
      webhookService.trigger("inquiry.created", inquiry);
    } catch (error) {
      logger.error("[InquiryService] Failed to trigger inquiry webhook:", error);
    }

    // 3. Stream to BigQuery (Fire and Forget)
    if (process.env.NODE_ENV === "production" && GOOGLE_CLOUD_PROJECT) {
      this.streamToBigQuery(inquiry).catch((err) =>
        logger.error("[InquiryService] BigQuery streaming failed:", err),
      );
    }

    // 4. Dispatch Email Automation
    this.dispatchEmailAutomation(inquiry).catch((err) =>
      logger.error("[InquiryService] Email automation failed:", err),
    );

    return inquiry;
  }

  /**
   * Internal helper to stream inquiry to BigQuery analytics.
   */
  private async streamToBigQuery(inquiry: Inquiry) {
    try {
      await analyticsBreaker.fire(async () => {
        await bigquery
          .dataset("analytics")
          .table("leads")
          .insert([
            {
              id: inquiry.id,
              name: inquiry.name,
              email: inquiry.email,
              company: inquiry.company,
              source: inquiry.source,
              created_at: inquiry.submittedAt.toISOString(),
            },
          ]);
      });
      logger.info("[InquiryService] Streamed inquiry to BigQuery", { inquiryId: inquiry.id });
    } catch (error) {
      // Breaker open or insert failed
      logger.debug("[InquiryService] BigQuery insert skipped (Circuit Open or Failed)", { error });
    }
  }

  /**
   * Internal helper to dispatch email automation via Cloud Tasks (Prod) or EmailService (Dev).
   */
  private async dispatchEmailAutomation(inquiry: Inquiry) {
    const emailData = {
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      company: inquiry.company ?? undefined,
      phone: inquiry.phone ?? undefined,
      country: inquiry.country ?? undefined,
      message: inquiry.message,
      preferredPlatform: inquiry.preferredPlatform ?? undefined,
      submittedAt: inquiry.submittedAt,
    };

    if (emailQueue) {
      try {
        await emailQueue.add("send-inquiry-email", emailData);
        logger.info(`[InquiryService] Added email job to BullMQ for inquiry #${inquiry.id}`);
        return;
      } catch (error) {
        logger.error("[InquiryService] Failed to add to email queue, falling back:", error);
      }
    }

    if (process.env.NODE_ENV === "production" && GOOGLE_CLOUD_PROJECT) {
      try {
        const parent = tasksClient.queuePath(
          GOOGLE_CLOUD_PROJECT,
          GOOGLE_CLOUD_LOCATION,
          EMAIL_QUEUE_KEY,
        );
        // Note: URL derivation might need care if service is not on same host
        const task = {
          httpRequest: {
            httpMethod: "POST" as const,
            url: `https://run-remix.app/api/workers/send-email`, // Hardcoded for prod security
            headers: { "Content-Type": "application/json" },
            body: Buffer.from(JSON.stringify(emailData)).toString("base64"),
          },
        };
        await tasksClient.createTask({ parent, task });
        logger.info(`[InquiryService] Dispatched Cloud Task for inquiry #${inquiry.id}`);
      } catch (error) {
        logger.error("[InquiryService] Cloud Tasks failed, falling back to EmailService:", error);
        await this.fallbackSyncEmail(emailData);
      }
    } else {
      await this.fallbackSyncEmail(emailData);
    }
  }

  private async fallbackSyncEmail(emailData: any) {
    try {
      await emailBreaker.fire(async () => {
        await emailService.sendAdminNotification(emailData);
        await emailService.sendCustomerConfirmation(emailData);
      });
      logger.info("[InquiryService] Dispatched synchronous emails", { inquiryId: emailData.id });
    } catch (error) {
      logger.error("[InquiryService] Email dispatch failed (Circuit Open or Failed)", { error });
    }
  }

  /**
   * Lists inquiries with pagination and filters.
   */
  async listInquiries(params: {
    page?: number;
    limit?: number;
    status?: string | undefined;
    source?: string | undefined;
    search?: string | undefined;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;

    const result = await miscRepository.listInquiries({
      page,
      limit,
      status: params.status,
      source: params.source,
      search: params.search,
    });

    return {
      data: result.inquiries,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Fetches inquiry statistics with caching.
   */
  async getStats() {
    const cacheKey = "inquiries:stats";

    try {
      const cached = await unifiedCache.get<{
        byStatus: Record<string, number>;
        bySource: Record<string, number>;
        recentCount: number;
      }>(cacheKey);

      if (cached) {
        return { data: cached, fromCache: true };
      }

      const stats = await miscRepository.getInquiryStats();
      const defaultStats = {
        byStatus: { new: 0, read: 0, responded: 0, archived: 0 },
        bySource: {},
        recentCount: 0,
      };

      const finalStats = stats || defaultStats;
      await unifiedCache.set(cacheKey, finalStats, CACHE_TTL_INQUIRIES * 1000);

      return { data: finalStats, fromCache: false };
    } catch (error) {
      logger.error("[InquiryService] Failed to fetch stats:", error);
      return {
        data: {
          byStatus: { new: 0, read: 0, responded: 0, archived: 0 },
          bySource: {},
          recentCount: 0,
        },
        fromCache: false,
        error: "Failed to fetch stats",
      };
    }
  }

  /**
   * Fetches a single inquiry by ID with caching.
   */
  async getInquiryById(id: number) {
    const cacheKey = `inquiries:detail:${id}`;

    const cached = await unifiedCache.get<any>(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }

    const inquiry = await miscRepository.getInquiryById(id);
    if (!inquiry) {
      return null;
    }

    await unifiedCache.set(cacheKey, inquiry, CACHE_TTL_INQUIRIES * 1000);
    return { data: inquiry, fromCache: false };
  }

  /**
   * Updates an inquiry's status and notes, invalidating relevant caches.
   */
  /**
   * Updates an inquiry, invalidating relevant caches.
   */
  async updateInquiry(id: number, data: Partial<InsertInquiry>) {
    const updated = await miscRepository.updateInquiry(id, data);
    if (!updated) {
      return null;
    }

    await this.invalidateInquiryCaches(id);
    logger.info(`[InquiryService] Inquiry #${id} updated`);

    return updated;
  }

  /**
   * Adds a CRM interaction log to an inquiry.
   */
  async addCrmLog(id: number, log: { action: string; note: string; user?: string }) {
    const updated = await miscRepository.addCrmLog(id, log);
    if (!updated) {
      return null;
    }

    await this.invalidateInquiryCaches(id);
    logger.info(`[InquiryService] CRM log added to inquiry #${id}`);

    return updated;
  }

  /**
   * Deletes an inquiry and invalidates relevant caches.
   */
  async deleteInquiry(id: number) {
    const deleted = await miscRepository.deleteInquiry(id);
    if (!deleted) {
      return false;
    }

    await this.invalidateInquiryCaches(id);
    logger.info(`[InquiryService] Inquiry #${id} deleted`);

    return true;
  }

  /**
   * Helper to invalidate stats and detail caches.
   */
  private async invalidateInquiryCaches(id: number) {
    try {
      await unifiedCache.delete("inquiries:stats");
      await unifiedCache.delete(`inquiries:detail:${id}`);
    } catch (error) {
      logger.debug(`[InquiryService] Cache invalidation failed for #${id}:`, error);
    }
  }
}

export const inquiryService = new InquiryService();
