/**
 * CONTACT ROUTES MODULE
 * Page-specific content routes for Contact page
 * Relocated from modules/ to resources/ for consistent architecture (October 15, 2025)
 */

import { BigQuery } from "@google-cloud/bigquery";
import { CloudTasksClient } from "@google-cloud/tasks";
import express, { type Request } from "express";
import { z } from "zod";
import type { ContactPageConfiguration } from "../../../shared/schema.js";
import { CacheKeys } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { emailService } from "../../lib/email-service.js";
import { logger } from "../../lib/monitoring/logger.js";
import { getStorage } from "../../lib/storage-singleton.js";

// Initialize Google Cloud Clients
const tasksClient = new CloudTasksClient();
const bigquery = new BigQuery();

const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const EMAIL_QUEUE = "email-queue";

const router = express.Router();

// Cache TTL constants (in seconds) - CHUNK 34: Optimized by data volatility
// PHASE 1 OPTIMIZATION: Increased TTLs to improve cache hit rate (60% → 70%+ target)
const CACHE_TTL_NAVIGATION = 7200; // 120 minutes (2 hours) - contact info changes occasionally
const CACHE_TTL_STATIC = 10800; // 180 minutes (3 hours) - business locations change rarely

/**
 * CHUNK 7: Admin Cache Bypass Utility
 * Determines if cache should be bypassed for admin or debugging requests
 */
function shouldBypassCache(req: Request): boolean {
  return req.headers.referer?.includes("/admin") || req.query.nocache === "true";
}

// Zod validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address"),
  message: z.string().trim().min(1, "Message is required").max(5000),
  company: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((val) => val || null),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((val) => val || null),
  country: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((val) => val || null),
  preferredPlatform: z.string().trim().max(50).optional(),
  honeypot: z.string().optional(),
  recaptchaToken: z.string().optional(),
});

