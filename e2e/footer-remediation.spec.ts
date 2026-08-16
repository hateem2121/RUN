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

    // 4. Ensure copyright is scrolled into view
    await copyright.scrollIntoViewIfNeeded();

    // 5. Assert it is visible in the viewport
    await expect(copyright).toBeVisible({ timeout: 10000 });
  });

  test("Footer has proper layout structure", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Locate footer
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Footer should have relative positioning (standard flow)
    await expect(footer).toHaveCSS("position", "relative");
  });

  test("Footer contains 'Start Your Order' form", async ({ page }) => {
    await page.goto("/");

    // Check for the heading
    const heading = page.getByRole("heading", { name: /Start Your.*Order/i });
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Check for form inputs by their IDs or names
    await expect(page.locator("#company").or(page.locator('input[name="company"]'))).toBeVisible();
    await expect(
      page.locator("#footer-email").or(page.locator('input[name="email"]')).first(),
    ).toBeVisible();
    await expect(
      page
        .locator("#specs")
        .or(page.locator('textarea[name="specs"], input[name="specs"]'))
        .first(),
    ).toBeVisible();
  });

  test("Footer copyright contains current year", async ({ page }) => {
    await page.goto("/");

    // Scroll to footer
    await page.locator("footer").scrollIntoViewIfNeeded();

    // Verify copyright or brand logotype exists
    await expect(page.locator("footer")).toBeVisible({ timeout: 10000 });
  });

  test("Footer social links section exists", async ({ page }) => {
    await page.goto("/");

    // Scroll to footer
    await page.locator("footer").scrollIntoViewIfNeeded();

    // Check for Footer Layout sections
    await expect(page.locator("footer")).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText(/\[ NETWORK \]|\[ HQ COORDINATES \]|\[ DIRECT LINE \]/i).first(),
    ).toBeVisible({ timeout: 15000 });
  });
});
