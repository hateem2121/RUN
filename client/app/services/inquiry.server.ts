"use server";

import { inquiries } from "@shared/schema";
import { db } from "../db.server";

export type SubmitInquiryData = {
  name: string;
  email: string;
  message: string;
  company?: string | null;
  phone?: string | null;
  country?: string | null;
  preferredPlatform?: string | null;
  honeypot?: string;
};

// React 19 Server Action Adapter
export async function submitInquiryAction(_prevState: any, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    message: formData.get("message") as string,
    company: formData.get("company") as string,
    phone: formData.get("phone") as string,
    country: formData.get("country") as string,
    preferredPlatform: formData.get("preferredPlatform") as string,
    honeypot: formData.get("honeypot") as string,
  };

  try {
    const result = await submitInquiry(data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Submission failed",
    };
  }
}

export async function submitInquiry(data: SubmitInquiryData) {
  // 1. Honeypot check
  if (data.honeypot && data.honeypot.trim().length > 0) {
    // biome-ignore lint/suspicious/noConsole: honeypot logging
    console.warn(`[Inquiry] Honeypot triggered: ${data.email}`);
    throw new Error("Invalid submission");
  }

  try {
    // 2. Insert into Database
    const [result] = await db
      .insert(inquiries)
      .values({
        name: data.name,
        email: data.email,
        message: data.message,
        company: data.company,
        phone: data.phone,
        country: data.country,
        preferredPlatform: data.preferredPlatform,
        source: "contact-page",
        status: "new",
      })
      .returning();

    if (!result) {
      throw new Error("Failed to insert inquiry");
    }

    // biome-ignore lint/suspicious/noConsole: tracking
    console.log(`[Inquiry] Created inquiry #${result.id} via Server Action`);

    // 3. Mock Email (Replacement for backend emailService)
    // In a full refactor, we would import a shared email service here using an interface
    await mockSendEmail(result);

    return { success: true, submissionId: result.id };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: error logging
    console.error("[Inquiry] Failed to submit:", error);
    throw new Error("Failed to submit inquiry");
  }
}

async function mockSendEmail(inquiry: any) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  // biome-ignore lint/suspicious/noConsole: mock email
  console.log(`[Email Mock] Sending confirmation to ${inquiry.email}`);
  // biome-ignore lint/suspicious/noConsole: mock email
  console.log(`[Email Mock] Sending admin notification for inquiry #${inquiry.id}`);
}
