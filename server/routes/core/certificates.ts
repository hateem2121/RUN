import { removeUndefined } from "../../lib/utilities/core-utils.js";

/**
 * CERTIFICATES ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all certificate CRUD operations and relationships
 */

import { insertCertificateSchema } from "@run-remix/shared";
import { Router } from "express";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { authService } from "../../services/auth-service.js";
import { miscRepository } from "../../services/repositories/index.js";

const router = Router();

// GET /api/certificates - List all certificates
router.get("/certificates", async (_req, res) => {
  const certificates = await withTimeout(
    miscRepository.getCertificates(),
    10000,
    "Get all certificates",
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.json(certificates);
});

// POST /api/certificates - Create new certificate
router.post("/certificates", authService.requireAdmin, async (req, res) => {
  const validation = insertCertificateSchema.parse(req.body);

  // Transform string dates to Date objects if present
  const validatedData = {
    ...validation,
    issueDate: validation.issueDate ? new Date(validation.issueDate) : undefined,
    expiryDate: validation.expiryDate ? new Date(validation.expiryDate) : undefined,
  };

  const certificate = await withTimeout(
    miscRepository.createCertificate(removeUndefined(validatedData)),
    10000,
    "Create certificate",
  );

  // Invalidate certificates and sustainability caches (certificates may appear on sustainability page)
  await Promise.all([
    CacheOperations.invalidateCertificates(),
    CacheOperations.invalidateSustainability(),
  ])
    .then(() => logger.info("[Certificates] ✅ Cache invalidated after certificate creation"))
    .catch((err) => logger.error("[Certificates] ❌ Cache invalidation failed:", err));

  res.status(201).json(certificate);
});

// PUT /api/certificates/:id - Update certificate
router.put("/certificates/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "certificate");
  if (id === null) {
    return;
  }
  const validation = insertCertificateSchema.partial().parse(req.body);

  // Transform string dates to Date objects if present
  const validatedData = {
    ...validation,
    issueDate: validation.issueDate ? new Date(validation.issueDate) : undefined,
    expiryDate: validation.expiryDate ? new Date(validation.expiryDate) : undefined,
  };

  const certificate = await withTimeout(
    miscRepository.updateCertificate(id, removeUndefined(validatedData)),
    10000,
    "Update certificate",
  );

  if (!certificate) {
    return res.status(404).json({ message: "Certificate not found" });
  }

  // Invalidate certificates and sustainability caches after certificate update
  await Promise.all([
    CacheOperations.invalidateCertificates(),
    CacheOperations.invalidateSustainability(),
  ])
    .then(() => logger.info("[Certificates] ✅ Cache invalidated after certificate update"))
    .catch((err) => logger.error("[Certificates] ❌ Cache invalidation failed:", err));

  return res.json(certificate);
});

// DELETE /api/certificates/:id - Delete certificate
router.delete("/certificates/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "certificate");
  if (id === null) {
    return;
  }
  const success = await withTimeout(
    miscRepository.deleteCertificate(id),
    10000,
    "Delete certificate",
  );

  if (!success) {
    return res.status(404).json({ message: "Certificate not found" });
  }

  // Invalidate certificates and sustainability caches after certificate deletion
  await Promise.all([
    CacheOperations.invalidateCertificates(),
    CacheOperations.invalidateSustainability(),
  ])
    .then(() => logger.info("[Certificates] ✅ Cache invalidated after certificate deletion"))
    .catch((err) => logger.error("[Certificates] ❌ Cache invalidation failed:", err));

  return res.status(204).send();
});

// GET /api/sustainability-certificates - Get sustainability certificates
router.get("/sustainability-certificates", async (_req, res) => {
  const certificates = await withTimeout(
    miscRepository.getCertificates(),
    10000,
    "Get sustainability certificates",
  );
  const sustainabilityCertificates = certificates.filter(
    (cert) => cert.showOnSustainabilityPage === true && cert.isActive !== false,
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.json(sustainabilityCertificates);
});

export default router;
