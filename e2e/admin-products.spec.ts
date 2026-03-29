import { expect, test } from "@playwright/test";

test.describe("Admin - Product Management", () => {
  test.beforeEach(async ({ page }) => {
    // Mock login or assume auth state setup
    // For now, we'll just visit the page and expect redirect if not logged in
    await page.goto("/admin/products");
  });

  test("should complete full product CRUD lifecycle", async ({ page }) => {
    // Enable browser console logging
    page.on("console", (msg) => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    page.on("pageerror", (err) => console.log(`BROWSER ERROR: ${err.message}`));

    // Detailed Network Logging
    page.on("request", (req) => {
      if (req.url().includes("/api/")) {
        console.log(`API REQ: ${req.method()} ${req.url()}`);
      }
    });
    page.on("response", (res) => {
      if (res.status() >= 400) {
        console.log(`API ERR ${res.status()}: ${res.request().method()} ${res.url()}`);
      }
    });

    // 1. Navigate and handle loading
    console.log("Navigating to /admin/products...");
    await page.goto("/admin/products");
    await page.waitForURL("**/admin/products");

    // Increased resilience for "Checking access..." state
    const checkingAccess = page.getByText("Checking access...");
    try {
      console.log("Waiting for 'Checking access...' to disappear...");
      await expect(checkingAccess).not.toBeVisible({ timeout: 15000 });
    } catch (_e) {
      console.log("Stuck on 'Checking access...', attempting reload stability sequence...");
      await page.reload({ waitUntil: "networkidle" });
      await expect(checkingAccess).not.toBeVisible({ timeout: 25000 });
    }

    // Ensure we see the main layout
    console.log("Waiting for 'Product Management' header...");
    await expect(page.getByText("Product Management")).toBeVisible({ timeout: 20000 });
    await page.waitForLoadState("networkidle");

    // 2. Open Create Modal
    console.log("Clicking create button...");
    const createBtn = page
      .getByTestId("new-product-button")
      .or(page.getByTestId("create-first-product-button"))
      .first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Wait for modal to be ready
    console.log("Waiting for modal dialog...");
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 15000 });
    await expect(modal.getByText("Basic Information")).toBeVisible({ timeout: 10000 });

    // 3. Fill Basic Info
    const testName = `E2E Test Product ${Date.now()}`;
    const testSku = `E2E-SKU-${Math.floor(Math.random() * 10000)}`;

    await modal.locator("#name").fill(testName);
    await modal.locator("#sku").fill(testSku);
    await modal
      .locator("#description")
      .fill(
        "This is an automated E2E test product description that meets the 20 character requirement.",
      );

    // 4. Select Category & Fabric (Required)
    const categoryFabricHeader = modal.getByText("Category & Fabric");
    await categoryFabricHeader.click();

    // Select Category using the trigger
    await modal.locator('button:has-text("Select category")').click();
    await page.getByRole("option").first().click();

    // Select Fabric using the trigger
    await modal.locator('button:has-text("Select fabric")').click();
    await page.getByRole("option").first().click();

    // 5. Select Primary Image (Required)
    await modal.getByText("Media Assets").click();
    await modal.getByRole("button", { name: /Select Primary/i }).click();

    // Wait for media picker
    const mediaLibrary = page.getByText("Media Library");
    await expect(mediaLibrary).toBeVisible();
    // Pick first image in the grid
    await page.locator(".grid > div").first().click();
    await page
      .getByRole("button", { name: /Confirm Selection|Select/i })
      .first()
      .click();

    // 6. Save
    const saveBtn = modal.getByRole("button", { name: /Save|Create Product/i });
    await saveBtn.click();

    // 7. Verify Creation (Search and check table)
    await expect(page.getByText("Product created successfully")).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder("Search products...").fill(testName);

    // Check if it appears in list or grid
    const productElement = page.getByText(testName).first();
    await expect(productElement).toBeVisible();

    // 8. Delete the product
    // Click on the card to show actions if in grid mode, or use context menu
    await productElement.click(); // Select it first to show details panel if applicable

    // Open actions menu if needed, or click delete if visible
    const deleteBtn = page.getByRole("button", { name: /Delete/i }).first();
    await deleteBtn.click();

    // Confirm in dialog
    const confirmDialog = page.getByRole("dialog").filter({ hasText: /Delete Product/i });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: /Confirm|Delete/i }).click();

    // 9. Final Verification
    await expect(page.getByText("Product Deleted")).toBeVisible();
    await expect(page.getByText(testName)).not.toBeVisible();
  });
});
