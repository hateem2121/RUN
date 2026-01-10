import { Router } from "express";
import { z } from "zod";

const router = Router();

// --- Schemas ---

const inquirySchema = z.object({
  contact: z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    company: z.string().min(2, "Company name is required"),
    phone: z.string().optional(),
    projectDescription: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        notes: z.string().optional(),
      }),
    )
    .min(1, "At least one item must be added to the quote"),
});

// --- Endpoints ---

// Product routes moved to core/products.ts
// router.get("/products", ...);
// router.get("/products/:id", ...);

// POST /api/inquiries
// prettier-ignore
import { sql } from "drizzle-orm";
import { db, safeQuery } from "../db.js";
import { DatabaseError } from "../lib/errors.js";

// ... (schema remains)

// POST /api/inquiries
router.post("/inquiries", async (req, res, next) => {
  // 1. Validation
  const result = inquirySchema.safeParse(req.body);
  if (!result.success) {
    // We let the global handler parse ZodError if we threw it, 
    // but here we demonstrate manual handling if desired, 
    // OR just throw a new ValidationError wrapping it.
    // For now, let's stick to standard Zod behavior or 400.
    return res.status(400).json({
      success: false, 
      error: "Validation Failed", 
      issues: result.error.issues 
    });
  }
  const validatedData = result.data;

  // 2. Safety Check: Ensure DB is alive using Result pattern
  const dbHealth = await safeQuery(db.execute(sql`SELECT 1`));

  if (dbHealth.isErr()) {
    // Functional Error Handling:
    // We explicitly handle the error here. 
    // We could return a 503 directly, or pass to global handler.
    return next(dbHealth.error);
  }

  // 3. Logic: Log to DB (Still Mocked for now, but guarded by health check)
  // biome-ignore lint/suspicious/noConsole: Log payload
  console.log("[Inquiry Received]", {
    timestamp: new Date().toISOString(),
    ...validatedData,
  });

  // Mock Email Send
  // biome-ignore lint/suspicious/noConsole: Mock email
  console.log(`[Email Mock] Sending quote confirmation to ${validatedData.contact.email}`);

  res.status(201).json({
    success: true,
    message: "Quote request received successfully",
    inquiryId: `INQ-${Date.now()}`,
  });
});

export const inquiryRoutes = router;
