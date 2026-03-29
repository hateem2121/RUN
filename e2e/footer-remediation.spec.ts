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
    await expect(heading).toBeVisible();

    // Check for form inputs by their IDs
    await expect(page.locator("#company")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#specs")).toBeVisible();
  });

  test("Footer copyright contains current year", async ({ page }) => {
    await page.goto("/");

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Verify copyright has current year
    const currentYear = new Date().getFullYear().toString();
    const copyright = page.getByText(new RegExp(`© ${currentYear}.*ALL RIGHTS RESERVED`));
    await expect(copyright).toBeVisible();
  });

  test("Footer social links section exists", async ({ page }) => {
    await page.goto("/");

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for Network section with social links
    await expect(page.getByText("[ NETWORK ]")).toBeVisible();
    await expect(page.getByRole("link", { name: "Instagram" })).toBeVisible();
    await expect(page.getByRole("link", { name: "LinkedIn" })).toBeVisible();
  });
});
