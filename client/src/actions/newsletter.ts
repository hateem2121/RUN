"use server";

import { z } from "zod";
import { db } from "@/lib/db.server";

// In a real app, you'd insert into a table.
// For this refactor, we simulate the logic but running ON SERVER.

const schema = z.object({
  email: z.string().email(),
});

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function subscribeToNewsletter(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email");

  // Validate
  const parsed = schema.safeParse({ email });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
    };
  }

  try {
    // SIMULATION: In real implementation, this would be:
    // await db.insert(newsletterSubscribers).values({ email: parsed.data.email });

    // Check DB connection just to prove "True" Server Action capability
    // This query runs on the server
    await db.execute("SELECT 1");

    return {
      status: "success",
      message: "Successfully subscribed!",
    };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Logging errors is required for server actions
    console.error("Newsletter subscription failed:", error);
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
}
