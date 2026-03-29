/**
 * INQUIRY ROUTES
 * Handles public inquiry form submissions from the footer
 */

import express from "express";
import { z } from "zod";
import { logger } from "../lib/monitoring/logger.js";

const router = express.Router();

// Schema for inquiry submissions
const inquirySchema = z.object({
  contact: z.object({
    name: z.string().optional(),
    company: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    projectDescription: z.string().optional(),
    message: z.string().optional(),
  }),
  items: z.array(z.any()).optional(),
  source: z.string().optional(),
});

router.post("/inquiries", async (req, res) => {
  const payload = inquirySchema.parse(req.body);
  const { inquiryService } = await import("../services/inquiry-service.js");

  // Transform payload to match InsertInquiry schema
  // FIX: Map country and preferredPlatform correctly from payload
  const inquiryData = {
    name: payload.contact.name || payload.contact.company || "Inquiry",
    email: payload.contact.email,
    company: payload.contact.company || null,
    message: payload.contact.projectDescription || payload.contact.message || "",
    source: payload.source || "form_submission",
    status: "new",
    phone: payload.contact.phone || null,
    country: ((payload.contact as Record<string, unknown>).country as string | null) || null,
    preferredPlatform:
      ((payload.contact as Record<string, unknown>).preferredPlatform as string | null) || null,
  };

  const inquiry = await inquiryService.createInquiry(inquiryData);

  logger.info(
    `[Inquiries] Created new inquiry #${inquiry.id} from ${inquiry.email} (Source: ${inquiryData.source})`,
  );

  res.json({ success: true, inquiryId: inquiry.id });
});

export const inquiryRoutes = router;
