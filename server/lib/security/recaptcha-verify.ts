import { logger } from "../monitoring/logger.js";

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Shared utility for reCAPTCHA v3 verification.
 * Decouples security logic from entry points (Express/Server Actions).
 */
export async function verifyRecaptcha(
  token: string | undefined,
  ip: string,
): Promise<{ success: boolean; score: number; error?: string }> {
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

  // Development & Test bypass
  if (
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_TEST === "true" ||
    process.env.E2E === "true" ||
    (process.env.NODE_ENV !== "production" &&
      (!recaptchaSecret ||
        recaptchaSecret.includes("dummy") ||
        recaptchaSecret.includes("test") ||
        recaptchaSecret.includes("placeholder")))
  ) {
    logger.info(`[Security] reCAPTCHA skipped (test/dev mode) for ${ip}`);
    return { success: true, score: 1.0 };
  }

  if (!recaptchaSecret) {
    logger.error("[Security] RECAPTCHA_SECRET_KEY is not defined in production");
    // Fail closed in production for security safety
    return { success: false, score: 0, error: "Security configuration error" };
  }

  if (!token) {
    logger.warn(`[Security] Missing reCAPTCHA token from ${ip}`);
    return { success: false, score: 0, error: "Bot detected (missing token)" };
  }

  try {
    const recaptchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: recaptchaSecret,
        response: token,
      }),
    });

    const recaptchaData = (await recaptchaRes.json()) as RecaptchaResponse;

    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      logger.warn(`[Security] reCAPTCHA failed for ${ip}: score ${recaptchaData.score}`, {
        errors: recaptchaData["error-codes"],
        action: recaptchaData.action,
      });
      return {
        success: false,
        score: recaptchaData.score || 0,
        error: "Bot detected (low score)",
      };
    }

    return { success: true, score: recaptchaData.score };
  } catch (error) {
    logger.error("[Security] reCAPTCHA verification error:", error);
    return { success: false, score: 0, error: "Security check failed" };
  }
}
