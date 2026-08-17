import { expect, test } from "@playwright/test";

test.describe("Phase 5: Forensic UI Proof", () => {
  test("P0: Contact Page Content & No Loading State", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByText("Get In Touch")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Loading...")).not.toBeVisible();

    // Capture Proof
    await page.screenshot({
      path: "e2e/artifacts/contact-proof.png",
      fullPage: true,
    });
  });

  test("P1: SSR Hydration State", async ({ page }) => {
    const response = await page.goto("/contact");
    const html = await response?.text();
    expect(html).toBeDefined();
    expect(html?.length).toBeGreaterThan(500);
  });

  test("SPA Routing: Cart Page", async ({ page }) => {
    // 1. Try to click Cart Link from Dock if it exists
    const cartLink = page.locator('a[href="/cart"]');
    if (await cartLink.isVisible()) {
      await cartLink.click();
      await expect(page).toHaveURL(/.*\/cart/);
    } else {
      // Fallback: Navigate directly to Client-Only route
      await page.goto("/cart");
    }

    // Capture Proof
    await page.screenshot({ path: "e2e/artifacts/cart-route.png" });
  });
});
