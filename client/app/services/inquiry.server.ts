import {
  type ContactSubmissionData,
  ContactSubmissionSchema,
  type QuoteSubmissionData,
  QuoteSubmissionSchema,
} from "@shared/index";
import { z } from "zod";

// --- Actions ---

/**
 * Handles B2B Contact Form submissions.
 * Inserts directly into the database.
 */
async function submitContactInquiry(data: ContactSubmissionData) {
  // 1. Validation
  const validated = ContactSubmissionSchema.parse(data);

  // 2. Honeypot check
  if (validated.honeypot && validated.honeypot.trim().length > 0) {
    console.warn(`[Inquiry] Honeypot triggered: ${validated.email}`);
    throw new Error("Invalid submission");
  }

  try {
    const port = process.env.PORT || "5002";
    const base = `http://localhost:${port}`;
    const response = await fetch(`${base}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validated),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to submit inquiry");
    }

    return { success: true, submissionId: result.submissionId };
  } catch (error) {
    console.error("[Inquiry] Failed to submit:", error);
    throw error instanceof Error ? error : new Error("Failed to submit inquiry");
  }
}

/**
 * Handles Quote Requests (from InquiryDrawer).
 * Currently mocks the persistence (matching legacy API behavior).
 */
/** @public */ export async function submitQuoteRequest(data: QuoteSubmissionData) {
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
export async function submitInquiryAction(_request: Request | null, formData: FormData) {
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
      name: data.name,
      email: data.email,
      message: data.message,
      company: data.company || null,
      phone: data.phone || null,
      country: data.country || null,
      preferredPlatform: data.preferredPlatform || null,
      honeypot: data.honeypot || undefined,
      recaptchaToken: data.recaptchaToken || undefined,
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
