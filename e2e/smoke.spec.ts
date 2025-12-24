import { expect, test } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5001";

test.describe("🔥 Smoke & Regression Guardrails", () => {
  test("P0/P1: SSR Critical Route & Hydration (Contact)", async ({ page }) => {
    // 1. Visit Critical Route
    await page.goto(`${BASE_URL}/contact`);

    // 2. Assert Content (P0: SSR Content)
    await expect(page.getByRole("heading", { name: /get in touch/i })).toBeVisible({
      timeout: 15000,
    });

    // 3. Assert Hydration State Injection (P1: SSR State)
    const hydrationState = await page.evaluate(() => window.__REACT_QUERY_STATE__);
    expect(hydrationState).toBeTruthy();
    // Check for specific preloaded data if known (e.g., contact-config)
    const stateString = JSON.stringify(hydrationState);
    expect(stateString).toContain("/api/contact-info");
  });

  test("P2: Z-Index Overlay Route Accessibility", async ({ page }) => {
    await page.goto(`${BASE_URL}/e2e-overlay`);

    // Ensure it loads (no "Loading..." stall)
    await expect(page.getByText("Loading...")).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Z-Index Interaction Proof" })).toBeVisible();

    // Verify Mock Header exists
    await expect(page.getByTestId("mock-header")).toBeVisible();
  });
});
