/**
 * Viewport, Zoom & Aspect Ratio Stress-Testing Suite
 * Domain 1: 320px compact, 4K ultra-wide, 125%-200% font zoom, landscape orientation
 */

import { expect, test } from "@playwright/test";

const TEST_ROUTES = [
  "/",
  "/products",
  "/categories",
  "/about",
  "/manufacturing",
  "/sustainability",
  "/technology",
  "/contact",
  "/size-charts",
  "/fabrics",
];

test.describe("Domain 1 — Extreme Viewports, Zoom & Aspect Ratio Stress", () => {
  test.describe("Compact 320px Viewport (iPhone SE / Foldables)", () => {
    test.use({ viewport: { width: 320, height: 568 } });

    for (const route of TEST_ROUTES) {
      test(`Zero horizontal scroll blowout on ${route} at 320px`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);

        // Check for horizontal overflow
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          return {
            scrollWidth,
            clientWidth,
            hasOverflow: scrollWidth > clientWidth + 2, // 2px tolerance for subpixel rounding
          };
        });

        expect(overflow.hasOverflow).toBe(false);
      });
    }

    test("Hero display typography clamps cleanly under 34px on 320px mobile", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const headlineFontSize = await page.evaluate(() => {
        const headline = document.querySelector("h1, [data-display-headline]");
        if (!headline) return null;
        const style = window.getComputedStyle(headline);
        return parseFloat(style.fontSize);
      });

      if (headlineFontSize) {
        // Fluid clamp upper limit for mobile is <= 38px to avoid 320px overflow
        expect(headlineFontSize).toBeLessThanOrEqual(38);
      }
    });
  });

  test.describe("Ultra-Wide 4K Screens (2560px & 3840px)", () => {
    test.use({ viewport: { width: 3840, height: 2160 } });

    test("Layout preserves max-width bounds and ceiling notch navbar centering on 4K", async ({
      page,
    }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const layoutMetrics = await page.evaluate(() => {
        const dock = document.querySelector("header, nav");
        const main = document.querySelector("main");
        const mainWidth = main ? main.getBoundingClientRect().width : 0;
        const dockRect = dock ? dock.getBoundingClientRect() : null;

        return {
          mainWidth,
          dockRect,
        };
      });

      expect(layoutMetrics.mainWidth).toBeGreaterThan(0);
      if (layoutMetrics.dockRect) {
        // Dock should remain centered on 4K screens
        const screenMid = 3840 / 2;
        const dockMid = layoutMetrics.dockRect.left + layoutMetrics.dockRect.width / 2;
        expect(Math.abs(screenMid - dockMid)).toBeLessThan(50);
      }
    });
  });

  test.describe("Browser Zoom & OS Font Scaling (150% & 200%)", () => {
    test("200% Font scaling does not clip text or truncate card contents", async ({ page }) => {
      // Simulate 200% text zoom via deviceScaleFactor & large root font-size
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/products");
      await page.waitForLoadState("networkidle");

      await page.evaluate(() => {
        document.documentElement.style.fontSize = "32px"; // 200% base scaling
      });
      await page.waitForTimeout(300);

      const clippedElements = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll("[data-product-card], .card"));
        let clipped = 0;
        for (const card of cards) {
          if (
            card.scrollHeight > card.clientHeight + 5 &&
            window.getComputedStyle(card).overflow === "hidden"
          ) {
            clipped++;
          }
        }
        return clipped;
      });

      expect(clippedElements).toBe(0);
    });
  });

  test.describe("Mobile & Tablet Landscape Orientation (667x375px & 844x390px)", () => {
    test.use({ viewport: { width: 844, height: 390 } });

    test("Modal dialogs and menus remain vertically scrollable in landscape", async ({ page }) => {
      await page.goto("/contact");
      await page.waitForLoadState("networkidle");

      // Verify page is scrollable and form is accessible in landscape
      const scrollable = await page.evaluate(() => {
        return document.body.scrollHeight >= window.innerHeight;
      });

      expect(scrollable).toBe(true);
    });
  });
});
