import { Router } from "express";
import { z } from "zod";
import { logger } from "../../lib/monitoring/logger.js";
import { inquiryService } from "../../services/inquiry-service.js";

const router = Router();

// Validation schema for public inquiry submissions
const createInquirySchema = z.object({
  contact: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    company: z.string().optional(),
    phone: z.string().optional(),
    country: z.string().optional(),
    message: z.string().min(1, "Message is required"),
  }),
  items: z
    .array(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  source: z.string().default("contact_page"),
});

/**
 * POST /api/inquiries
 * Public endpoint for submitting contact inquiries and quote requests.
 */
router.post("/inquiries", async (req, res) => {
  try {
    const validatedData = createInquirySchema.parse(req.body);

    // Map the simplified frontend payload to the DB schema
    // In our DB schema, inquiries table has name, email, company, etc. as top-level columns
    const insertData = {
      name: validatedData.contact.name,
      email: validatedData.contact.email,
      company: validatedData.contact.company,
      phone: validatedData.contact.phone,
      country: validatedData.contact.country,
      message: validatedData.contact.message,
      source: validatedData.source,
      // items are stored as JSONB in the inquiries table
      items: validatedData.items?.map((item) => ({
        ...item,
        notes: item.notes || null,
      })),
      submittedAt: new Date(),
    };

    const inquiry = await inquiryService.createInquiry(insertData);

    logger.info(
      `[PublicInquiry] Successfully created inquiry #${inquiry.id} from ${inquiry.source}`,
    );

    return res.status(201).json({
      success: true,
      id: inquiry.id,
      message: "Inquiry received successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.issues,
      });
    }

    logger.error("[PublicInquiry] Failed to process inquiry:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to submit inquiry. Please try again later.",
    });
  }
});

export default router;
