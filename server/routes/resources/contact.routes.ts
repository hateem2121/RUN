import {
  type ContactPageConfiguration,
  ContactSubmissionSchema,
  insertContactPageConfigurationSchema,
} from "@run-remix/shared";
import express, { type Request } from "express";
import { validateRequest } from "zod-express-middleware";
import { CacheKeys, CacheOperations } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { logger } from "../../lib/monitoring/logger.js";
import { criticalTier } from "../../middleware/rate-limit-tiers.js";
import { authService } from "../../services/auth-service.js";
import { contactService } from "../../services/contact.service.js";
import { inquiryService } from "../../services/inquiry-service.js";

const router = express.Router();

// Cache TTL constants
const CACHE_TTL_NAVIGATION = 7200; // 120 minutes
const CACHE_TTL_STATIC = 10800; // 3 hours

/**
 * Determines if cache should be bypassed for admin or debugging requests
 */
function shouldBypassCache(req: Request): boolean {
  return req.headers.referer?.includes("/admin") || req.query.nocache === "true";
}

/**
 * @openapi
 * /api/contact:
 *   post:
 *     summary: Submit a contact inquiry
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactSubmission'
 *     responses:
 *       201:
 *         description: Inquiry submitted successfully
 *       422:
 *         description: Validation or security check failed
 */
router.post(
  "/contact",
  criticalTier,
  validateRequest({ body: ContactSubmissionSchema }),
  async (req, res) => {
    const parsed = ContactSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        success: false,
        error: parsed.error.message,
      });
    }

    const result = await inquiryService.processContactSubmission(parsed.data, req.ip || "unknown");

    if (result.isErr()) {
      // Validation and security errors return 422 in this domain
      const status = result.error.name === "ValidationError" ? 422 : 500;
      return res.status(status).json({
        success: false,
        error: result.error.message,
      });
    }

    const inquiry = result.value;
    logger.info(`[Contact] New inquiry #${inquiry.id} processed via service layer`);

    return res.status(201).json({
      success: true,
      submissionId: inquiry.id,
      message: "Thank you for your message. We will get back to you soon!",
    });
  },
);

/**
 * @openapi
 * /api/contact-info:
 *   get:
 *     summary: Get company contact configuration
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Contact configuration data
 */
router.get("/contact-info", async (req, res) => {
  const cacheKey = CacheKeys.contact.configuration();
  const cached = await unifiedCache.get<ContactPageConfiguration>(cacheKey);

  if (cached && !shouldBypassCache(req)) {
    res.setHeader("X-Cache-Hit", "true");
    return res.json(cached);
  }

  const result = await contactService.getContactPageConfiguration();

  return result.match(
    async (config) => {
      await unifiedCache.set(cacheKey, config, CACHE_TTL_NAVIGATION * 1000);
      return res.json(config);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * @openapi
 * /api/locations:
 *   get:
 *     summary: Get business locations
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of business locations
 */
router.get("/locations", async (req, res) => {
  const cacheKey = "business-locations";
  const cached = await unifiedCache.get<unknown[]>(cacheKey);

  if (cached && !shouldBypassCache(req)) {
    res.setHeader("X-Cache-Hit", "true");
    return res.json(cached);
  }

  const result = await contactService.getBusinessLocations();

  return result.match(
    async (locations) => {
      await unifiedCache.set(cacheKey, locations, CACHE_TTL_STATIC * 1000);
      return res.json(locations);
    },
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// ============================================================================
// ADMIN CONTACT ROUTES
// ============================================================================

router.get("/contact-page-configuration", authService.requireAdmin, async (_req, res) => {
  const result = await contactService.getContactPageConfiguration();
  return result.match(
    (data) => res.json(data || {}),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

router.post(
  "/admin/contact-page-configuration",
  authService.requireAdmin,
  validateRequest({ body: insertContactPageConfigurationSchema }),
  async (req, res) => {
    const parsed = insertContactPageConfigurationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } });
    }
    const result = await contactService.createContactPageConfiguration(parsed.data);

    return result.match(
      async (config) => {
        await CacheOperations.invalidateContact().catch((err) =>
          logger.error("[Contact] Cache invalidation failed:", err),
        );
        return res.status(201).json(config);
      },
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

router.patch(
  "/admin/contact-page-configuration",
  authService.requireAdmin,
  validateRequest({ body: insertContactPageConfigurationSchema.partial() }),
  async (req, res) => {
    // Singleton ID 1 logic maintained but delegated correctly
    const parsed = insertContactPageConfigurationSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } });
    }
    const result = await contactService.updateContactPageConfiguration(1, parsed.data);

    return result.match(
      async (config) => {
        await CacheOperations.invalidateContact().catch((err) =>
          logger.error("[Contact] Cache invalidation failed:", err),
        );
        return res.json(config);
      },
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

logger.debug("[Contact Routes] ✅ Refactored to Thin Controller (resources/)");

export default router;
