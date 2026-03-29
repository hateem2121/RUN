import { z } from "zod";

const NewsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export async function subscribeToNewsletter(
  _prevState: unknown,
  formData: FormData,
): Promise<{ status: "idle" | "success" | "error"; message: string }> {
  try {
    const email = formData.get("email");
    const result = NewsletterSchema.safeParse({ email });

    if (!result.success) {
      return {
        status: "error",
        message: result.error.issues[0]?.message || "Invalid email address.",
      };
    }

    const response = await fetch("/api/newsletter/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: result.data.email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.message || "An error occurred.",
      };
    }

    return {
      status: "success",
      message: "You have been subscribed!",
    };
  } catch (_error) {
    return {
      status: "error",
      message: "An error occurred. Please try again later.",
    };
  }
}
