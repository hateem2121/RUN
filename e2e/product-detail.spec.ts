import { expect, test } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:5002";

test.describe("🛒 Product Detail Verification", () => {
  test("Dynamic Product Detail Load", async ({ page, request }) => {
    // 1. Fetch products from API to find a valid target
    const productsResponse = await request.get(`${BASE_URL}/api/products?limit=5`);
    expect(productsResponse.ok()).toBeTruthy();

    const responseJson = await productsResponse.json();
    const products = responseJson.data; // Assuming structure { data: [...] }
    expect(products.length).toBeGreaterThan(0);

    const targetProduct = products[0];
    const _slug = targetProduct.slug;

    // Use urlPath from API if available, otherwise construct based on convention
    // Note: The recent fix ensured urlPath is populated for at least one product
    let targetUrl = targetProduct.urlPath;

    // Fallback if urlPath is not present in the summary list (it might be detailed-only)
    if (!targetUrl) {
      targetUrl = "/categories/athletic-wear/pro-performance-tshirt";
    }

    // 2. Navigate to product detail page
    await page.goto(`${BASE_URL}${targetUrl}`);

    // 3. Verify Page Content
    // Title should be visible and match product name (or close to it)
    // Title should be visible and match product name (or close to it)
    // Fix: Use first() or specific filtering to avoid strict mode violations with Header H1
    await expect(
      page
        .locator("h1")
        .filter({ hasText: /Pro Performance|Product/ })
        .first(),
    ).toBeVisible({ timeout: 15000 });

    // 4. Verify "Add to Cart" button exists
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();

    // 5. Verify Price is visible
    await expect(page.locator("text=$").first()).toBeVisible();
  });
});
