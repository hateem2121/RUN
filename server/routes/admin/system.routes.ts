import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import { validateIdParam } from "../../lib/utilities/core-utils.js";
import { criticalTier } from "../../middleware/rate-limit-tiers.js";
import { getAuditContext } from "../../middleware/request-context.js";
import { adminService } from "../../services/admin/index.js";
import { authService } from "../../services/auth-service.js";

const router = Router();

// Zod validation schemas
const auditConfigSchema = z.object({
  enabled: z.boolean().optional(),
  trackedTables: z.array(z.string()).optional(),
});

const emptyBodySchema = z
  .object({
    timeout: z.number().optional(),
  })
  .strict();

const retryJobSchema = z.object({
  queue: z.enum(["email", "cache"]),
  id: z.string(),
});

/**
 * GET /api/admin/system/test
 * Connectivity and routing test
 */
router.get("/test", authService.requireAdmin, (_req, res) => {
  return res.json({ message: "API routing works", timestamp: new Date() });
});

/**
 * GET /api/admin/system/dashboard-stats
 * High-level system metrics
 */
router.get("/dashboard-stats", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getDashboardStats();

  if (result.isErr()) {
    throw result.error;
  }

  return res.json(result.value);
});

/**
 * GET /api/admin/system/media-assets
 * List all media assets
 */
router.get("/media-assets", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getMediaAssetsList();

  if (result.isErr()) {
    throw result.error;
  }

  return res.json(result.value);
});

/**
 * POST /api/admin/system/media-assets/:id/restore
 * Restore deleted media asset
 */
router.post(
  "/media-assets/:id/restore",
  authService.requireAdmin,
  validateRequest({ body: emptyBodySchema }),
  async (req, res) => {
    const id = validateIdParam(req, res, "id", "media asset");
    if (id === null) return;

    const auditContext = getAuditContext(req);
    const result = await adminService.restoreMediaAsset(auditContext, id);

    if (result.isErr()) {
      throw result.error;
    }

    return res.json({ success: result.value });
  },
);

/**
 * POST /api/admin/system/fix-corrupted-media
 * Trigger media URL cleanup
 */
router.post(
  "/fix-corrupted-media",
  authService.requireAdmin,
  criticalTier,
  validateRequest({ body: emptyBodySchema }),
  async (req, res) => {
    const { timeout } = req.body;
    const auditContext = getAuditContext(req);
    const result = await adminService.fixCorruptedMedia(auditContext, timeout);

    if (result.isErr()) {
      throw result.error;
    }

    return res.json({
      success: true,
      ...result.value,
      timestamp: Date.now(),
    });
  },
);

/**
 * POST /api/admin/system/cleanup/trigger
 * Trigger storage cleanup
 */
router.post("/cleanup/trigger", authService.requireAdmin, criticalTier, async (req, res) => {
  const { autoClean, timeout } = req.body;
  const auditContext = getAuditContext(req);
  const result = await adminService.triggerCleanup(auditContext, autoClean === true, timeout);

  if (result.isErr()) {
    throw result.error;
  }

  res.json({ success: true, report: result.value });
});

/**
 * GET /api/admin/system/audit-config
 * Retrieve audit settings
 */
router.get("/audit-config", authService.requireAdmin, async (_req, res) => {
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

/**
 * POST /api/admin/system/audit-config
 * Update audit settings
 */
router.post(
  "/audit-config",
  authService.requireAdmin,
  validateRequest({ body: auditConfigSchema }),
  async (req, res) => {
    const auditContext = getAuditContext(req);
    const result = await adminService.updateAuditConfig(auditContext, req.body);

    if (result.isErr()) {
      throw result.error;
    }

    return res.json({ success: true, message: "Audit configuration updated" });
  },
);

/**
 * GET /api/admin/system/jobs/failed
 * List all failed BullMQ jobs
 */
router.get("/jobs/failed", authService.requireAdmin, async (_req, res) => {
  const result = await adminService.getFailedJobs();

  if (result.isErr()) {
    throw result.error;
  }

  return res.json(result.value);
});

/**
 * POST /api/admin/system/jobs/retry
 * Manually retry a failed BullMQ job
 */
router.post(
  "/jobs/retry",
  authService.requireAdmin,
  validateRequest({ body: retryJobSchema }),
  async (req, res) => {
    const { queue, id } = req.body;
    const result = await adminService.retryJob(queue, id);

    if (result.isErr()) {
      throw result.error;
    }

    return res.json({ success: true });
  },
);

export default router;
