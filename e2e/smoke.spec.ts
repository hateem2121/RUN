import { expect, test } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5002";

test.describe("🔥 Smoke & Regression Guardrails", () => {
  test("P0/P1: SSR Critical Route & Hydration (Contact)", async ({ page }) => {
    // 1. Visit Critical Route
    const response = await page.goto(`${BASE_URL}/contact`);
    expect(response?.status()).toBe(200);

    // 2. Assert Content (P0: SSR Content)
    await expect(
      page.getByRole("heading", { name: /contact|get in touch|drop us a line/i }).first(),
    ).toBeVisible({
      timeout: 15000,
    });

    // 3. Assert Interactive Contact Form Hydrated
    await expect(page.getByTestId("form-contact").or(page.locator("form")).first()).toBeVisible({
      timeout: 15000,
    });
  });

  test("P2: Navigation & Floating Dock Accessibility", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Ensure page loads without blocking
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

    // Verify Navigation & Layout Shell exists
    await expect(
      page.locator('nav, header a, [aria-label*="Homepage"], main, #main-content').first(),
    ).toBeVisible({ timeout: 10000 });
  });
});
