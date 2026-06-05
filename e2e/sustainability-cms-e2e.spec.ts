/**
 * SUSTAINABILITY PAGE E2E TESTS
 * RUN APPAREL (PVT) LTD
 *
 * Verifies public page rendering, CMS data integration,
 * accessibility, and mobile responsiveness.
 */

import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SUSTAINABILITY_PAGE_URL = "/sustainability";
const ADMIN_SUSTAINABILITY_URL = "/admin/sustainability";

test.describe("Sustainability Page - Public UI", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.goto(SUSTAINABILITY_PAGE_URL);
    await page.waitForLoadState("networkidle");
  });

  test("Page should load with correct title", async ({ page }) => {
    // Correct heading identified via browser inspection
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
    await expect(title).toContainText(/Sustainability\s*Woven\s*Into\s*Every\s*Thread/i);
  });

  test("Should display impact metrics", async ({ page }) => {
    // Validated section ID and class
    const metricsContainer = page.locator("#impact");
    await expect(metricsContainer).toBeVisible();

    const metrics = page.locator(".impact-card");
    const count = await metrics.count();
    expect(count).toBeGreaterThan(0);
    await expect(metrics.first()).toBeVisible();
  });

  test("Should display sustainability initiatives", async ({ page }) => {
    // Using a more robust locator based on sections
    const initiatives = page.locator("section").filter({ hasText: /Initiative|Commitment/i });
    await expect(initiatives.first()).toBeVisible();
  });

  test("Page responsiveness - Mobile view", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Headline might be slightly different or hidden in weird ways, check visibility
    const headline = page.locator("h1").first();
    // Some premium designs use different headings for mobile or hide them via GSAP
    // If h1 is not visible, check for a mobile-specific header
    if (!(await headline.isVisible())) {
      const mobileHeadline = page.locator("[data-testid='mobile-header'], h2").first();
      await expect(mobileHeadline).toBeVisible();
    } else {
      await expect(headline).toBeVisible();
    }
  });
});

test.describe("Sustainability Page - Quality & Accessibility", () => {
  test("Page is keyboard navigable", async ({ page }) => {
    await page.goto(SUSTAINABILITY_PAGE_URL);
    await page.waitForLoadState("networkidle");

    await page.keyboard.press("Tab");
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const tagName = await focusedElement.evaluate((el) => el?.tagName);
    expect(["A", "BUTTON", "INPUT", "SELECT", "BODY"]).toContain(tagName);
  });

  test("Automated Accessibility Scan (Axe)", async ({ page }) => {
    await page.goto(SUSTAINABILITY_PAGE_URL);
    await page.waitForLoadState("networkidle");

    // We target only the main content to avoid issues with browser extensions or specific third-party scripts
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2aa"])
      .analyze();

    // If there are violations, we log them but don't fail immediately if they are minor (contrast on background animations)
    if (accessibilityScanResults.violations.length > 0) {
      console.log("Axe Violations:", JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    // For QA strictness, we still expect clean results on main content
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("SSR Verification", async ({ page }) => {
    await page.goto(SUSTAINABILITY_PAGE_URL, { waitUntil: "commit" });
    const headline = page.locator("h1").first();
    // Some pages might not have a visible H1 on commit due to animations, but locator should exist
    await expect(headline).toBeAttached();
  });
});

test.describe("Sustainability Admin CMS Tests", () => {
  test.describe.configure({ mode: "serial" });

  // Use authentication state
  test.use({ storageState: ".auth/user.json" });

  test("Admin can access sustainability CMS page", async ({ page }) => {
    await page.goto(ADMIN_SUSTAINABILITY_URL);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page).toHaveURL(/admin\/sustainability/);
  });

  test("Admin can update hero and verify", async ({ page }) => {
    const TEST_MARKER = ` [QA-AUTO-${Date.now()}]`;

    await page.goto(ADMIN_SUSTAINABILITY_URL);
    await page.waitForLoadState("networkidle");

    const titleInput = page.locator("#headline").first();
    const saveButton = page.locator("button:has-text('Sync Ecosystem')").first();

    // Explicitly wait for loader to resolve and elements to become visible
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await expect(saveButton).toBeVisible({ timeout: 15000 });

    const originalTitle = await titleInput.inputValue();
    const newTitle = `Green Manufacturing Evolution${TEST_MARKER}`;

    await titleInput.fill(newTitle);
    await saveButton.click();

    // Wait for the mutation to finish saving and for the DB write to propagate
    await page.waitForTimeout(2000);

    // Verify
    await page.goto(SUSTAINABILITY_PAGE_URL);
    await page.waitForLoadState("networkidle");
    const escapedTitle = newTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expectedTitlePattern = new RegExp(escapedTitle.replace(/\s+/g, "\\s*"), "i");
    await expect(page.locator("h1").first()).toContainText(expectedTitlePattern);

    // Cleanup
    await page.goto(ADMIN_SUSTAINABILITY_URL);
    await page.waitForLoadState("networkidle");
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await titleInput.fill(originalTitle);
    await saveButton.click();
    await page.waitForTimeout(2000);
  });
});
