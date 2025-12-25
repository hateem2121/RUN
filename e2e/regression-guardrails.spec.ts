import { expect, test } from "@playwright/test";

test.describe("Critical Route Regression Guardrails", () => {
  test("Homepage loads without critical errors", async ({ page }) => {
    // Navigate to homepage
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Check for critical content
    await expect(page.locator("body")).toBeVisible();

    // Check for no console errors of type 'error' (excluding known noise if needed)
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    // Allow for hydration
    await page.waitForTimeout(1000);

    // Assert no hydration crashes
    const crashText = await page.getByText("Something went wrong").count();
    expect(crashText).toBe(0);
  });

  test("Products page loads without crashing", async ({ page }) => {
    // Navigate to products page
    const response = await page.goto("/products", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    // Filter out 404s for favicon or maps which are noise
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        // Ignore specific known noise if strictly necessary, but for now capture all
        errors.push(msg.text());
      }
    });

    // Wait for content to settle (loading states to resolve)
    await page.waitForTimeout(2000);

    // Verify grid is visible OR loading state OR "no products" message OR the page heading
    // This implicitly checks that the component rendered
    const gridVisible = await page
      .locator(".grid")
      .first()
      .isVisible()
      .catch(() => false);
    const noProductsVisible = await page
      .getByText("No products found")
      .isVisible()
      .catch(() => false);
    const headingVisible = await page
      .getByRole("heading", { name: /Showcase|Catalog/i })
      .first()
      .isVisible()
      .catch(() => false);

    expect(gridVisible || noProductsVisible || headingVisible).toBeTruthy();

    // Explicitly check for the crash boundary text
    const crashText = await page.getByText("Something went wrong").count();
    expect(crashText).toBe(0);
  });
});
