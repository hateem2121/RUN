import { expect, test } from "@playwright/test";

test.describe("Resilience & Error Handling", () => {
  test("should display error boundary for non-existent routes", async ({ page }) => {
    const randomRoute = `/this-page-definitely-does-not-exist-${Date.now()}`;
    await page.goto(randomRoute);

    // Verify Error Boundary renders
    await expect(
      page.getByRole("heading", { name: /Error|404|Something went wrong/i }).first(),
    ).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("link", { name: /Return|Home|Safety/i })).toBeVisible({
      timeout: 15000,
    });
  });
});
