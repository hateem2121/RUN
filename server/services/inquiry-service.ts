/**
 * INQUIRY SERVICE
 * Handles business logic for contact form inquiries,
 * including statistics, caching, and state management.
 */

import { BigQuery } from "@google-cloud/bigquery";
import { CloudTasksClient } from "@google-cloud/tasks";
import { err, ok, type Result } from "neverthrow";
import type { Inquiry, InsertInquiry } from "../../shared/schemas/content/common.js";
import { unifiedCache } from "../lib/cache/unified-cache.js";
import { miscRepository } from "../lib/db/repositories/index.js";
import { type AppError, DatabaseError, NotFoundError, ValidationError } from "../lib/errors.js";
import {
  emailService,
  type InquiryEmailData as InquiryEmailJobData,
} from "../lib/integrations/email-service.js";
import { logger } from "../lib/monitoring/logger.js";
import {
  DB_CIRCUIT_OPTIONS,
  EXTERNAL_API_CIRCUIT_OPTIONS,
  withCircuit,
} from "../lib/resilience/circuit-breaker.js";
import { verifyRecaptcha } from "../lib/security/recaptcha-verify.js";

const CACHE_TTL_INQUIRIES = 300; // 5 minutes

// Initialize Google Cloud Clients for production flow
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const EMAIL_QUEUE_KEY = "email-queue";

const tasksClient = new CloudTasksClient();
const bigquery = new BigQuery();

export class InquiryService {
  /**
   * Processes a public contact page submission (AS-116).
   * Encapsulates Honeypot validation and reCAPTCHA verification.
   */
  async processContactSubmission(
    validatedData: Record<string, unknown>,
    clientIp: string,
  ): Promise<Result<Inquiry, AppError>> {
    // 1. Honeypot Validation
    if (typeof validatedData.honeypot === "string" && validatedData.honeypot.trim().length > 0) {
      logger.warn(`[InquiryService] Honeypot triggered - potential spam from ${clientIp}`, {
        email: validatedData.email,
      });
      return err(new ValidationError("Security validation failed (HP)"));
    }

    // 2. reCAPTCHA Verification
    const recaptchaResult = await verifyRecaptcha(validatedData.recaptchaToken as string, clientIp);
    if (!recaptchaResult.success) {
      logger.warn(`[InquiryService] reCAPTCHA failed for ${validatedData.email}`, {
        error: recaptchaResult.error,
      });
      return err(new ValidationError(recaptchaResult.error || "Security check failed (RC)"));
    }

    // 3. Map to Insert Schema
    const insertData: InsertInquiry = {
      name: validatedData.name as string,
      email: validatedData.email as string,
      message: validatedData.message as string,
      company: (validatedData.company as string) || null,
      phone: (validatedData.phone as string) || null,
      country: (validatedData.country as string) || null,
      preferredPlatform: (validatedData.preferredPlatform as string) || null,
      source: "contact-page",
      status: "new",
      submittedAt: new Date(),
    };

    return this.createInquiry(insertData);
  }

  /**
   * Creates an inquiry from the public payload (AS-108).
   * Handles mapping from frontend structure to database schema.
   */
  async createFromPublicPayload(
    validatedData: Record<string, unknown>,
  ): Promise<Result<Inquiry, AppError>> {
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic contact structure
    const contact = (validatedData.contact as Record<string, any>) || {};
    const insertData: InsertInquiry = {
      name: contact.name,
      email: contact.email,
      company: contact.company,
      phone: contact.phone,
      country: contact.country,
      message: contact.message,
      source: validatedData.source as string,
      items:
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic items array
        ((validatedData.items as any[]) || [])?.map((item) => ({
          productId: (item.productId as number) || 0,
          quantity: (item.quantity as number) || 1,
          notes: (item.notes as string) || null,
        })) || [],
      submittedAt: new Date(),
    };

    return this.createInquiry(insertData);
  }

