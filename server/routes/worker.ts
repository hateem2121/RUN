import express from "express";
import { emailService, type InquiryEmailData } from "../lib/integrations/email-service.js";
import { logger } from "../lib/monitoring/logger.js";
import type { MediaOperation, MediaTaskPayload } from "../lib/queues/media-queue.js";
import { verifyCloudTaskToken } from "../lib/verify-cloud-task-token.js";

const router = express.Router();

// Allowed operations for validation
const VALID_MEDIA_OPERATIONS: MediaOperation[] = [
  "optimize",
  "thumbnail",
  "webp",
  "avif",
  "gltf-optimize",
  "metadata",
];

// Worker route to handle async email sending from Cloud Tasks
router.post("/workers/send-email", async (req, res) => {
  // Verify request is from Cloud Tasks via OIDC token
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const isAuthorized = await verifyCloudTaskToken(req);
    if (!isAuthorized) {
      logger.warn("[Worker] Unauthorized access attempt to email worker");
      return res.status(403).json({ error: "Unauthorized" });
    }
  }

  const payload = req.body as InquiryEmailData;

  if (!payload || !payload.email) {
    logger.error("[Worker] Invalid payload received for email task");
    return res.status(422).json({ error: "Invalid payload" });
  }

  logger.info(`[Worker] Processing email task for inquiry #${payload.id}`);

  // Send emails synchronously here (since we are already in a background worker)
  const [adminSent, customerSent] = await Promise.all([
    emailService.sendAdminNotification(payload),
    emailService.sendCustomerConfirmation(payload),
  ]);

  if (adminSent) {
    logger.info(`[Worker] Admin notification sent for inquiry #${payload.id}`);
  } else {
    logger.error(`[Worker] Failed to send admin notification for inquiry #${payload.id}`);
  }

  if (customerSent) {
    logger.info(`[Worker] Customer confirmation sent to ${payload.email}`);
  } else {
    logger.error(`[Worker] Failed to send customer confirmation to ${payload.email}`);
  }

  // Return success to Cloud Tasks to acknowledge completion
  return res.status(200).json({ success: true });
});

/**
 * Media Processing Worker
 * POST /api/worker/process-media
 *
 * Handles async media processing tasks queued by the media-queue module.
 */
router.post("/process-media", async (req, res) => {
  const startTime = performance.now();

  // Verify request is from Cloud Tasks via OIDC token
  const isProduction = process.env.NODE_ENV === "production";
  const taskName = req.header("X-CloudTasks-TaskName");

  if (isProduction) {
    const isAuthorized = await verifyCloudTaskToken(req);
    if (!isAuthorized) {
      logger.warn("[Worker:Media] Unauthorized access attempt");
      return res.status(403).json({ error: "Forbidden: Invalid request source" });
    }
  }

  const payload: MediaTaskPayload = req.body;

  // Validate payload
  if (!payload.mediaId || !payload.operation) {
    logger.warn("[Worker:Media] Invalid payload - missing required fields");
    return res.status(422).json({ error: "Missing mediaId or operation" });
  }

  if (!VALID_MEDIA_OPERATIONS.includes(payload.operation)) {
    logger.warn("[Worker:Media] Invalid operation", { operation: payload.operation });
    return res.status(422).json({ error: `Invalid operation: ${payload.operation}` });
  }

  logger.info("[Worker:Media] Processing task", {
    mediaId: payload.mediaId,
    operation: payload.operation,
    taskName,
    retryCount: payload.retryCount || 0,
  });

  // Process based on operation type

  switch (payload.operation) {
    case "optimize":
      // TODO: Implement with Sharp when ready
      logger.info("[Worker:Media] Optimizing image", { mediaId: payload.mediaId });
      break;
    case "thumbnail":
      logger.info("[Worker:Media] Generating thumbnail", { mediaId: payload.mediaId });
      break;
    case "webp":
    case "avif":
      logger.info("[Worker:Media] Converting format", {
        mediaId: payload.mediaId,
        format: payload.operation,
      });
      break;
    case "gltf-optimize":
      logger.info("[Worker:Media] Optimizing GLTF model", { mediaId: payload.mediaId });
      break;
    case "metadata":
      logger.info("[Worker:Media] Extracting metadata", { mediaId: payload.mediaId });
      break;
  }

  const duration = performance.now() - startTime;

  logger.info("[Worker:Media] Task completed", {
    mediaId: payload.mediaId,
    operation: payload.operation,
    durationMs: Math.round(duration),
  });

  return res.status(200).json({
    success: true,
    durationMs: Math.round(duration),
  });
});

/**
 * Worker Health Check
 * GET /api/worker/health
 */
router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    workers: ["email", "media-processor"],
    timestamp: new Date().toISOString(),
  });
});

export default router;
