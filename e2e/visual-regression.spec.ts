/**
 * Playwright Visual Regression Test Suite (WP11)
 *
 * Covers key routes across Mobile, Tablet, and Desktop viewports in Light and Dark themes.
 * Standardized assertions: maxDiffPixelRatio: 0.02, threshold: 0.2, animations: "disabled", dynamic masking.
 *
 * Run with:
 *   npx playwright test e2e/visual-regression.spec.ts --project=visual
 */

import { expect, type Page, test } from "@playwright/test";

interface RouteConfig {
  path: string;
  name: string;
  isAdmin?: boolean;
}

const KEY_ROUTES: RouteConfig[] = [
  { path: "/", name: "Homepage" },
  { path: "/about", name: "About" },
  { path: "/technology", name: "Technology" },
  { path: "/sustainability", name: "Sustainability" },
  { path: "/fabrics", name: "Fabrics" },
  { path: "/categories", name: "Categories" },
  { path: "/contact", name: "Contact" },
  { path: "/admin/homepage", name: "Admin-Homepage", isAdmin: true },
];

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

const THEMES = ["light", "dark"] as const;

interface ConsoleLog {
  type: string;
  text: string;
  url: string;
}

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

async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
      html, body {
        scroll-behavior: auto !important;
      }
      .cursor-follower {
        display: none !important;
      }
    `,
  });
}

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((t) => {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, theme);
  await page.waitForTimeout(100);
}

async function waitForPageStability(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  try {
    await page.evaluate(() => document.fonts.ready);
  } catch (_e) {}
  await disableAnimations(page);
  await page.waitForTimeout(300);
}

test.describe("Visual Regression Test Suite (CI Gate)", () => {
  for (const route of KEY_ROUTES) {
    test.describe(`${route.name} (${route.path})`, () => {
      for (const [viewportName, viewport] of Object.entries(VIEWPORTS) as [
        keyof typeof VIEWPORTS,
        (typeof VIEWPORTS)[keyof typeof VIEWPORTS],
      ][]) {
        for (const theme of THEMES) {
          test(`${route.name} [${viewportName}] [${theme}]`, async ({ page }) => {
            const logs = captureConsoleLogs(page);

            await page.setViewportSize(viewport);
            await page.emulateMedia({ reducedMotion: "reduce" });

            const targetUrl = route.isAdmin
              ? `/api/auth/mock-login?returnTo=${encodeURIComponent(route.path)}`
              : route.path;

            const response = await page.goto(targetUrl, {
              waitUntil: "domcontentloaded",
              timeout: 30000,
            });
            expect(
              response?.status(),
              `Expected HTTP status < 500 when navigating to ${route.path}`,
            ).toBeLessThan(500);

            await waitForPageStability(page);
            await setTheme(page, theme);

            // Configure dynamic element masks to prevent flakiness in volatile regions
            const dynamicMaskLocators = [
              page.locator("canvas"),
              page.locator("video"),
              page.locator("model-viewer"),
              page.locator('[data-testid="hydration-status"]'),
              page.locator('[data-testid="dynamic-content"]'),
              page.locator(".stats-ticker"),
              page.locator('[data-visual-mask="true"]'),
              page.locator(".cursor-follower"),
            ];

            const screenshotSnapshotName = `${route.name.toLowerCase()}-${viewportName}-${theme}.png`;

            await expect(page).toHaveScreenshot(screenshotSnapshotName, {
              fullPage: true,
              animations: "disabled",
              maxDiffPixelRatio: 0.02,
              threshold: 0.2,
              mask: dynamicMaskLocators,
            });

            // Enforce hydration health
            const hydrationWarnings = checkHydrationWarnings(logs);
            expect(
              hydrationWarnings,
              `Hydration warnings detected on ${route.path} (${viewportName}, ${theme})`,
            ).toHaveLength(0);
          });
        }
      }
    });
  }
});
