"use server";

import { z } from "zod";

// --- Schemas ---

export const ContactSubmissionSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required"),
  company: z.string().nullish(),
  phone: z.string().nullish(),
  country: z.string().nullish(),
  preferredPlatform: z.string().nullish(),
  honeypot: z.string().optional(),
  recaptchaToken: z.string().optional(),
});

export const QuoteSubmissionSchema = z.object({
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

export type ContactSubmissionData = z.infer<typeof ContactSubmissionSchema>;
export type QuoteSubmissionData = z.infer<typeof QuoteSubmissionSchema>;

// --- Actions ---

/**
 * Handles B2B Contact Form submissions.
 * Inserts directly into the database.
 */
export async function submitContactInquiry(data: ContactSubmissionData) {
  // 1. Validation
  const validated = ContactSubmissionSchema.parse(data);

  // 2. Honeypot check
  if (validated.honeypot && validated.honeypot.trim().length > 0) {
    console.warn(`[Inquiry] Honeypot triggered: ${validated.email}`);
    throw new Error("Invalid submission");
  }

  // 3. reCAPTCHA v3 Validation (PHASE 4 REMEDIATION)
  const { verifyRecaptcha } = await import("../../../server/lib/security/recaptcha-verify.js");
  const recaptchaResult = await verifyRecaptcha(validated.recaptchaToken, "server-action");

  if (!recaptchaResult.success) {
    console.warn(`[Inquiry] reCAPTCHA failed: ${recaptchaResult.error}`);
    throw new Error(recaptchaResult.error || "Security check failed");
  }

  try {
    // 3. Insert into Database via Unified Service Layer
    // NOTE: This ensures consistent AES-256-GCM encryption and blind indexing
    const { inquiryService } = await import("../../../server/services/inquiry-service.js");
    const result = await inquiryService.createInquiry({
      name: validated.name,
      email: validated.email,
      message: validated.message,
      company: validated.company || null,
      phone: validated.phone || null,
      country: validated.country || null,
      preferredPlatform: validated.preferredPlatform || null,
      source: "contact-page",
      status: "new",
    });

    if (!result) {
      throw new Error("Failed to insert inquiry");
    }

    return { success: true, submissionId: result.id };
  } catch (error) {
    console.error("[Inquiry] Failed to submit:", error);
    throw new Error("Failed to submit inquiry");
  }
}

/**
 * Handles Quote Requests (from InquiryDrawer).
 * Currently mocks the persistence (matching legacy API behavior).
 */
export async function submitQuoteRequest(data: QuoteSubmissionData) {
  // 1. Validation
  QuoteSubmissionSchema.parse(data);

  try {
    // 2. Logic: Log to DB (Still Mocked)
    // console.log("[Quote Request Received]", {
    //   timestamp: new Date().toISOString(),
    //   ...validated,
    // });

    // 3. Mock Email Send
    // console.log(`[Email Mock] Sending quote confirmation to ${validated.contact.email}`);

    // In the future: Insert into inquiries table (needs schema migration for items)
    /*
     await db.insert(inquiries).values({
        name: validated.contact.name,
        email: validated.contact.email,
        message: `Quote Request for ${validated.items.length} items.\n\nDescription: ${validated.contact.projectDescription}`,
        company: validated.contact.company,
        phone: validated.contact.phone,
        source: "quote-drawer",
        status: "new"
     });
     */

    return {
      success: true,
      message: "Quote request received successfully",
      inquiryId: `INQ-${Date.now()}`,
    };
  } catch (error) {
    console.error("[Quote] Failed to submit:", error);
    throw new Error("Failed to submit quote request");
  }
}

// --- Internal ---

// React 19 Server Action Adapter for useActionState
export async function submitInquiryAction(_prevState: unknown, formData: FormData) {
  const data = {
    name: (formData.get("name") || formData.get("contactName")) as string,
    email: formData.get("email") as string,
    message: formData.get("message") as string,
    company: (formData.get("company") || formData.get("companyName")) as string,
    phone: formData.get("phone") as string,
    country: formData.get("country") as string,
    preferredPlatform: (formData.get("preferredPlatform") || formData.get("platform")) as string,
    honeypot: formData.get("honeypot") as string,
    recaptchaToken: formData.get("recaptchaToken") as string,
  };

  try {
    const result = await submitContactInquiry({
      ...data,
      // Ensure nulls for optional fields if they are empty strings or undefined
      company: data.company || null,
      phone: data.phone || null,
      country: data.country || null,
      preferredPlatform: data.preferredPlatform || null,
      honeypot: data.honeypot || undefined,
    });

    return {
      status: "success" as const,
      message: "Thank you for your inquiry. Our B2B team will contact you within 24 hours.",
      timestamp: Date.now(),
      data: result,
    };
  } catch (error) {
    let invalidParams: Record<string, string[]> | undefined;

    if (error instanceof z.ZodError) {
      invalidParams = error.flatten().fieldErrors as Record<string, string[]>;
    } else if (error && typeof error === "object" && "invalidParams" in error) {
      // AppError or similar
      invalidParams = (error as { invalidParams: Record<string, string[]> }).invalidParams;
    }

    // Construct a pseudo-ApiError for the client
    const errorData = {
      status: 400,
      title: "Submission Failed",
      message: error instanceof Error ? error.message : "Submission failed",
      "invalid-params": invalidParams,
      isValidationError: !!invalidParams,
    };

    return {
      status: "error" as const,
      message: error instanceof Error ? error.message : "Submission failed",
      timestamp: Date.now(),
      error: errorData, // Pass this to useServerValidation
    };
  }
}

// --- Legacy Alias (Deprecation Path) ---
export { submitContactInquiry as submitInquiry };
