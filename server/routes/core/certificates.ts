import { insertCertificateSchema } from "@run-remix/shared";
import { Router } from "express";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { logger } from "../../lib/monitoring/logger.js";
import { removeUndefined, validateIdParam } from "../../lib/utilities/core-utils.js";
import { apiTier } from "../../middleware/rate-limit-tiers.js";
import { miscService } from "../../services/cms/misc.service.js";
import { authService } from "../../services/system/auth.service.js";

/**
 * CERTIFICATES ROUTER MODULE
 * Handles all certificate CRUD operations and relationships via miscService
 */
const router = Router();
router.use(apiTier);

// GET /api/certificates - List all certificates
router.get("/certificates", async (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");

  const result = await miscService.getCertificates();
  return result.match(
    (certificates) => res.json(certificates),
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

// POST /api/certificates - Create new certificate
router.post("/certificates", authService.requireAdmin, async (req, res) => {
  const validation = insertCertificateSchema.parse(req.body);

  const validatedData = {
    ...validation,
    issueDate: validation.issueDate ? new Date(validation.issueDate) : undefined,
    expiryDate: validation.expiryDate ? new Date(validation.expiryDate) : undefined,
  };

  const result = await miscService.createCertificate(removeUndefined(validatedData));

  return result.match(
    async (certificate) => {
      // Invalidate certificates and sustainability caches
      await Promise.all([
        CacheOperations.invalidateCertificates(),
        CacheOperations.invalidateSustainability(),
      ])
        .then(() => logger.info("[Certificates] ✅ Cache invalidated after certificate creation"))
        .catch((err) => logger.error("[Certificates] ❌ Cache invalidation failed:", err));

      return res.status(201).json(certificate);
    },
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

// PUT /api/certificates/:id - Update certificate
router.put("/certificates/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "certificate");
  if (id === null) {
    return;
  }
  const validation = insertCertificateSchema.partial().parse(req.body);

  const validatedData = {
    ...validation,
    issueDate: validation.issueDate ? new Date(validation.issueDate) : undefined,
    expiryDate: validation.expiryDate ? new Date(validation.expiryDate) : undefined,
  };

  const result = await miscService.updateCertificate(id, removeUndefined(validatedData));

  return result.match(
    async (certificate) => {
      await Promise.all([
        CacheOperations.invalidateCertificates(),
        CacheOperations.invalidateSustainability(),
      ])
        .then(() => logger.info("[Certificates] ✅ Cache invalidated after certificate update"))
        .catch((err) => logger.error("[Certificates] ❌ Cache invalidation failed:", err));

      return res.json(certificate);
    },
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

// DELETE /api/certificates/:id - Delete certificate
router.delete("/certificates/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "certificate");
  if (id === null) {
    return;
  }

  const result = await miscService.deleteCertificate(id);

  return result.match(
    async () => {
      await Promise.all([
        CacheOperations.invalidateCertificates(),
        CacheOperations.invalidateSustainability(),
      ])
        .then(() => logger.info("[Certificates] ✅ Cache invalidated after certificate deletion"))
        .catch((err) => logger.error("[Certificates] ❌ Cache invalidation failed:", err));

      return res.status(204).send();
    },
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

// GET /api/sustainability-certificates - Get sustainability certificates
router.get("/sustainability-certificates", async (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");

  const result = await miscService.getCertificates();
  return result.match(
    (certificates) => {
      const sustainabilityCertificates = certificates.filter(
        (cert) => cert.showOnSustainabilityPage === true && cert.isActive !== false,
      );
      return res.json(sustainabilityCertificates);
    },
    (err) => res.status(err.statusCode || 500).json({ error: err.message }),
  );
});

export default router;
