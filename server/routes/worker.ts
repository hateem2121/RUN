import express from "express";
import { emailService, type InquiryEmailData } from "../lib/email-service.js";
import { logger } from "../lib/smart-logger.js";
import { asyncHandler } from "../middleware/async-handler.js";

const router = express.Router();

// Worker route to handle async email sending from Cloud Tasks
router.post(
	"/workers/send-email",
	asyncHandler(async (req, res) => {
		// Verify request is from Cloud Tasks
		// In production, Cloud Tasks adds "X-CloudTasks-QueueName" header
		// We can also verify OIDC token if configured, but header check is a good baseline
		const queueName = req.header("X-CloudTasks-QueueName");
		const isProduction = process.env.NODE_ENV === "production";

		if (isProduction && !queueName) {
			logger.warn("[Worker] Unauthorized access attempt to email worker");
			return res.status(403).json({ error: "Unauthorized" });
		}

		const payload = req.body as InquiryEmailData;

		if (!payload || !payload.email) {
			logger.error("[Worker] Invalid payload received for email task");
			return res.status(400).json({ error: "Invalid payload" });
		}

		logger.info(`[Worker] Processing email task for inquiry #${payload.id}`);

		try {
			// Send emails synchronously here (since we are already in a background worker)
			const [adminSent, customerSent] = await Promise.all([
				emailService.sendAdminNotification(payload),
				emailService.sendCustomerConfirmation(payload),
			]);

			if (adminSent) {
				logger.info(
					`[Worker] Admin notification sent for inquiry #${payload.id}`,
				);
			} else {
				logger.error(
					`[Worker] Failed to send admin notification for inquiry #${payload.id}`,
				);
			}

			if (customerSent) {
				logger.info(`[Worker] Customer confirmation sent to ${payload.email}`);
			} else {
				logger.error(
					`[Worker] Failed to send customer confirmation to ${payload.email}`,
				);
			}

			// Return success to Cloud Tasks to acknowledge completion
			return res.status(200).json({ success: true });
		} catch (error) {
			logger.error("[Worker] Error processing email task:", error);
			// Return 500 to Cloud Tasks to trigger retry
			return res.status(500).json({ error: "Internal Server Error" });
		}
	}),
);

export default router;
