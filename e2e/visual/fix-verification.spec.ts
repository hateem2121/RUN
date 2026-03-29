import { expect, test } from "@playwright/test";

const ROUTES = [
  { name: "homepage", path: "/" },
  { name: "products", path: "/products" },
  { name: "about", path: "/about" },
  { name: "contact", path: "/contact" },
];

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

test.describe("Tailwind v4 Fix Verification", () => {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`Visual comparison for ${route.name} on ${viewport.name}`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        // Go to page
        await page.goto(route.path, {
          waitUntil: "load",
        });

        // Deterministic rendering: Disable animations/transitions
        await page.addStyleTag({
          content: `
            *, *::before, *::after {
              transition: none !important;
              animation: none !important;
              scroll-behavior: auto !important;
            }
          `,
        });

        // Ensure fonts are loaded
        await page.evaluateHandle(() => document.fonts.ready);

        // Stabilize: additional wait for hydration/framer-motion to settle
        await page.waitForTimeout(500);

        // Assert screenshot
        await expect(page).toHaveScreenshot(`${route.name}-${viewport.name}.png`, {
          fullPage: true,
          animations: "disabled",
          mask: [page.locator('[data-testid="dynamic-content"]')], // Optional: mask dynamic areas if they exist
        });
      });
    }
  }
});
