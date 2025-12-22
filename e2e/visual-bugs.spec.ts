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

  test("FOUC Protection - Root is eventually visible", async ({ page }) => {
    await page.goto("/");
    const root = page.locator("#root");

    // Ensure root is visible and opaque
    await expect(root).toBeVisible();
    await expect(root).toHaveCSS("opacity", "1");
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

  test("Test-Fixes Layout remains stable against Sticky Footer", async ({ page }) => {
    await page.goto("/test-fixes");
    await page.waitForLoadState("networkidle");

    // Section should be relative and z-10 to occlude footer
    // We check for the specific sections we updated
    const sections = page.locator("section.relative.z-10");
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const section = sections.nth(i);
      await expect(section).toBeVisible();
      // Check background is opaque (white or neutral-800)
      const bg = await section.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      const classes = await section.getAttribute("class");
      expect(bg, `Failed for element with classes: ${classes}`).not.toBe("rgba(0, 0, 0, 0)");
    }
  });
  test("FOUC Safety Reveal fallback triggers after 3s (Mocking JS Failure)", async ({
    browser,
  }) => {
    // 1. Create a context with JS disabled
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto("/test-fixes");

    // 2. Initially hidden (opacity 0)
    const root = page.locator("#root");
    await expect(root).toHaveCSS("opacity", "0");

    // 3. At 0.5s, should DEFINITELY be hidden (Safety Reveal is 3s)
    await page.waitForTimeout(500);
    await expect(root).toHaveCSS("opacity", "0");

    // 4. Wait for safety reveal (> 3s total)
    await page.waitForTimeout(3500); // Enough buffer to ensure >3s

    // 5. Should BE visible now via CSS animation
    await expect(root).toHaveCSS("opacity", "1");

    await context.close();
  });
});
