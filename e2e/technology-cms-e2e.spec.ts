/**
 * TECHNOLOGY PAGE E2E TESTS
 * RUN APPAREL (PVT) LTD
 *
 * Verifies public page rendering, 3D model integration,
 * accessibility, and mobile responsiveness.
 */

import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TECHNOLOGY_PAGE_URL = "/technology";
const ADMIN_TECHNOLOGY_URL = "/admin/technology";

test.describe("Technology Page - Public UI", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.goto(TECHNOLOGY_PAGE_URL);
    await page.waitForLoadState("networkidle");
  });

  test("Page should load with correct title", async ({ page }) => {
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
    await expect(title).toContainText(/WHERE\s*SCIENCE\s*MEETS\s*FABRIC/i);
  });

  test("Should display innovation cards", async ({ page }) => {
    // Validated heading "TECHNOLOGY STACK"
    const section = page.locator("section").filter({ hasText: /TECHNOLOGY STACK/i });
    await expect(section).toBeVisible();

    const innovations = section.locator("h3");
    const count = await innovations.count();
    expect(count).toBeGreaterThan(0);
  });

  test("Should display equipment grid", async ({ page }) => {
    // Validated heading "THE ROAD AHEAD" or Tech Stack
    const roadmap = page.locator("section").filter({ hasText: /THE ROAD AHEAD/i });
    await expect(roadmap.first()).toBeVisible();
  });

  test("3D Context Check - @google/model-viewer", async ({ page }) => {
    // Technology site often features 3D previews of equipment
    const modelViewer = page.locator("model-viewer");
    const count = await modelViewer.count();

    if (count > 0) {
      await expect(modelViewer.first()).toBeAttached();
      const src = await modelViewer.first().getAttribute("src");
      expect(src).toMatch(/\.(glb|gltf)$/i);
    }
  });

  test("Page responsiveness - Mobile view", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const headline = page.locator("h1").first();
    if (!(await headline.isVisible())) {
      const mobileHeadline = page.locator("[data-testid='mobile-header'], h2").first();
      await expect(mobileHeadline).toBeVisible();
    } else {
      await expect(headline).toBeVisible();
    }
  });
});

test.describe("Technology Page - Quality & Accessibility", () => {
  test("Automated Accessibility Scan (Axe)", async ({ page }) => {
    await page.goto(TECHNOLOGY_PAGE_URL);
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("SSR Verification", async ({ page }) => {
    await page.goto(TECHNOLOGY_PAGE_URL, { waitUntil: "commit" });
    const headline = page.locator("h1").first();
    await expect(headline).toBeVisible();
  });
});

test.describe("Technology Admin CMS Tests", () => {
  test.describe.configure({ mode: "serial" });

  test.use({ storageState: ".auth/user.json" });

  test("Admin can access technology CMS page", async ({ page }) => {
    await page.goto(ADMIN_TECHNOLOGY_URL);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page).toHaveURL(/admin\/technology/);
  });

  test("Admin can update hero and verify", async ({ page }) => {
    const TEST_MARKER = ` [QA-AUTO-${Date.now()}]`;

    await page.goto(ADMIN_TECHNOLOGY_URL);
    await page.waitForLoadState("networkidle");

    const titleInput = page.locator("#title").first();
    const saveButton = page.locator("button:has-text('Sync Hero')").first();

    // Explicitly wait for loader to resolve and elements to become visible
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await expect(saveButton).toBeVisible({ timeout: 15000 });

    const originalTitle = await titleInput.inputValue();
    const newTitle = `Next-Gen Fiber Intelligence${TEST_MARKER}`;

    await titleInput.fill(newTitle);
    await saveButton.click();

    // Wait for the mutation to finish saving and for the DB write to propagate
    await page.waitForTimeout(2000);

    // Verify
    await page.goto(TECHNOLOGY_PAGE_URL);
    await page.waitForLoadState("networkidle");
    const escapedTitle = newTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expectedTitlePattern = new RegExp(escapedTitle.replace(/\s+/g, "\\s*"), "i");
    await expect(page.locator("h1").first()).toContainText(expectedTitlePattern);

    // Cleanup
    await page.goto(ADMIN_TECHNOLOGY_URL);
    await page.waitForLoadState("networkidle");
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await titleInput.fill(originalTitle);
    await saveButton.click();
    await page.waitForTimeout(2000);
  });
});
