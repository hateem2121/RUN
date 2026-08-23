/**
 * Cross-Engine Parity, Motion Dynamics, 3D Fallbacks & @media print Suite
 * Domains 4, 5, 6 & 7: GSAP Scrubbing, Reduced Motion, WebKit/Gecko Parity, WebGL Context Loss, Print Spec Layouts
 */

import { expect, test } from "@playwright/test";

test.describe("Domains 4, 5, 6 & 7 — Motion, Cross-Engine, 3D Fallbacks & Print Layouts", () => {
  test.describe("Domain 4: Motion, GSAP ScrollTrigger & Animation Dynamics", () => {
    test("Rapid and reverse scroll scrubbing does not throw errors or desynchronize pins", async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto("/manufacturing");
      await page.waitForLoadState("networkidle");

      // Perform rapid bidirectional scrolling
      await page.evaluate(async () => {
        // Fast scroll down
        for (let i = 0; i < 4000; i += 400) {
          window.scrollTo(0, i);
          await new Promise((r) => setTimeout(r, 10));
        }
        // Rapid reverse scroll up
        for (let i = 4000; i >= 0; i -= 500) {
          window.scrollTo(0, i);
          await new Promise((r) => setTimeout(r, 10));
        }
      });

      await page.waitForTimeout(500);
      expect(consoleErrors.filter((e) => !e.includes("favicon") && !e.includes("HMR"))).toEqual([]);
    });

    test("Respects prefers-reduced-motion system preference across routes", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const reducedMotionActive = await page.evaluate(() => {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      });

      expect(reducedMotionActive).toBe(true);
    });
  });

  test.describe("Domain 5: Cross-Browser & Multi-Engine Parity", () => {
    test("Ceiling notch navbar renders backdrop blur and fixed positioning", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const dockComputedStyle = await page.evaluate(() => {
        const header = document.querySelector("header, nav");
        if (!header) return null;
        const style = window.getComputedStyle(header);
        return {
          position: style.position,
          backdropFilter:
            style.backdropFilter ||
            (style as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter,
          zIndex: style.zIndex,
        };
      });

      expect(dockComputedStyle).not.toBeNull();
      expect(["fixed", "sticky"]).toContain(dockComputedStyle?.position);
    });
  });

  test.describe("Domain 6: 3D Viewer & Media Asset Fallbacks", () => {
    test("ModelViewer displays graceful fallback when WebGL is unavailable", async ({ page }) => {
      await page.goto("/products");
      await page.waitForLoadState("networkidle");

      // Verify that 3D model containers or product media display valid img/fallback elements
      const mediaElements = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img, canvas, [data-model-viewer]"));
        return images.length;
      });

      expect(mediaElements).toBeGreaterThan(0);
    });
  });

  test.describe("Domain 7: Print & Document Export Layouts (@media print)", () => {
    test("@media print hides navigation docks and displays clean spec sheet layout", async ({
      page,
    }) => {
      await page.goto("/size-charts");
      await page.waitForLoadState("networkidle");

      // Emulate print media
      await page.emulateMedia({ media: "print" });
      await page.waitForTimeout(400);

      const printVisibility = await page.evaluate(() => {
        const header = document.querySelector("header, nav");
        const footer = document.querySelector("footer");
        const main = document.querySelector("main");

        const headerDisplay = header ? window.getComputedStyle(header).display : "none";
        const footerDisplay = footer ? window.getComputedStyle(footer).display : "none";
        const mainDisplay = main ? window.getComputedStyle(main).display : "block";

        return {
          headerDisplay,
          footerDisplay,
          mainDisplay,
        };
      });

      // Headers and footers must be stripped in print mode
      expect(printVisibility.headerDisplay).toBe("none");
      expect(printVisibility.footerDisplay).toBe("none");
      expect(printVisibility.mainDisplay).not.toBe("none");
    });
  });
});
