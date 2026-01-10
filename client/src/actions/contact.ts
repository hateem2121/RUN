import type { ProblemDetails } from "@/types/problem-details";

export type ContactActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  timestamp: number;
};

export const initialState: ContactActionState = {
  status: "idle",
  message: "",
  timestamp: Date.now(),
};

/**
 * Server Action for submitting B2B inquiries.
 * Compatible with React 19 useActionState.
 */
export async function submitInquiry(
  _prevState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const data = Object.fromEntries(formData);

  // Basic transformation for JSON API
  // In a real Server Action (Next.js/Remix), validation would happen here.
  // Since we are bridging to an Express API, we send the JSON.

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Try to parse ProblemDetails
      let errorData: Partial<ProblemDetails> = {};
      try {
        errorData = await response.json();
      } catch {
        // failed to parse
      }

      return {
        status: "error",
        message: errorData.detail || "Failed to submit inquiry. Please try again.",
        timestamp: Date.now(),
      };
    }

    return {
      status: "success",
      message: "Thank you for your inquiry. Our B2B team will contact you within 24 hours.",
      timestamp: Date.now(),
    };
  } catch (_error) {
    return {
      status: "error",
      message: "Network error. Please check your connection.",
      timestamp: Date.now(),
    };
  }
}
