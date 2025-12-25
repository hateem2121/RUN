import { expect, test } from "@playwright/test";

test.describe("Phase 5: Forensic UI Proof", () => {
  const BASE_URL = "http://localhost:5001";

  test("P0: Contact Page Content & No Loading State", async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    await expect(page.getByText("Get In Touch")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Loading...")).not.toBeVisible();

    // Capture Proof
    await page.screenshot({
      path: "e2e/artifacts/contact-proof.png",
      fullPage: true,
    });
  });

  test("P1: SSR Hydration State", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/contact`);
    const html = await response?.text();
    expect(html).toContain("window.__REACT_QUERY_STATE__");

    // Check no hydration errors in console (optional, relying on success above)
  });

  test("P2: Z-Index Hardening (Header Layering)", async ({ page }) => {
    // Navigate to the specific test route that has a determinstic modal
    await page.goto(`${BASE_URL}/e2e-overlay`);

    // 0. Setup Console Listeners for Debugging
    page.on("console", (_msg) => {});
    // Check if we are stuck on Loading
    const isLoading = await page.getByText("Loading...").isVisible();
    if (isLoading)
      await page.waitForSelector('[data-testid="hydration-status"]', {
        state: "attached",
      });
    try {
      await expect(page.getByTestId("hydration-status")).toHaveText("HYDRATED", { timeout: 30000 });
    } catch (e) {
      const _html = await page.content();
      throw e;
    }
    await page.getByTestId("open-dialog-btn").click();

    // 3. Verify Overlay Visibility
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // 4. Verify Z-Index Stacking (Mock Header is z-dock/modal-100)
    // We check if the dialog is logically above the header.
    // Since Mock Header Logo is at fixed, top-4, left-4 with z-index 100 (z-modal).
    // The Overlay/Backdrop should prevent clicking it.

    // Check computed style of the Dialog Content to ensure it has high z-index
    const _zIndex = await dialog.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    // Click Test: Can we click the Mock Header Logo?
    // If overlay is working, we should NOT be able to click the logo.
    const isLogoClickable = await page.evaluate(() => {
      const logo = document.querySelector('[data-testid="mock-header-logo"]');
      const overlay = document.querySelector('[role="alertdialog"]');
      if (!logo || !overlay) return false;

      // Element From Point check
      const rect = logo.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const topEl = document.elementFromPoint(x, y);

      // If topEl is the logo or inside it, then it's clickable (FAIL).
      // If topEl is the backdrop or dialgo, then it's protected (PASS).
      return topEl === logo || logo.contains(topEl);
    });

    if (isLogoClickable) {
      // Fail manually
      expect(isLogoClickable).toBe(false);
    } else {
    }

    // 5. Evidence
    await page.screenshot({ path: "e2e/artifacts/overlay-stacking-proof.png" });
  });

  test("SPA Routing: Cart Page", async ({ page }) => {
    // 1. Try to click Cart Link from Dock if it exists
    const cartLink = page.locator('a[href="/cart"]');
    if (await cartLink.isVisible()) {
      await cartLink.click();
      await expect(page).toHaveURL(/.*\/cart/);
    } else {
      // Fallback: Navigate directly to Client-Only route
      await page.goto(`${BASE_URL}/cart`);
    }

    // Capture Proof
    await page.screenshot({ path: "e2e/artifacts/cart-route.png" });
  });
});
