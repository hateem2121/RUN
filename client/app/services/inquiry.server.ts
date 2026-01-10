"use server";

import { inquiries } from "@shared/schema";
import { z } from "zod";
import { db } from "../db.server";

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
    // biome-ignore lint/suspicious/noConsole: honeypot logging
    console.warn(`[Inquiry] Honeypot triggered: ${validated.email}`);
    throw new Error("Invalid submission");
  }

  try {
    // 3. Insert into Database
    const [result] = await db
      .insert(inquiries)
      .values({
        name: validated.name,
        email: validated.email,
        message: validated.message,
        company: validated.company || null,
        phone: validated.phone || null,
        country: validated.country || null,
        preferredPlatform: validated.preferredPlatform || null,
        source: "contact-page",
        status: "new",
      })
      .returning();

    if (!result) {
      throw new Error("Failed to insert inquiry");
    }

    // biome-ignore lint/suspicious/noConsole: tracking
    console.log(`[Inquiry] Created inquiry #${result.id} via Server Action`);

    // 4. Mock Email
    await mockSendEmail(result);

    return { success: true, submissionId: result.id };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: error logging
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
  const validated = QuoteSubmissionSchema.parse(data);

  try {
    // 2. Logic: Log to DB (Still Mocked)
    // biome-ignore lint/suspicious/noConsole: Log payload
    console.log("[Quote Request Received]", {
      timestamp: new Date().toISOString(),
      ...validated,
    });

    // 3. Mock Email Send
    // biome-ignore lint/suspicious/noConsole: Mock email
    console.log(`[Email Mock] Sending quote confirmation to ${validated.contact.email}`);

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
    // biome-ignore lint/suspicious/noConsole: error logging
    console.error("[Quote] Failed to submit:", error);
    throw new Error("Failed to submit quote request");
  }
}

// --- Internal ---

// --- Internal ---

async function mockSendEmail(inquiry: any) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  // biome-ignore lint/suspicious/noConsole: mock email
  console.log(`[Email Mock] Sending confirmation to ${inquiry.email}`);
  // biome-ignore lint/suspicious/noConsole: mock email
  console.log(`[Email Mock] Sending admin notification for inquiry #${inquiry.id}`);
}

// React 19 Server Action Adapter for useActionState
export async function submitInquiryAction(_prevState: any, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    message: formData.get("message") as string,
    company: formData.get("companyName") as string, // B2B form uses companyName
    phone: formData.get("phone") as string,
    // Add other fields from B2B form if needed
  };

  try {
    const result = await submitContactInquiry({
      ...data,
      country: null,
      preferredPlatform: null,
      honeypot: undefined,
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
    } else if ((error as any)?.invalidParams) {
        // AppError or similar
        invalidParams = (error as any).invalidParams;
    }

    // Construct a pseudo-ApiError for the client
    const errorData = {
      status: 400,
      title: "Submission Failed",
      message: error instanceof Error ? error.message : "Submission failed",
      "invalid-params": invalidParams,
      isValidationError: !!invalidParams
    };

    return {
      status: "error" as const,
      message: error instanceof Error ? error.message : "Submission failed",
      timestamp: Date.now(),
      error: errorData // Pass this to useServerValidation
    };
  }
}

// --- Legacy Alias (Deprecation Path) ---
export { submitContactInquiry as submitInquiry };
