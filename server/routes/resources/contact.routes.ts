import express, { type Request } from "express";
import {
  type ContactPageConfiguration,
  insertContactPageConfigurationSchema,
} from "../../../shared/index.js";
import { ContactSubmissionSchema } from "../../../shared/validation/contact.js";
import { CacheKeys, CacheOperations } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { ValidationError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { verifyRecaptcha } from "../../lib/security/recaptcha-verify.js";
import { criticalTier } from "../../middleware/rate-limit-tiers.js";
import { authService } from "../../services/auth-service.js";
import { contactService } from "../../services/contact.service.js";

const router = express.Router();

// Cache TTL constants (in seconds) - CHUNK 34: Optimized by data volatility
// PHASE 1 OPTIMIZATION: Increased TTLs to improve cache hit rate (60% → 70%+ target)
const CACHE_TTL_NAVIGATION = 7200; // 120 minutes (2 hours) - contact info changes occasionally
const CACHE_TTL_STATIC = 10800; // 3 hours

/**
 * Determines if cache should be bypassed for admin or debugging requests
 */
function shouldBypassCache(req: Request): boolean {
  return req.headers.referer?.includes("/admin") || req.query.nocache === "true";
}

// Contact form submission endpoint
router.post("/contact", criticalTier, async (req, res) => {
  const validation = ContactSubmissionSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid contact submission", { issues: validation.error.issues });
  }

  const validatedData = validation.data;

  // Server-side honeypot validation - reject if filled (bot detection)
  if (validatedData.honeypot && validatedData.honeypot.trim().length > 0) {
    logger.warn(`[Contact] Honeypot triggered - potential spam from ${req.ip}`, {
      email: validatedData.email,
    });
    return res.status(422).json({
      success: false,
      error: "Security validation failed",
    });
  }

  // 1. Server-side reCAPTCHA v3 Validation
  const recaptchaResult = await verifyRecaptcha(validatedData.recaptchaToken, req.ip || "unknown");

  if (!recaptchaResult.success) {
    return res.status(422).json({
      success: false,
      error: recaptchaResult.error || "Security check failed",
    });
  }

  // Create inquiry via unified service layer
  const { inquiryService } = await import("../../services/inquiry-service.js");
  const inquiryResult = await inquiryService.createInquiry({
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

  if (inquiryResult.isErr()) {
    throw inquiryResult.error;
  }

  const inquiry = inquiryResult.value;

  logger.info(
    `[Contact] New inquiry #${inquiry.id} from ${validatedData.email} via unified service`,
  );

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

  // Check cache bypass
  if (cached && !shouldBypassCache(req)) {
    res.setHeader("X-Cache-Hit", "true");
    return res.json(cached);
  }

  // Query contact page configuration from database via service
  const result = await contactService.getContactPageConfiguration();

  if (result.isErr()) {
    throw result.error;
  }

  const config = result.value;

  // Cache for 120 minutes (7200s)
  await unifiedCache.set(cacheKey, config, CACHE_TTL_NAVIGATION * 1000);

  return res.json(config);
});

// Get business locations/offices
router.get("/locations", async (req, res) => {
  const cacheKey = "business-locations";
  const cached = await unifiedCache.get<unknown[]>(cacheKey);

  // Check cache bypass
  if (cached && !shouldBypassCache(req)) {
    res.setHeader("X-Cache-Hit", "true");
    return res.json(cached);
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

// ============================================================================
// ADMIN CONTACT ROUTES
// ============================================================================

// Contact page configuration
router.get("/contact-page-configuration", async (_req, res) => {
  const result = await contactService.getContactPageConfiguration();

  if (result.isErr()) {
    throw result.error;
  }

  return res.json(result.value || {});
});

router.post("/admin/contact-page-configuration", authService.requireAdmin, async (req, res) => {
  const validation = insertContactPageConfigurationSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid contact configuration", { issues: validation.error.issues });
  }

  const result = await contactService.createContactPageConfiguration(validation.data);

  if (result.isErr()) {
    throw result.error;
  }

  // Invalidate contact page cache after successful creation
  await CacheOperations.invalidateContact().catch((err) =>
    logger.error("[Contact] Cache invalidation failed:", err),
  );

  return res.json(result.value);
});

router.patch("/admin/contact-page-configuration", authService.requireAdmin, async (req, res) => {
  const validation = insertContactPageConfigurationSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid contact configuration", { issues: validation.error.issues });
  }
  // Contact page configuration is a singleton - always use ID 1
  const result = await contactService.updateContactPageConfiguration(1, validation.data);

  if (result.isErr()) {
    throw result.error;
  }

  // Invalidate contact page cache after successful update
  await CacheOperations.invalidateContact().catch((err) =>
    logger.error("[Contact] Cache invalidation failed:", err),
  );

  return res.json(result.value);
});

logger.debug("[Contact Routes] ✅ Contact routes loaded (resources/)");

export default router;
