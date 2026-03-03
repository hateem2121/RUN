/**
 * FOOTER CONFIGURATION ROUTES MODULE
 * Admin endpoints for managing footer configuration
 * Refactored to use Drizzle ORM directly for type safety and performance
 */

import { eq, inArray } from "drizzle-orm";
import express from "express";
import {
  certificates,
  footerConfiguration,
  insertFooterConfigurationSchema,
  mediaAssets,
} from "../../../shared/index.js";
import { db } from "../../db.js";
import { CacheKeys } from "../../lib/cache/cache-strategies.js";
import { unifiedCache } from "../../lib/cache/unified-cache.js";
import { logger } from "../../lib/monitoring/logger.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authService } from "../../services/auth-service.js";

const router = express.Router();

const CACHE_TTL_FOOTER = 3600; // 1 hour cache for footer

// Helper function to fetch and build footer configuration
async function getFooterConfig() {
  // Query DB for footer config
  const [config] = await db.select().from(footerConfiguration).limit(1);

  // Default fallback if no config exists
  const baseResponse = config || {
    id: null,
    contactFormHeading: "GET IN TOUCH WITH RUN APPAREL",
    contactFormEnabled: true,
    navigationColumns: [],
    socialLinks: [],
    certificateIds: [],
    legalLinks: [],
    companyName: "RUN APPAREL (PVT) LTD",
    companyAddress: "13km Daska Road, Sialkot 51040, Pakistan",
    companyPhone: "+92 336 1777313",
    companyEmail: "team@run-apparel.com",
    brandText: "RUN APPAREL",
    brandTagline: "Ethically Engineered • Sustainably Crafted",
    brandSubtext: "A subsidiary of Durus Industries",
    structuredData: {},
  };

  // Populate full certificate details with media
  let certifications: Array<{
    id: number;
    name: string;
    imageUrl: string;
    type: string | null;
    issuingOrganization: string | null;
  }> = [];

  if (baseResponse.certificateIds && baseResponse.certificateIds.length > 0) {
    try {
      const certIds = baseResponse.certificateIds;

      // Batch fetch certificates using Drizzle
      const fetchedCertificates = await db
        .select({
          id: certificates.id,
          name: certificates.name,
          type: certificates.type,
          issuingOrganization: certificates.issuingOrganization,
          imageId: certificates.imageId,
          imageUrl: certificates.imageUrl, // Fallback
        })
        .from(certificates)
        .where(inArray(certificates.id, certIds));

      const certificateMap = new Map(fetchedCertificates.map((cert) => [cert.id, cert]));

      // Collect imageIds for batch fetching
      const imageIds = fetchedCertificates
        .map((c) => c.imageId)
        .filter((id): id is number => id !== null);

      // Batch fetch media
      let mediaMap = new Map();
      if (imageIds.length > 0) {
        const medias = await db.select().from(mediaAssets).where(inArray(mediaAssets.id, imageIds));

        mediaMap = new Map(medias.map((m) => [m.id, m]));
      }

      // Map results preserving order of certificateIds
      const certificatesWithNulls = certIds.map((certId) => {
        const cert = certificateMap.get(certId);
        if (!cert) {
          return null;
        }

        let imageUrl = cert.imageUrl || "";
        if (cert.imageId) {
          const media = mediaMap.get(cert.imageId);
          if (media && !media.deletedAt) {
            imageUrl = `/api/media/${media.id}/content`;
          }
        }

        return {
          id: cert.id,
          name: cert.name,
          imageUrl,
          type: cert.type,
          issuingOrganization: cert.issuingOrganization,
        };
      });

      certifications = certificatesWithNulls.filter(
        (cert): cert is NonNullable<typeof cert> => cert !== null,
      );
    } catch (error) {
      logger.error("[Footer] Error populating certificates:", error);
      certifications = [];
    }
  }

  return {
    ...baseResponse,
    certifications,
  };
}

