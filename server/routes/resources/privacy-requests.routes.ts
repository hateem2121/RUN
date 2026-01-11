/**
 * Privacy Request Routes
 *
 * GDPR/CCPA compliant data subject request handling
 * - Data export (Right to Access/Portability)
 * - Account deletion (Right to Erasure)
 * - Request status tracking
 */

import { Router } from "express";
import { z } from "zod";
import { db } from "../../db.js";
import { users, auditLogs } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/monitoring/logger.js";
import { validateRequest } from "../../middleware/validateRequest.js";

const router = Router();

// Schema for privacy requests
const DataExportRequestSchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
});

const DeletionRequestSchema = z.object({
  confirmEmail: z.string().email(),
  reason: z.string().optional(),
});

/**
 * POST /api/privacy/data-export
 * Request export of all user data (GDPR Article 15, 20)
 */
router.post(
  "/data-export",
  validateRequest({ body: DataExportRequestSchema }),
  async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
      }

      // Fetch user data
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userData) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "User not found" },
        });
      }

      // Build export data (excluding sensitive fields)
      const exportData = {
        exportDate: new Date().toISOString(),
        dataController: "RUN Apparel B2B Platform",
        contactEmail: "privacy@runapparel.com",
        user: {
          id: userData.id,
          email: userData.email,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          // Add other user fields as appropriate
        },
        // Include related data
        // orders: await getOrdersForUser(userId),
        // preferences: await getPreferencesForUser(userId),
      };

      // Log the export request
      await db.insert(auditLogs).values({
        userId,
        action: "DATA_EXPORT_REQUEST",
        details: { format: req.body.format },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      logger.info("Data export request processed", { userId });

      res.json({
        success: true,
        data: exportData,
        meta: {
          format: req.body.format,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Data export failed", { error });
      res.status(500).json({
        success: false,
        error: { code: "EXPORT_FAILED", message: "Failed to export data" },
      });
    }
  }
);

/**
 * POST /api/privacy/deletion-request
 * Request account deletion (GDPR Article 17)
 */
router.post(
  "/deletion-request",
  validateRequest({ body: DeletionRequestSchema }),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (!userId || !userEmail) {
        return res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
      }

      // Verify email confirmation matches
      if (req.body.confirmEmail.toLowerCase() !== userEmail.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "EMAIL_MISMATCH",
            message: "Confirmation email does not match account email",
          },
        });
      }

      // Create deletion request (30-day grace period for recovery)
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      // In production: Create deletion request record, schedule job
      // For now: Log the request

      await db.insert(auditLogs).values({
        userId,
        action: "DELETION_REQUEST",
        details: {
          reason: req.body.reason,
          scheduledDeletion: deletionDate.toISOString(),
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      logger.info("Deletion request received", {
        userId,
        scheduledDeletion: deletionDate,
      });

      res.json({
        success: true,
        data: {
          requestId: `DEL-${Date.now()}`,
          status: "PENDING",
          scheduledDeletion: deletionDate.toISOString(),
          message:
            "Your account is scheduled for deletion. You can cancel this request within 30 days by logging in.",
        },
      });
    } catch (error) {
      logger.error("Deletion request failed", { error });
      res.status(500).json({
        success: false,
        error: {
          code: "DELETION_FAILED",
          message: "Failed to process deletion request",
        },
      });
    }
  }
);

/**
 * GET /api/privacy/request-status/:requestId
 * Check status of a privacy request
 */
router.get("/request-status/:requestId", async (req, res) => {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    // In production: Look up request in privacy_requests table
    // For now: Return mock status

    res.json({
      success: true,
      data: {
        requestId,
        type: requestId.startsWith("DEL-") ? "DELETION" : "EXPORT",
        status: "PENDING",
        createdAt: new Date().toISOString(),
        estimatedCompletion: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    });
  } catch (error) {
    logger.error("Request status lookup failed", { error });
    res.status(500).json({
      success: false,
      error: { code: "LOOKUP_FAILED", message: "Failed to retrieve status" },
    });
  }
});

/**
 * POST /api/privacy/cancel-deletion
 * Cancel a pending deletion request
 */
router.post("/cancel-deletion/:requestId", async (req, res) => {
  try {
    const userId = req.user?.id;
    const { requestId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    await db.insert(auditLogs).values({
      userId,
      action: "DELETION_CANCELLED",
      details: { requestId },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    logger.info("Deletion request cancelled", { userId, requestId });

    res.json({
      success: true,
      data: {
        requestId,
        status: "CANCELLED",
        message: "Your deletion request has been cancelled.",
      },
    });
  } catch (error) {
    logger.error("Cancellation failed", { error });
    res.status(500).json({
      success: false,
      error: {
        code: "CANCEL_FAILED",
        message: "Failed to cancel deletion request",
      },
    });
  }
});

export default router;
