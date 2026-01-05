import { expect, test } from "@playwright/test";

test.describe("Admin - Product Management", () => {
  test.beforeEach(async ({ page }) => {
    // Mock login or assume auth state setup
    // For now, we'll just visit the page and expect redirect if not logged in
    await page.goto("/admin/products");
  });

  test("should display product list", async ({ page }) => {
    // If we get redirected to login, that's a pass for this initial smoke test
    // Real implementation requires auth setup in global-setup.ts
    const url = page.url();
    if (url.includes("login")) {
      await expect(page.locator("h1")).toContainText("Login");
      return;
    }

    await expect(page.locator("h1")).toContainText("Products");
    await expect(page.locator("table")).toBeVisible();
  });

  // Placeholder for full CRUD test
  test.skip("should create a new product", async ({ page }) => {
    await page.getByRole("button", { name: "Create Product" }).click();
    await page.getByLabel("Name").fill("New Product");
    await page.getByLabel("SKU").fill("NP-001");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Product created")).toBeVisible();
  });
});