  /**
   * Creates a new inquiry, ensuring consistent encryption and validation.
   * Centralizes all side-effects (Encryption, Webhooks, BigQuery, Cloud Tasks).
   */
  async createInquiry(data: InsertInquiry): Promise<Result<Inquiry, AppError>> {
    try {
      const inquiry = await withCircuit(
        "create-inquiry",
        () => miscRepository.createInquiry(data),
        DB_CIRCUIT_OPTIONS,
      );

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

      return ok(inquiry);
    } catch (error) {
      return err(new DatabaseError("Failed to create inquiry", { cause: error }));
    }
  }

  /**
   * Internal helper to stream inquiry to BigQuery analytics.
   */
  private async streamToBigQuery(inquiry: Inquiry) {
    try {
      await withCircuit(
        "stream-to-bigquery",
        async () => {
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
        },
        EXTERNAL_API_CIRCUIT_OPTIONS,
      );
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
    const emailData: InquiryEmailJobData = {
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      company: inquiry.company ?? undefined,
      phone: inquiry.phone ?? undefined,
      country: inquiry.country ?? undefined,
      message: inquiry.message,
      preferredPlatform: inquiry.preferredPlatform ?? undefined,
      submittedAt: inquiry.submittedAt,
      items: inquiry.items || undefined,
    };

    if (process.env.NODE_ENV === "production" && GOOGLE_CLOUD_PROJECT) {
      try {
        await withCircuit(
          "dispatch-cloud-task",
          async () => {
            const parent = tasksClient.queuePath(
              GOOGLE_CLOUD_PROJECT,
              GOOGLE_CLOUD_LOCATION,
              EMAIL_QUEUE_KEY,
            );
            const task = {
              httpRequest: {
                httpMethod: "POST" as const,
                url: `${process.env.CLOUD_RUN_SERVICE_URL || "https://run-remix.app"}/api/worker/send-email`,
                headers: { "Content-Type": "application/json" },
                body: Buffer.from(JSON.stringify(emailData)).toString("base64"),
              },
            };
            await tasksClient.createTask({ parent, task });
          },
          EXTERNAL_API_CIRCUIT_OPTIONS,
        );
        logger.info(`[InquiryService] Dispatched Cloud Task for inquiry #${inquiry.id}`);
      } catch (error) {
        logger.error("[InquiryService] Cloud Tasks failed, falling back to EmailService:", error);
        await this.fallbackSyncEmail(emailData);
      }
    } else {
      await this.fallbackSyncEmail(emailData);
    }
  }

  private async fallbackSyncEmail(emailData: InquiryEmailJobData) {
    try {
      await withCircuit(
        "fallback-sync-email",
        async () => {
          await emailService.sendAdminNotification(emailData);
          await emailService.sendCustomerConfirmation(emailData);
        },
        EXTERNAL_API_CIRCUIT_OPTIONS,
      );
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
  }): Promise<
    Result<
      {
        data: Inquiry[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      },
      AppError
    >
  > {
    const page = params.page || 1;
    const limit = params.limit || 20;

    try {
      const result = await withCircuit(
        "list-inquiries",
        () =>
          miscRepository.listInquiries({
            page,
            limit,
            status: params.status,
            source: params.source,
            search: params.search,
          }),
        DB_CIRCUIT_OPTIONS,
      );

      return ok({
        data: result.inquiries,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      return err(new DatabaseError("Failed to list inquiries", { cause: error }));
    }
  }

  /**
   * Fetches inquiry statistics with caching.
   */
  async getStats(): Promise<
    Result<
      { byStatus: Record<string, number>; bySource: Record<string, number>; recentCount: number },
      AppError
    >
  > {
    const cacheKey = "inquiries:stats";

    try {
      const cached = await unifiedCache.get<{
        byStatus: Record<string, number>;
        bySource: Record<string, number>;
        recentCount: number;
      }>(cacheKey);

      if (cached) {
        return ok(cached);
      }

      const stats = await withCircuit(
        "get-inquiry-stats",
        () => miscRepository.getInquiryStats(),
        DB_CIRCUIT_OPTIONS,
      );
      const defaultStats = {
        byStatus: { new: 0, read: 0, responded: 0, archived: 0 },
        bySource: {},
        recentCount: 0,
      };

      const finalStats = stats || defaultStats;
      await unifiedCache.set(cacheKey, finalStats, CACHE_TTL_INQUIRIES * 1000);

      return ok(finalStats);
    } catch (error) {
      logger.error("[InquiryService] Failed to fetch stats:", error);
      return err(new DatabaseError("Failed to fetch inquiry statistics", { cause: error }));
    }
  }

  /**
   * Fetches a single inquiry by ID with caching.
   */
  async getInquiryById(id: number): Promise<Result<Inquiry, AppError>> {
    const cacheKey = `inquiries:detail:${id}`;

    try {
      const cached = await unifiedCache.get<Inquiry>(cacheKey);
      if (cached) {
        return ok(cached);
      }

      const inquiry = await withCircuit(
        "get-inquiry-by-id",
        () => miscRepository.getInquiryById(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!inquiry) {
        return err(new NotFoundError(`Inquiry with ID ${id} not found`));
      }

      await unifiedCache.set(cacheKey, inquiry, CACHE_TTL_INQUIRIES * 1000);
      return ok(inquiry);
    } catch (error) {
      if (error instanceof NotFoundError) return err(error);
      return err(new DatabaseError("Failed to fetch inquiry", { cause: error }));
    }
  }

  /**
   * Updates an inquiry, invalidating relevant caches.
   */
  async updateInquiry(
    id: number,
    data: Partial<InsertInquiry>,
  ): Promise<Result<Inquiry, AppError>> {
    try {
      const updated = await withCircuit(
        "update-inquiry",
        () => miscRepository.updateInquiry(id, data),
        DB_CIRCUIT_OPTIONS,
      );
      if (!updated) {
        return err(new NotFoundError(`Inquiry with ID ${id} not found`));
      }

      await this.invalidateInquiryCaches(id);
      logger.info(`[InquiryService] Inquiry #${id} updated`);

      return ok(updated);
    } catch (error) {
      if (error instanceof NotFoundError) return err(error);
      return err(new DatabaseError("Failed to update inquiry", { cause: error }));
    }
  }

  /**
   * Adds a CRM interaction log to an inquiry.
   */
  async addCrmLog(
    id: number,
    log: { action: string; note: string; user?: string },
  ): Promise<Result<Inquiry, AppError>> {
    try {
      const updated = await withCircuit(
        "add-crm-log",
        () => miscRepository.addCrmLog(id, log),
        DB_CIRCUIT_OPTIONS,
      );
      if (!updated) {
        return err(new NotFoundError(`Inquiry with ID ${id} not found`));
      }

      await this.invalidateInquiryCaches(id);
      logger.info(`[InquiryService] CRM log added to inquiry #${id}`);

      return ok(updated);
    } catch (error) {
      if (error instanceof NotFoundError) return err(error);
      return err(new DatabaseError("Failed to add CRM log", { cause: error }));
    }
  }

  /**
   * Deletes an inquiry and invalidates relevant caches.
   */
  async deleteInquiry(id: number): Promise<Result<boolean, AppError>> {
    try {
      const success = await withCircuit(
        "delete-inquiry",
        () => miscRepository.deleteInquiry(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!success) {
        return err(new NotFoundError(`Inquiry with ID ${id} not found`));
      }

      await this.invalidateInquiryCaches(id);
      logger.info(`[InquiryService] Inquiry #${id} deleted`);

      return ok(true);
    } catch (error) {
      if (error instanceof NotFoundError) return err(error);
      return err(new DatabaseError("Failed to delete inquiry", { cause: error }));
    }
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
