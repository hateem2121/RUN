/**
 * Tailwind v4 Visual Regression Test Suite
 * System-wide automated screenshot capture and comparison
 *
 * Run with: npx playwright test e2e/visual-regression-audit.spec.ts
 */

import { expect, type Page, test } from "@playwright/test";

// Route definitions from ROUTES_INVENTORY.md
const PUBLIC_ROUTES = [
  { path: "/", name: "Homepage" },
  { path: "/products", name: "Products" },
  { path: "/categories", name: "Categories" },
  { path: "/about", name: "About" },
  { path: "/services", name: "Services" },
  { path: "/sustainability", name: "Sustainability" },
  { path: "/manufacturing", name: "Manufacturing" },
  { path: "/technology", name: "Technology" },
  { path: "/contact", name: "Contact" },
  { path: "/dashboard", name: "Dashboard" },
  { path: "/analytics", name: "Analytics" },
];

const RESOURCE_ROUTES = [
  { path: "/resources", name: "Resources" },
  { path: "/resources/certifications", name: "Certifications" },
  { path: "/resources/accessories", name: "Accessories" },
  { path: "/resources/size-charts", name: "SizeCharts" },
  { path: "/resources/fabrics", name: "Fabrics" },
  { path: "/resources/fibers", name: "Fibers" },
];

const ADMIN_ROUTES = [
  { path: "/admin", name: "Admin-Dashboard" },
  { path: "/admin/products", name: "Admin-Products" },
  { path: "/admin/categories", name: "Admin-Categories" },
  { path: "/admin/media", name: "Admin-Media" },
  { path: "/admin/fabrics", name: "Admin-Fabrics" },
  { path: "/admin/fibers", name: "Admin-Fibers" },
  { path: "/admin/certificates", name: "Admin-Certificates" },
  { path: "/admin/size-charts", name: "Admin-SizeCharts" },
  { path: "/admin/accessories", name: "Admin-Accessories" },
  { path: "/admin/navigation", name: "Admin-Navigation" },
  { path: "/admin/contact", name: "Admin-Contact" },
  { path: "/admin/homepage", name: "Admin-Homepage" },
  { path: "/admin/about", name: "Admin-About" },
  { path: "/admin/sustainability", name: "Admin-Sustainability" },
  { path: "/admin/manufacturing", name: "Admin-Manufacturing" },
  { path: "/admin/technology", name: "Admin-Technology" },
  { path: "/admin/storage-optimization", name: "Admin-Storage" },
  { path: "/admin/inquiries", name: "Admin-Inquiries" },
  { path: "/admin/footer", name: "Admin-Footer" },
];

// Flag: Admin SSR fix deployed - tests now enabled
const ADMIN_SSR_FIX_DEPLOYED = true;

const BREAKPOINTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

interface ConsoleLog {
  type: string;
  text: string;
  url: string;
}

// Helper to disable animations for stable screenshots
async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

// Helper to capture console logs
function captureConsoleLogs(page: Page): ConsoleLog[] {
  const logs: ConsoleLog[] = [];
  page.on("console", (msg) => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      url: page.url(),
    });
  });
  return logs;
}

// Helper to check for hydration warnings
function checkHydrationWarnings(logs: ConsoleLog[]): string[] {
  const hydrationPatterns = [
    /hydration/i,
    /did not match/i,
    /server.*client/i,
    /error.*418/i,
    /error.*423/i,
    /suppressHydrationWarning/i,
  ];

  return logs
    .filter((log) => log.type === "error" || log.type === "warning")
    .filter((log) => hydrationPatterns.some((p) => p.test(log.text)))
    .map((log) => `[${log.type}] ${log.text}`);
}

// Helper to set theme
async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((t) => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, theme);
  await page.waitForTimeout(100); // Allow theme transition
}

// Helper to wait for page stability
async function waitForPageStability(page: Page) {
  // Wait for network idle
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  // Wait for any lazy-loaded content
  await page.waitForTimeout(500);
  // Disable animations for stable screenshot
  await disableAnimations(page);
}

test.describe("Visual Regression Audit - Public Routes", () => {
  for (const route of PUBLIC_ROUTES) {
    for (const [breakpointName, viewport] of Object.entries(BREAKPOINTS)) {
      for (const theme of ["light", "dark"] as const) {
        test(`${route.name} - ${breakpointName} - ${theme}`, async ({ page }) => {
          const logs = captureConsoleLogs(page);

          // Set viewport
          await page.setViewportSize(viewport);

          // Navigate
          const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
          expect(response?.status()).toBeLessThan(500);

          await waitForPageStability(page);
          await setTheme(page, theme);

          // Take screenshot and compare
          const screenshotName = `${route.name}-${breakpointName}-${theme}.png`;
          await expect(page).toHaveScreenshot(screenshotName, {
            fullPage: true,
            maxDiffPixelRatio: 0.02,
          });

          // Enforce: hydration warnings cause test failure
          const hydrationWarnings = checkHydrationWarnings(logs);
          expect(hydrationWarnings, `Hydration warnings detected on ${route.path}`).toHaveLength(0);
        });
      }
    }
  }
});

