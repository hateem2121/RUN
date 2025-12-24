import { expect, test } from "@playwright/test";

// Release Verification Matrix
// Source: COVERAGE_MATRIX.md
const MATRIX = {
  routes: [
    { path: "/", name: "home" },
    { path: "/products", name: "products" },
    { path: "/contact", name: "contact" },
    // Adding manufacturing to verify token fix specifically in release suite
    { path: "/manufacturing", name: "manufacturing" },
  ],
  viewports: [
    { width: 1440, height: 900, label: "desktop" },
    { width: 768, height: 1024, label: "tablet" },
    { width: 375, height: 667, label: "mobile" },
  ],
  themes: ["light", "dark"],
};

test.describe("Release Verification Suite", () => {
  // Global Stabilization
  test.beforeEach(async ({ page }) => {
    // Inject CSS to stabilize animations/transitions for snapshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
          caret-color: transparent !important;
          scroll-behavior: auto !important;
        }
      `,
    });
  });

  for (const route of MATRIX.routes) {
    for (const viewport of MATRIX.viewports) {
      for (const theme of MATRIX.themes) {
        test(`Verify: ${route.name} | ${viewport.label} | ${theme}`, async ({ page }) => {
          // 1. Set Viewport
          await page.setViewportSize({ width: viewport.width, height: viewport.height });

          // 2. Navigate (Wait for network idle to ensure assets loaded)
          await page.goto(route.path, { waitUntil: "networkidle" });
          await page.waitForLoadState("domcontentloaded");

          // 3. Apply Theme
          await page.evaluate((themeMode) => {
            if (themeMode === "dark") {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }, theme);

          // 4. Wait for fonts (approximate check)
          await page.evaluate(() => document.fonts.ready);

          // 5. Visual Snapshot
          // Naming: [route]-[viewport]-[theme].png
          await expect(page).toHaveScreenshot(`${route.name}-${viewport.label}-${theme}.png`, {
            fullPage: true,
            animations: "disabled",
            timeout: 15000,
          });
        });
      }
    }
  }
});
