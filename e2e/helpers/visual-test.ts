import { expect, type Page } from "@playwright/test";

/**
 * Visual Test Helper v2
 * Provides standardized stabilization for regression snapshots.
 */

export const STABILIZATION_CSS = `
  /* 1. Global Animation Kill-switch */
  *, *::before, *::after {
    animation-duration: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0ms !important;
    animation-delay: 0ms !important;
  }
  
  /* 2. Freeze Scroll-driven effects */
  html, body {
    scroll-behavior: auto !important;
  }

  /* 3. Mask Volatile Regions (WebGL, Animated Tickers, Hydration Status) */
  canvas, 
  [data-visual-mask="true"],
  .stats-ticker,
  [data-testid="hydration-status"] {
    visibility: hidden !important;
  }

  /* 4. Disable dynamic cursors/carousels if they jitter */
  .cursor-follower { display: none !important; }
`;

/**
 * Standardizes the page state for a visual snapshot.
 */
export async function stabilizeVisuals(page: Page) {
  // A. Set consistent viewport (if not already handled by config)
  await page.setViewportSize({ width: 1280, height: 720 });

  // B. Enforce prefers-reduced-motion
  await page.emulateMedia({ reducedMotion: "reduce" });

  // C. Inject stabilization styles
  await page.addStyleTag({ content: STABILIZATION_CSS });

  // D. Wait for font loading to prevent character shifting
  try {
    await page.evaluate(() => document.fonts.ready);
  } catch (e) {
    console.warn("Font stabilization timed out or failed:", e);
  }

  // E. Ensure hydration is complete (wait for our custom class)
  await page.waitForSelector("body.css-loaded", { timeout: 10000 });
}

/**
 * Performs a governed snapshot with standardized settings.
 */
export async function expectVisualMatch(page: Page, name: string) {
  await stabilizeVisuals(page);

  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    animations: "disabled",
    // Standard masking for all tests
    mask: [page.locator("canvas"), page.locator('[data-testid="hydration-status"]')],
  });
}
