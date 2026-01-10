"use server";

export async function subscribeToNewsletter(
  _prevState: any,
  formData: FormData,
): Promise<{ status: "idle" | "success" | "error"; message: string }> {
  const email = formData.get("email");

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return {
      status: "error" as const,
      message: "Please enter a valid email address.",
    };
  }

  // biome-ignore lint/suspicious/noConsole: mock logging
  console.log(`[Newsletter] Subscribed: ${email}`);

  return {
    status: "success" as const,
    message: "You have been subscribed!",
  };
}
