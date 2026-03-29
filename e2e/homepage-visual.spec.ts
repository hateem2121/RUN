import { expect, test } from "@playwright/test";

// Routes to snapshot
const ROUTES = ["/", "/products", "/about", "/contact", "/categories"];

test.describe("Visual Regression", () => {
  for (const route of ROUTES) {
    const name = route === "/" ? "homepage" : route.replace("/", "");

    test(`${name} visual consistency`, async ({ page }) => {
      await page.goto(route);

      // Stabilize UI
      await page.waitForLoadState("networkidle");
      // Wait for at least one h1 or key element
      await page.waitForSelector("h1", { state: "visible", timeout: 5000 }).catch(() => {});

      // Hide likely dynamic elements
      await page.addStyleTag({
        content: `
        .animate-pulse, .animate-spin { animation: none !important; opacity: 0; }
        video { opacity: 0; } 
        /* Hide dynamic data that might flake */
        [data-testid="dynamic-content"] { visibility: hidden; }
      `,
      });

      await expect(page).toHaveScreenshot(`${name}-desktop.png`, {
        maxDiffPixelRatio: 0.1,
        fullPage: true, // Capture full page layout
      });
    });

    test(`${name} mobile layout`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      // Hide likely dynamic elements
      await page.addStyleTag({
        content: `
        .animate-pulse, .animate-spin { animation: none !important; opacity: 0; }
        video { opacity: 0; } 
      `,
      });

      await expect(page).toHaveScreenshot(`${name}-mobile.png`, {
        maxDiffPixelRatio: 0.1,
      });
    });
  }
});
