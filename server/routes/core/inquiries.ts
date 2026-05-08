import { createInquirySchema } from "@run-remix/shared";
import { Router } from "express";
import { logger } from "../../lib/monitoring/logger.js";
import { writeRateLimiter } from "../../middleware/rateLimiter.js";
import { inquiryService } from "../../services/inquiry-service.js";

const router = Router();

/**
 * POST /api/inquiries
 * Public endpoint for submitting contact inquiries and quote requests.
 */
router.post("/inquiries", writeRateLimiter, async (req, res) => {
  const validatedData = createInquirySchema.parse(req.body);

  // Map the simplified frontend payload to the DB schema
  const insertData = {
    name: validatedData.contact.name,
    email: validatedData.contact.email,
    company: validatedData.contact.company,
    phone: validatedData.contact.phone,
    country: validatedData.contact.country,
    message: validatedData.contact.message,
    source: validatedData.source,
    items:
      validatedData.items?.map((item) => ({
        ...item,
        notes: item.notes || null,
      })) || [],
    submittedAt: new Date(),
  };

  const result = await inquiryService.createInquiry(insertData);

  if (result.isErr()) {
    throw result.error;
  }

  const inquiry = result.value;

  logger.info(`[PublicInquiry] Successfully created inquiry #${inquiry.id} from ${inquiry.source}`);

  return res.status(201).json({
    success: true,
    id: inquiry.id,
    message: "Inquiry received successfully",
  });
});

export default router;
