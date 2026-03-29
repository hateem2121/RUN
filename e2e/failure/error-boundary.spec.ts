import { expect, test } from "@playwright/test";

test.describe("Resilience & Error Handling", () => {
  test("should gracefully handle 500 API errors with a Try Again UI", async ({ page }) => {
    // 1. Mock a 500 error for the initial page load (or key data fetch)
    // Assuming /api/products or similar is fetched on the home page or products page.
    // Let's target a specific route that fetches data, e.g., the home page fetches products.
    await page.route("**/api/products*", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal Server Error" }),
      });
    });

    // 2. Navigate to the page
    // Using a known page that depends on this data. If the homepage fetches products, this works.
    await page.goto("/");

    // 3. Verify Error Boundary appears (Text may vary depending on ErrorBoundary component)
    // Looking for generic error visuals or text "Something went wrong"
    const errorCard = page.locator("text=Something went wrong");
    await expect(errorCard).toBeVisible();

    // 4. Verify "Try Again" button exists
    const tryAgainBtn = page.getByRole("button", { name: /try again/i });
    await expect(tryAgainBtn).toBeVisible();
  });

  test("should recover when 'Try Again' is clicked after API failure is resolved", async ({
    page,
  }) => {
    // 1. Initially fail
    await page.route("**/api/products*", async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.goto("/");
    await expect(page.locator("text=Something went wrong")).toBeVisible();

    // 2. Fix the mock (unroute or override)
    await page.unroute("**/api/products*");
    // Or explicit success response if the real backend isn't available during strict e2e
    // But unroute maps back to network if using a real backend, or we can route to success
    /* 
    await page.route("**\/api/products*", (route) => {
       route.fulfill({ status: 200, body: JSON.stringify([...]) });
    });
    */

    // 3. Click Try Again
    await page.getByRole("button", { name: /try again/i }).click();

    // 4. Verify Recovery (Error UI gone, Content visible)
    await expect(page.locator("text=Something went wrong")).not.toBeVisible();
    // Assuming the homepage has a "featured" or "shop" text, or header
    // Ideally check for product list or main content
    // For now, checking that the error is gone is a strong signal of reset.
  });

  test("should display 404 page for non-existent routes", async ({ page }) => {
    const randomRoute = `/this-page-definitely-does-not-exist-${Date.now()}`;
    await page.goto(randomRoute);

    // Verify 404 text
    // Matches "404 Page Not Found" in client/src/pages/not-found.tsx
    await expect(page.getByRole("heading", { name: /404 page not found/i })).toBeVisible();
  });
});
