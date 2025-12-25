import { expect, test } from "@playwright/test";

const ROUTES = [
  // Core Pages
  "/",
  "/products",
  "/categories",
  "/about",
  "/services",
  "/sustainability",
  "/manufacturing",
  "/technology",
  "/contact",

  // Dashboard & Analytics (Auth Gate checks)
  "/dashboard",
  "/analytics",

  // Resources Section
  "/resources",
  "/resources/certifications",
  "/resources/accessories",
  "/resources/size-charts",
  "/resources/fabrics",
  "/resources/fibers",

  // Admin Entry (Login UI)
  "/admin",

  // Error State
  "/404-test-page",
];

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 1200 }, // Taller for more visibility
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 375, height: 800 },
];

test.describe("Forensic UI Audit", () => {
  // Disable animations and normalize environment
  test.beforeEach(async ({ page }) => {
    // Inject forensic CSS to stabilize the render
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
          caret-color: transparent !important;
        }
        /* Hide scrollbars to prevent rendering diffs across OS/Browsers */
        ::-webkit-scrollbar {
            display: none;
        }
        /* Force single frame for infinite animations if possible */
        [class*="animate-"] {
            animation-play-state: paused !important;
        }
      `,
    });
  });

  for (const route of ROUTES) {
    test.describe(route, () => {
      for (const viewport of VIEWPORTS) {
        test(`${viewport.name} - Light Mode`, async ({ page }) => {
          test.setTimeout(60000); // 1 min timeout per snapshot to allow for strict mode/hydration slowness
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });

          const response = await page.goto(route, { waitUntil: "commit" });
          if (response?.status() === 404 && route !== "/404-test-page") {
          }

          // Hybrid wait strategy: Network idle + time buffer for hydration
          try {
            await page.waitForLoadState("networkidle", { timeout: 10000 });
          } catch (e) {
            // Ignore timeout, proceed with snapshot (sometimes streams stick open)
          }
          await page.waitForTimeout(1500); // Allow LayoutEffects to settle

          await expect(page).toHaveScreenshot(
            `${route.replace(/\//g, "-").replace(/^-/, "") || "home"}-${viewport.name}-light.png`,
            {
              fullPage: true,
              maxDiffPixelRatio: 0.02, // Slightly looser for cross-render engine tiny diffs
              animations: "disabled",
            },
          );
        });

        test(`${viewport.name} - Dark Mode`, async ({ page }) => {
          test.setTimeout(60000);
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });
          await page.goto(route, { waitUntil: "commit" });

          // Force Dark Mode via class AND local storage if needed
          await page.evaluate(() => {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
          });

          // Hybrid wait
          try {
            await page.waitForLoadState("networkidle", { timeout: 10000 });
          } catch (e) {}
          await page.waitForTimeout(1500);

          await expect(page).toHaveScreenshot(
            `${route.replace(/\//g, "-").replace(/^-/, "") || "home"}-${viewport.name}-dark.png`,
            {
              fullPage: true,
              maxDiffPixelRatio: 0.02,
              animations: "disabled",
            },
          );
        });
      }
    });
  }
});