// Validation schema for updates (partial allow)
const updateSchema = insertFooterConfigurationSchema.partial();

// PUBLIC endpoint for footer configuration
router.get(
  "/footer",
  asyncHandler(async (_req, res) => {
    const cacheKey = CacheKeys.footer.config();

    const cached = await unifiedCache.get<unknown>(cacheKey);
    if (cached) {
      res.setHeader("X-Cache-Hit", "true");
      return res.json(cached);
    }

    const response = await getFooterConfig();

    await unifiedCache.set(cacheKey, response, CACHE_TTL_FOOTER * 1000);
    return res.json(response);
  }),
);

// ADMIN endpoint for footer configuration
router.get(
  "/admin/footer",
  authService.requireAdmin,
  asyncHandler(async (_req, res) => {
    // Shared cache key with public endpoint
    const cacheKey = CacheKeys.footer.config();
    const cached = await unifiedCache.get<unknown>(cacheKey);

    if (cached) {
      res.setHeader("X-Cache-Hit", "true");
      return res.json(cached);
    }

    const response = await getFooterConfig();
    await unifiedCache.set(cacheKey, response, CACHE_TTL_FOOTER * 1000);
    return res.json(response);
  }),
);

// prettier-ignore
router.patch(
  "/admin/footer",
  authService.requireAdmin,
  asyncHandler(async (req, res) => {
    // security
    // 1. Validate payload
    const validatedData = updateSchema.parse(req.body);

    // 2. Transform/Normalize data for frontend compatibility if needed
    // The new schema expects strict JSONB structures, but we keep the logic resilient
    // Mapping isn't strictly necessary if frontend matches schema, but good for safety

    /* 
       Note: The frontend currently sends `url` / `platform` sometimes.
       We map them to `href` / `name` to match our strict schema.
    */
    const normalizedData: Record<string, unknown> = { ...validatedData };

    if (validatedData.navigationColumns) {
      normalizedData.navigationColumns = validatedData.navigationColumns.map((col) => ({
        title: col.title,
        links:
          col.links?.map((link) => ({
            label: link.label,
            href: link.href || ((link as Record<string, unknown>).url as string),
            external: link.external,
          })) || [],
      }));
    }

    if (validatedData.socialLinks) {
      normalizedData.socialLinks = validatedData.socialLinks.map((social) => ({
        name: social.name || ((social as Record<string, unknown>).platform as string),
        icon: social.icon,
        href: social.href || ((social as Record<string, unknown>).url as string),
        hoverColor: social.hoverColor,
      }));
    }

    if (validatedData.legalLinks) {
      normalizedData.legalLinks = validatedData.legalLinks.map((link) => ({
        label: link.label,
        href: link.href || ((link as Record<string, unknown>).url as string),
      }));
    }

    // 3. Perform Upsert
    const [existing] = await db.select().from(footerConfiguration).limit(1);

    let updated;
    if (existing) {
      [updated] = await db
        .update(footerConfiguration)
        .set({ ...normalizedData, updatedAt: new Date() })
        .where(eq(footerConfiguration.id, existing.id))
        .returning();
    } else {
      [updated] = await db
        .insert(footerConfiguration)
        .values({ ...normalizedData })
        .returning();
    }

    // 4. Invalidate Cache
    try {
      await unifiedCache.delete(CacheKeys.footer.config());
      logger.info(`[Footer] Cache invalidated for ${CacheKeys.footer.config()}`);
    } catch (cacheError) {
      logger.warn("[Footer] Cache invalidation failed (non-fatal):", cacheError);
    }

    logger.info("[Footer] Footer configuration updated successfully", {
      id: updated?.id,
      updatedFields: Object.keys(normalizedData),
    });

    return res.json(updated);
  }),
);

logger.debug("[Footer Config Routes] ✅ Footer configuration routes loaded (Drizzle Optimized)");

export default router;
