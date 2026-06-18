import { createInquirySchema } from "@run-remix/shared";
import { Router } from "express";
import { validateRequest } from "zod-express-middleware";
import { logger } from "../../lib/monitoring/logger.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";
import { inquiryService } from "../../services/inquiry-service.js";

const router = Router();

/**
 * POST /api/inquiries
 * Public endpoint for submitting contact inquiries and quote requests.
 */
router.post(
  "/inquiries",
  writeRateLimiter,
  validateRequest({ body: createInquirySchema }),
  async (req, res) => {
    const result = await inquiryService.createFromPublicPayload(req.body);

    return result.match(
      (inquiry) => {
        logger.info(
          `[PublicInquiry] Successfully created inquiry #${inquiry.id} from ${inquiry.source}`,
        );

        return res.status(201).json({
          success: true,
          id: inquiry.id,
          message: "Inquiry received successfully",
        });
      },
      (error) => {
        throw error;
      },
    );
  },
);

export default router;
