import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import {
  type InsertAboutTimelineEntry,
  type InsertCertificate,
  type InsertFiber,
  insertCertificateSchema,
  insertFiberSchema,
} from "../../../shared/index.js";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { getAuditContext } from "../../middleware/request-context.js";
import { adminService } from "../../services/admin/index.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

// =============================================================================
// CATEGORY MANAGEMENT
// =============================================================================

/**
 * POST /api/admin/content/categories/:id/restore
 * Restore soft-deleted category
 */
router.post("/categories/:id/restore", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "category");
  if (id === null) return;

  const auditContext = getAuditContext(req);
  const result = await adminService.restoreCategory(auditContext, id);

  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// =============================================================================
// CERTIFICATE MANAGEMENT
// =============================================================================

/**
 * GET /api/admin/content/certificates
 * List all certificates
 */
router.get("/certificates", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getCertificatesList();

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * POST /api/admin/content/certificates
 * Create new certificate
 */
router.post(
  "/certificates",
  authService.requireAdmin,
  validateRequest({ body: insertCertificateSchema }),
  async (req, res) => {
    const auditContext = getAuditContext(req);
    const result = await adminService.createCertificate(auditContext, req.body);

    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * PATCH /api/admin/content/certificates/:id
 * Update certificate
 */
router.patch(
  "/certificates/:id",
  authService.requireAdmin,
  validateRequest({ body: insertCertificateSchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "certificate");
    if (id === null) return;
    const auditContext = getAuditContext(req);
    const result = await adminService.updateCertificate(
      auditContext,
      id,
      req.body as Partial<InsertCertificate>,
    );

    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * DELETE /api/admin/content/certificates/:id
 * Delete certificate
 */
router.delete("/certificates/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "certificate");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.deleteCertificate(auditContext, id);

  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// =============================================================================
// FIBER MANAGEMENT
// =============================================================================

/**
 * GET /api/admin/content/fibers
 * List all fibers
 */
router.get("/fibers", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getFibersList();

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * POST /api/admin/content/fibers
 * Create new fiber
 */
router.post(
  "/fibers",
  authService.requireAdmin,
  validateRequest({ body: insertFiberSchema }),
  async (req, res) => {
    const auditContext = getAuditContext(req);
    const result = await adminService.createFiber(auditContext, req.body);

    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * PATCH /api/admin/content/fibers/:id
 * Update fiber
 */
router.patch(
  "/fibers/:id",
  authService.requireAdmin,
  validateRequest({ body: insertFiberSchema.partial() }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "fiber");
    if (id === null) return;
    const auditContext = getAuditContext(req);
    const result = await adminService.updateFiber(
      auditContext,
      id,
      req.body as Partial<InsertFiber>,
    );

    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * DELETE /api/admin/content/fibers/:id
 * Delete fiber
 */
router.delete("/fibers/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "fiber");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.deleteFiber(auditContext, id);

  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

// =============================================================================
// ABOUT TIMELINE MANAGEMENT
// =============================================================================

/**
 * GET /api/admin/content/about/timeline
 * List all timeline entries
 */
router.get("/about/timeline", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getAboutTimelineEntries();

  return result.match(
    (data) => res.json(data),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

/**
 * POST /api/admin/content/about/timeline
 * Create new timeline entry
 */
router.post(
  "/about/timeline",
  authService.requireAdmin,
  validateRequest({
    body: z.object({
      year: z.string(),
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
    }),
  }),
  async (req, res) => {
    const auditContext = getAuditContext(req);
    const result = await adminService.createAboutTimelineEntry(auditContext, req.body);

    return result.match(
      (data) => res.status(201).json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * PATCH /api/admin/content/about/timeline/:id
 * Update timeline entry
 */
router.patch(
  "/about/timeline/:id",
  authService.requireAdmin,
  validateRequest({
    body: z
      .object({
        year: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
      .partial(),
  }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "timeline entry");
    if (id === null) return;
    const auditContext = getAuditContext(req);
    const result = await adminService.updateAboutTimelineEntry(
      auditContext,
      id,
      req.body as Partial<InsertAboutTimelineEntry>,
    );

    return result.match(
      (data) => res.json(data),
      (error) => res.status(error.statusCode || 500).json({ error: error.message }),
    );
  },
);

/**
 * DELETE /api/admin/content/about/timeline/:id
 * Delete timeline entry
 */
router.delete("/about/timeline/:id", authService.requireAdmin, async (req, res) => {
  const id = validateIdParam(req, res, "id", "timeline entry");
  if (id === null) return;
  const auditContext = getAuditContext(req);
  const result = await adminService.deleteAboutTimelineEntry(auditContext, id);

  return result.match(
    () => res.json({ success: true }),
    (error) => res.status(error.statusCode || 500).json({ error: error.message }),
  );
});

export default router;
