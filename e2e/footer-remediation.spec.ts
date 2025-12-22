import { expect, test } from "@playwright/test";

test.describe("Footer Remediation Verification", () => {
  test("Footer content is reachable on short laptop screens (1366x768)", async ({ page }) => {
    // 1. Set viewport to standard laptop resolution
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");

    // 2. Scroll to the absolute bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // 3. Locate the copyright text which is at the very bottom of the footer
    const copyright = page.getByText("ALL RIGHTS RESERVED");

    // 4. Assert it is visible in the viewport
    // Using toBeInViewport() ensures it's not just in the DOM, but actually visible to the user
    await expect(copyright).toBeInViewport();
  });

  test("Footer behaves as sticky reveal on tall screens", async ({ page }) => {
    // 1. Set viewport to tall desktop resolution
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    // 2. Locate footer
    const footer = page.locator("footer");

    // 3. Wait for layout to stabilize
    await page.waitForTimeout(500);

    // 4. Check that it has fixed positioning (class check implies behavior here, computed style is better but class is proxy for our logic)
    await expect(footer).toHaveClass(/fixed/);
    await expect(footer).toHaveCSS("position", "fixed");
  });

  test("Footer reverts to relative flow on very short screens", async ({ page }) => {
    // 1. Set viewport height intentionally shorter than likely footer height (~600px)
    await page.setViewportSize({ width: 1366, height: 500 });
    await page.goto("/");

    const footer = page.locator("footer");

    // 2. Wait for layout to stabilize
    await page.waitForTimeout(500);

    // 3. Should NOT have fixed positioning
    await expect(footer).toHaveCSS("position", "relative");
  });

  test("Footer contains 'Start Your Order' form", async ({ page }) => {
    await page.goto("/");

    // Check for the new heading
    await expect(page.getByRole("heading", { name: "Start Your\nOrder" })).toBeVisible();

    // Check for form inputs (Company, Email, Specs)
    await expect(page.getByLabel("01 // Company Name")).toBeVisible();
    await expect(page.getByLabel("02 // Email Protocol")).toBeVisible();
    await expect(page.getByLabel("03 // Project Specifications")).toBeVisible();
  });
});
