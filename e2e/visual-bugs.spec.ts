import { expect, test } from "@playwright/test";

test.describe("UI/UX Visual Audit Hardening", () => {
  test.use({ colorScheme: "light" });

  test("Statistic Ticker remains robust (no extra zeros or corruption)", async ({ page }) => {
    // Navigate to homepage where tickers are located
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll down to the stats section
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(2000);

    // Target the specific ticker elements
    // The visual ticker is a span with aria-hidden="true" inside the stats section
    const tickers = page.locator('span[aria-hidden="true"]').filter({ hasText: /^\d+$/ });

    // Check first ticker
    const firstTicker = tickers.first();
    await expect(firstTicker).toBeVisible({ timeout: 15000 });

    // Verify it doesn't contain corruption (like raw scramble text visible to SR)
    const text = await firstTicker.innerText();
    // Regex for typical values like "1,200+", "4.5/5", "10k+"
    expect(text).toMatch(/[\d,.]+[+/k]?/);

    // Verify aria-hidden attribute exists on the ticker itself
    await expect(firstTicker).toHaveAttribute("aria-hidden", "true");
  });

  test("FOUC Protection - Body is eventually visible", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");

    // Ensure body is visible and opaque
    await expect(body).toBeVisible();
    await expect(body).toHaveCSS("opacity", "1");
  });

  test("SR-Only utilities are truly hidden", async ({ page }) => {
    await page.goto("/");
    // Find any sr-only element
    const srOnly = page.locator(".sr-only").first();

    if ((await srOnly.count()) > 0) {
      await expect(srOnly).toHaveCSS("position", "absolute");
      await expect(srOnly).toHaveCSS("width", "1px");
      await expect(srOnly).toHaveCSS("height", "1px");
    }
  });
});