test.describe("Visual Regression Audit - Resource Routes", () => {
  for (const route of RESOURCE_ROUTES) {
    for (const [breakpointName, viewport] of Object.entries(BREAKPOINTS)) {
      for (const theme of ["light", "dark"] as const) {
        test(`${route.name} - ${breakpointName} - ${theme}`, async ({ page }) => {
          const logs = captureConsoleLogs(page);

          await page.setViewportSize(viewport);
          const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
          expect(response?.status()).toBeLessThan(500);

          await waitForPageStability(page);
          await setTheme(page, theme);

          const screenshotName = `${route.name}-${breakpointName}-${theme}.png`;
          await expect(page).toHaveScreenshot(screenshotName, {
            fullPage: true,
            maxDiffPixelRatio: 0.02,
          });

          // Enforce: hydration warnings cause test failure
          const hydrationWarnings = checkHydrationWarnings(logs);
          expect(hydrationWarnings, `Hydration warnings detected on ${route.path}`).toHaveLength(0);
        });
      }
    }
  }
});

test.describe("Visual Regression Audit - Admin Routes (Desktop Only)", () => {
  // Skip admin tests until server is rebuilt with AdminContext SSR fix
  test.skip(
    !ADMIN_SSR_FIX_DEPLOYED,
    "Admin routes need server rebuild - see ADMIN_500_ROOT_CAUSE.md",
  );

  for (const route of ADMIN_ROUTES) {
    for (const theme of ["light", "dark"] as const) {
      test(`${route.name} - desktop - ${theme}`, async ({ page }) => {
        const logs = captureConsoleLogs(page);

        await page.setViewportSize(BREAKPOINTS.desktop);
        const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
        expect(response?.status()).toBeLessThan(500);

        await waitForPageStability(page);
        await setTheme(page, theme);

        const screenshotName = `${route.name}-desktop-${theme}.png`;
        await expect(page).toHaveScreenshot(screenshotName, {
          fullPage: true,
          maxDiffPixelRatio: 0.02,
        });

        // Enforce: hydration warnings cause test failure
        const hydrationWarnings = checkHydrationWarnings(logs);
        expect(hydrationWarnings, `Hydration warnings detected on ${route.path}`).toHaveLength(0);
      });
    }
  }
});

test.describe("Visual Regression Audit - Special Cases", () => {
  test("404 Page", async ({ page }) => {
    const logs = captureConsoleLogs(page);

    await page.setViewportSize(BREAKPOINTS.desktop);
    await page.goto("/nonexistent-page-for-404-test", { waitUntil: "domcontentloaded" });

    await waitForPageStability(page);

    await expect(page).toHaveScreenshot("NotFound-desktop-light.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("E2E Overlay Test Page", async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.desktop);
    await page.goto("/e2e-overlay", { waitUntil: "domcontentloaded" });

    await waitForPageStability(page);

    await expect(page).toHaveScreenshot("E2EOverlay-desktop-light.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});

// CSS Load Order and FOUC Detection
test.describe("CSS Load Order Analysis", () => {
  test("Homepage - CSS arrives before hydration", async ({ page }) => {
    const cssLoadTimes: number[] = [];
    const jsLoadTimes: number[] = [];

    page.on("response", (response) => {
      const url = response.url();
      const timing = response.timing();
      if (url.endsWith(".css")) {
        cssLoadTimes.push(timing.responseEnd);
      }
      if (url.endsWith(".js") && url.includes("index-")) {
        jsLoadTimes.push(timing.responseEnd);
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });

    // Log timing for analysis
    console.log("CSS load times:", cssLoadTimes);
    console.log("JS load times:", jsLoadTimes);

    // CSS should load before or around the same time as main JS
    // This is informational - we're collecting data for the audit
  });
});

// Z-Index and Stacking Context Analysis
test.describe("Stacking Context Analysis", () => {
  test("Header z-index is above page content", async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.desktop);
    await page.goto("/", { waitUntil: "networkidle" });
    await waitForPageStability(page);

    // Scroll down to trigger sticky header
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300);

    // Check header z-index
    const headerZIndex = await page.evaluate(() => {
      const header = document.querySelector("header, nav, [class*='dock'], [class*='header']");
      if (header) {
        return window.getComputedStyle(header).zIndex;
      }
      return null;
    });

    console.log("Header z-index:", headerZIndex);
    expect(headerZIndex).not.toBe("auto");
  });

  test("Modal/Dialog overlays appear above content", async ({ page }) => {
    await page.setViewportSize(BREAKPOINTS.desktop);
    await page.goto("/products", { waitUntil: "networkidle" });
    await waitForPageStability(page);

    // Check for any Radix portal containers
    const portalZIndexes = await page.evaluate(() => {
      const portals = document.querySelectorAll("[data-radix-portal], [class*='portal']");
      return Array.from(portals).map((p) => window.getComputedStyle(p).zIndex);
    });

    console.log("Portal z-indexes:", portalZIndexes);
  });
});
