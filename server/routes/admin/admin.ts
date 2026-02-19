/**
 * ADMIN ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all administrative operations, cleanup, and system management
 */

import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { mediaRepository } from "../../lib/db/repositories/index.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { adminService } from "../../services/admin/index.js";
import { authService } from "../../services/auth-service.js";
import type { SessionUser } from "../../types/session.js";
import { getAuditContext } from "../../utils/request-context.js";
import { validateIdParam } from "../../utils.js";

const router = Router();

// GET /api/media-assets - List all media assets (admin only)
router.get("/media-assets", authService.requireAdmin, async (_req, res) => {
  const mediaAssets = await withTimeout(
    mediaRepository.getMediaAssets(),
    5000,
    "Fetch all media assets",
  );
  return res.json(mediaAssets || []);
});

// Zod validation schemas for admin routes
const auditConfigSchema = z.object({
  enabled: z.boolean().optional(),
  trackedTables: z.array(z.string()).optional(),
});

const emptyBodySchema = z
  .object({
    timeout: z.number().optional(), // Allow optional timeout override
  })
  .strict();

// GET /products/initial-data - Admin products batch data
router.get("/products/initial-data", authService.requireAdmin, async (_req, res) => {
  const data = await adminService.getInitialProductsData();
  return res.json(data);
});

// GET /test - API routing test endpoint
router.get("/test", authService.requireAdmin, (_req, res) => {
  return res.json({ message: "API routing works", timestamp: new Date() });
});

// POST /fix-corrupted-media - Fix corrupted media URLs
// prettier-ignore
// POST /fix-corrupted-media - Fix corrupted media URLs
// prettier-ignore
router.post(
  "/fix-corrupted-media",
  authService.requireAdmin,
  validateRequest({
    body: emptyBodySchema,
  }),
  async (req, res) => {
    const { timeout } = req.body;

    // Create audit context
    const auditContext = getAuditContext(req);

    const result = await adminService.fixCorruptedMedia(auditContext, timeout);

    return res.json({
      success: true,
      message: `Corrupted media cleanup completed: ${result.fixedCount} categories fixed`,
      ...result,
      timestamp: Date.now(),
    });
  },
);

// POST /api/admin/cleanup/trigger - Trigger storage cleanup
router.post("/cleanup/trigger", authService.requireAdmin, async (req, res) => {
  const { autoClean, timeout } = req.body;

  // Create audit context
  const auditContext = getAuditContext(req);

  const report = await adminService.triggerCleanup(auditContext, autoClean === true, timeout);

  res.json({ success: true, report });
});

// GET /enterprise/audit-config - Audit configuration retrieval
router.get("/enterprise/audit-config", authService.requireAdmin, async (_req, res) => {
  return res.json({
    enabled: true,
    trackedTables: [
      "categories",
      "products",
      "mediaAssets",
      "fabrics",
      "fibers",
      "certificates",
      "sizeCharts",
      "accessories",
      "navigationItems",
      "footerLinks",
    ],
    retentionPeriods: { standard: 2555, high: 3650, critical: 7300 },
  });
});

// POST /enterprise/audit-config - Audit configuration update
// prettier-ignore
router.post(
  "/enterprise/audit-config",
  authService.requireAdmin,
  validateRequest({
    body: auditConfigSchema,
  }),
  async (req, res) => {
    const validatedData = req.body;

    // Create audit context
    const auditContext = getAuditContext(req);

    await adminService.updateAuditConfig(auditContext, validatedData);

    return res.json({ success: true, message: "Audit configuration updated" });
  },
);

// Restore endpoints
// prettier-ignore
router.post(
  "/categories/:id/restore",
  authService.requireAdmin,
  validateRequest({
    body: emptyBodySchema,
  }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) {
      return; // Error response already sent
    }

    // Create audit context
    const auditContext = getAuditContext(req);

    const result = await adminService.restoreCategory(auditContext, id);

    return res.json({ success: result });
  },
);

// prettier-ignore
// prettier-ignore
router.post(
  "/products/:id/restore",
  authService.requireAdmin,
  validateRequest({
    body: emptyBodySchema,
  }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "product");
    if (id === null) {
      return; // Error response already sent
    }

    // Create audit context
    const auditContext = getAuditContext(req);

    const result = await adminService.restoreProduct(auditContext, id);

    return res.json({ success: result });
  },
);

// prettier-ignore
router.post(
  "/media-assets/:id/restore",
  authService.requireAdmin,
  validateRequest({
    body: emptyBodySchema,
  }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "media asset");
    if (id === null) {
      return; // Error response already sent
    }

    // Create audit context
    const auditContext = getAuditContext(req);

    const result = await adminService.restoreMediaAsset(auditContext, id);

    return res.json({ success: result });
  },
);

export default router;
