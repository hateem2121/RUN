import { removeUndefined } from "../../utils.js";

/**
 * CERTIFICATES ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all certificate CRUD operations and relationships
 */

import { Router } from "express";
import { z } from "zod";
import { insertCertificateSchema } from "../../../shared/schema.js";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { authService } from "../../services/auth-service.js";
import { validateIdParam } from "../../utils.js";

const router = Router();

// GET /api/certificates - List all certificates
router.get("/certificates", async (_req, res) => {
  try {
    const certificates = await withTimeout(
      getStorage().getCertificates(),
      10000,
      "Get all certificates",
    );
    res.json(certificates);
  } catch (error: unknown) {
    logger.error("Route: Error fetching certificates:", error);
    res.status(500).json({
      message: "Failed to fetch certificates",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/certificates - Create new certificate
router.post("/certificates", authService.requireAdmin, async (req, res) => {
  try {
    const validation = insertCertificateSchema.parse(req.body);

    // Transform string dates to Date objects if present
    const validatedData = {
      ...validation,
      issueDate: validation.issueDate ? new Date(validation.issueDate) : undefined,
      expiryDate: validation.expiryDate ? new Date(validation.expiryDate) : undefined,
    };

    const certificate = await withTimeout(
      getStorage().createCertificate(removeUndefined(validatedData)),
      10000,
      "Create certificate",
    );

    // Invalidate certificates and sustainability caches (certificates may appear on sustainability page)
    try {
      await CacheOperations.invalidateCertificates();
      await CacheOperations.invalidateSustainability();
      logger.info("[Certificates] ✅ Cache invalidated after certificate creation");
    } catch (err) {
      logger.error("[Certificates] ❌ Cache invalidation failed:", err);
    }

    res.status(201).json(certificate);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    } else {
      logger.error("Route: Error creating certificate:", error);
      res.status(500).json({
        message: "Failed to create certificate",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});

// PUT /api/certificates/:id - Update certificate
router.put("/certificates/:id", authService.requireAdmin, async (req, res) => {
  try {
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
      getStorage().updateCertificate(id, removeUndefined(validatedData)),
      10000,
      "Update certificate",
    );

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Invalidate certificates and sustainability caches after certificate update
    try {
      await CacheOperations.invalidateCertificates();
      await CacheOperations.invalidateSustainability();
      logger.info("[Certificates] ✅ Cache invalidated after certificate update");
    } catch (err) {
      logger.error("[Certificates] ❌ Cache invalidation failed:", err);
    }

    return res.json(certificate);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.issues,
      });
    } else {
      logger.error("Route: Error updating certificate:", error);
      return res.status(500).json({
        message: "Failed to update certificate",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});

// DELETE /api/certificates/:id - Delete certificate
router.delete("/certificates/:id", authService.requireAdmin, async (req, res) => {
  try {
    const id = validateIdParam(req, res, "id", "certificate");
    if (id === null) {
      return;
    }
    const success = await withTimeout(
      getStorage().deleteCertificate(id),
      10000,
      "Delete certificate",
    );

    if (!success) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Invalidate certificates and sustainability caches after certificate deletion
    try {
      await CacheOperations.invalidateCertificates();
      await CacheOperations.invalidateSustainability();
      logger.info("[Certificates] ✅ Cache invalidated after certificate deletion");
    } catch (err) {
      logger.error("[Certificates] ❌ Cache invalidation failed:", err);
    }

    return res.status(204).send();
  } catch (error: unknown) {
    logger.error("Route: Error deleting certificate:", error);
    return res.status(500).json({
      message: "Failed to delete certificate",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/sustainability-certificates - Get sustainability certificates
router.get("/sustainability-certificates", async (_req, res) => {
  try {
    const certificates = await withTimeout(
      getStorage().getCertificates(),
      10000,
      "Get sustainability certificates",
    );
    const sustainabilityCertificates = certificates.filter(
      (cert) => cert.showOnSustainabilityPage === true && cert.isActive !== false,
    );
    res.json(sustainabilityCertificates);
  } catch (error: unknown) {
    logger.error("Route: Error fetching sustainability certificates:", error);
    res.status(500).json({
      message: "Failed to fetch sustainability certificates",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