// Contact form submission endpoint
// prettier-ignore
router.post("/contact", async (req, res) => {
  // security (public)
  const validatedData = contactFormSchema.parse(req.body);

  // Server-side honeypot validation - reject if filled (bot detection)
  if (validatedData.honeypot && validatedData.honeypot.trim().length > 0) {
    logger.warn(`[Contact] Honeypot triggered - potential spam from ${req.ip}`, {
      email: validatedData.email,
      honeypot: validatedData.honeypot.substring(0, 50),
    });
    return res.status(400).json({
      success: false,
      error: "Invalid submission",
    });
  }

  // 1. Server-side reCAPTCHA v3 Validation
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (process.env.NODE_ENV === "production" && recaptchaSecret) {
    if (!validatedData.recaptchaToken) {
      logger.warn(`[Contact] Missing reCAPTCHA token from ${req.ip}`);
      return res.status(400).json({ success: false, error: "Bot detected (missing token)" });
    }

    try {
      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${validatedData.recaptchaToken}`;
      const recaptchaRes = await fetch(verifyUrl, { method: "POST" });
      const recaptchaData = (await recaptchaRes.json()) as any;

      if (!recaptchaData.success || recaptchaData.score < 0.5) {
        logger.warn(`[Contact] reCAPTCHA failed for ${req.ip}: score ${recaptchaData.score}`);
        return res.status(400).json({ success: false, error: "Bot detected (low score)" });
      }
    } catch (error) {
      logger.error("[Contact] reCAPTCHA verification error:", error);
      // Fail open or closed? Fail closed for security in this context.
      return res.status(500).json({ success: false, error: "Security check failed" });
    }
  }

  const storage = getStorage();

  // Create inquiry in database
  const inquiry = await storage.createInquiry({
    name: validatedData.name,
    email: validatedData.email,
    message: validatedData.message,
    company: validatedData.company,
    phone: validatedData.phone,
    country: validatedData.country,
    preferredPlatform: validatedData.preferredPlatform,
    source: "contact-page",
    status: "new",
  });

  // Invalidate inquiry stats cache
  try {
    await unifiedCache.delete("inquiries:stats");
  } catch (error) {
    logger.debug("[Contact] Failed to invalidate inquiry cache:", error);
  }

  logger.info(`[Contact] New inquiry #${inquiry.id} from ${validatedData.email}`);

  // 2. Stream to BigQuery (Async - Fire and Forget)
  if (process.env.NODE_ENV === "production" && GOOGLE_CLOUD_PROJECT) {
    (async () => {
      try {
        await bigquery
          .dataset("analytics")
          .table("leads")
          .insert([
            {
              id: inquiry.id,
              name: inquiry.name,
              email: inquiry.email,
              company: inquiry.company,
              source: "contact-page",
              created_at: new Date().toISOString(),
            },
          ]);
        logger.info(`[Analytics] Streamed inquiry #${inquiry.id} to BigQuery`);
      } catch (error) {
        logger.error("[Analytics] Failed to stream to BigQuery:", error);
      }
    })();
  }

  // 3. Dispatch Email Task to Cloud Tasks (Async)
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

  if (process.env.NODE_ENV === "production" && GOOGLE_CLOUD_PROJECT) {
    try {
      const parent = tasksClient.queuePath(
        GOOGLE_CLOUD_PROJECT,
        GOOGLE_CLOUD_LOCATION,
        EMAIL_QUEUE,
      );
      const url = `https://${req.get("host")}/api/workers/send-email`;

      const task = {
        httpRequest: {
          httpMethod: "POST" as const,
          url,
          headers: {
            "Content-Type": "application/json",
          },
          body: Buffer.from(JSON.stringify(emailData)).toString("base64"),
        },
      };

      await tasksClient.createTask({ parent, task });
      logger.info(`[Contact] Dispatched email task for inquiry #${inquiry.id}`);
    } catch (error) {
      logger.error("[Contact] Failed to create Cloud Task:", error);
      // Fallback to sync email if Cloud Tasks fails?
      // For now, log error. In a real scenario, we might want a fallback or alert.
    }
  } else {
    // Development fallback: Send directly
    logger.info("[Contact] Development mode: Sending emails directly");
    emailService.sendAdminNotification(emailData).catch((e) => logger.error(e));
    emailService.sendCustomerConfirmation(emailData).catch((e) => logger.error(e));
  }

  return res.json({
    success: true,
    submissionId: inquiry.id,
    message: "Thank you for your message. We will get back to you soon!",
  });
});

// Get company contact information
router.get("/contact-info", async (req, res) => {
  const cacheKey = CacheKeys.contact.configuration();
  const cached = await unifiedCache.get<ContactPageConfiguration>(cacheKey);

  // CHUNK 7: Check cache bypass
  if (cached && !shouldBypassCache(req)) {
    logger.debug("[Contact] Returning cached contact info");
    res.setHeader("X-Cache-Hit", "true");
    return res.json(cached);
  }

  if (shouldBypassCache(req)) {
    logger.debug("[Contact] Admin/debug request - bypassing cache for contact info");
  }

  // Query contact page configuration from database
  const storage = getStorage();
  const config = await storage.getContactPageConfiguration();

  if (!config) {
    logger.warn("[Contact] No contact configuration found in database");
    return res.status(404).json({ error: "Contact configuration not found" });
  }

  // Return all configuration fields including new ones:
  // - Old fields: email, phone, address, workingHours, heroTitle, description, socialLinks, mapCoordinates
  // - New fields: locationLine1, locationLine2, locationButtonText, tradingHours, platformOptions,
  //               formButtonText, formPrivacyText, successHeading, successMessage

  // Cache for 120 minutes (7200s) - Phase 1 optimization
  await unifiedCache.set(cacheKey, config, CACHE_TTL_NAVIGATION * 1000);
  logger.debug("[Contact] Contact info cached for 120 minutes / 2 hours");

  return res.json(config);
});

// Get business locations/offices
router.get("/locations", async (req, res) => {
  const cacheKey = "business-locations";
  const cached =
    await unifiedCache.get<
      Array<{
        id: number;
        name: string;
        address: string;
        lat: number;
        lng: number;
      }>
    >(cacheKey);

  // CHUNK 7: Check cache bypass
  if (cached && !shouldBypassCache(req)) {
    res.setHeader("X-Cache-Hit", "true");
    return res.json(cached);
  }

  if (shouldBypassCache(req)) {
    logger.debug("[Contact] Admin/debug request - bypassing cache for locations");
  }

  // Placeholder business locations - replace with actual storage method
  const locations = [
    {
      id: 1,
      name: "Head Office",
      address: "Colombo, Sri Lanka",
      lat: 6.9271,
      lng: 79.8612,
    },
  ];

  await unifiedCache.set(cacheKey, locations, CACHE_TTL_STATIC * 1000);

  return res.json(locations);
});

logger.debug("[Contact Routes] ✅ Contact routes loaded (resources/)");

export default router;
