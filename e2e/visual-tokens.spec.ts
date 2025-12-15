import { test, expect } from "@playwright/test";

test.describe("Visual Tokens Smoke Test", () => {
  test("should verify luxury theme tokens are applied", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Wait for Preloader to finish (main gets opacity-100)
    // The homepage has a preloader that sets main opacity to 0 initially.
    // Use .last() because there are nested main tags (Layout > Homepage)
    const main = page.locator("main").last();
    await expect(main).toHaveClass(/opacity-100/, { timeout: 15000 });

    // Locate the Hero section inside main
    const heroSection = main.locator("section").first();
    await expect(heroSection).toBeVisible();

    // Take a screenshot of the hero section for visual regression reference
    // Target only the hero section to avoid full page scroll/size issues
    // Mask the 3D canvas to avoid animation flakiness
    await expect(heroSection).toHaveScreenshot("hero-section-luxury.png", {
      mask: [heroSection.locator("canvas")],
      maxDiffPixelRatio: 0.01,
    });

    // Semantic check: Ensure background variable is resolved (not transparent/white default if variable missing)
    // Note: This relies on the element having a background class that utilizes the variable.
    // Assuming the hero uses 'bg-luxury-surface'.
    // We check computed style.

    // Check if the body has the variable defined (bridged from root)
    const body = page.locator("body");
    const surfaceColor = await body.evaluate((el) => {
      return getComputedStyle(el).getPropertyValue("--luxury-surface");
    });

    expect(surfaceColor).toBeTruthy();
    expect(surfaceColor).not.toBe("initial");
  });
});
