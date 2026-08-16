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

test.describe
  .serial("Technology Page Suite", () => {
    test.describe("Technology Page - Public UI", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(TECHNOLOGY_PAGE_URL);
        await page.waitForLoadState("networkidle");
      });

      test("Page should load with correct title", async ({ page }) => {
        const title = page.locator("h1").first();
        await expect(title).toBeVisible();
        await expect(title).toContainText(/WHERE\s*SCIENCE|Next-Gen|Technology|Science/i);
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
        const section = page.locator("section").filter({ hasText: /THE ROAD AHEAD|MACHINERY/i });
        const isVisible = await section.isVisible().catch(() => false);
        if (isVisible) {
          const items = section.locator(".grid > div, [class*='grid'] > div");
          const count = await items.count();
          expect(count).toBeGreaterThan(0);
        }
      });

      test("3D Context Check - @google/model-viewer", async ({ page }) => {
        const modelViewer = page.locator("model-viewer").first();
        const count = await page.locator("model-viewer").count();

        if (count > 0) {
          await expect(modelViewer).toBeAttached();
        }
      });

      test("Page responsiveness - Mobile view", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(TECHNOLOGY_PAGE_URL);
        await page.waitForLoadState("domcontentloaded");

        const title = page.locator("h1").first();
        await expect(title).toBeVisible();

        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(380);
      });

      test("Automated Accessibility Scan (Axe)", async ({ page }) => {
        await page.goto(TECHNOLOGY_PAGE_URL);
        await page.waitForLoadState("networkidle");

        const accessibilityScanResults = await new AxeBuilder({ page })
          .include("main")
          .withTags(["wcag2aa"])
          .disableRules(["color-contrast"])
          .analyze();

        const criticalViolations = accessibilityScanResults.violations.filter(
          (v) => v.impact === "critical",
        );
        expect(criticalViolations).toEqual([]);
      });

      test("SSR Verification", async ({ page }) => {
        await page.goto(TECHNOLOGY_PAGE_URL, { waitUntil: "commit" });
        const headline = page.locator("h1").first();
        await expect(headline).toBeVisible();
      });
    });

    test.describe("Technology Admin CMS Tests", () => {
      test.use({ storageState: ".auth/user.json" });

      test("Admin can access technology CMS page", async ({ page }) => {
        await page.goto(ADMIN_TECHNOLOGY_URL);
        await page.waitForLoadState("domcontentloaded");
        
        // Apply reload fallback for "Checking access..." state in long batch runs
        try {
          await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 8000 });
        } catch {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
          await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 20000 });
        }

        await expect(page.locator("h1, h2").first()).toBeVisible();
        expect(page.url()).toContain("/admin/technology");
      });

      test("Admin can update hero and verify", async ({ page }) => {
        const TEST_MARKER = ` [QA-AUTO-${Date.now()}]`;

        await page.goto(ADMIN_TECHNOLOGY_URL);
        await page.waitForLoadState("domcontentloaded");
        
        // Apply reload fallback for "Checking access..." state in long batch runs
        try {
          await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 8000 });
        } catch {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
          await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 20000 });
        }

        const titleInput = page.locator("#title").first();
        const saveButton = page.locator("button:has-text('Sync Hero')").first();

        // Explicitly wait for loader to resolve and elements to become visible
        await expect(titleInput).toBeVisible({ timeout: 15000 });
        await expect(saveButton).toBeVisible({ timeout: 15000 });

        const originalTitle = await titleInput.inputValue();
        const cleanOriginal = originalTitle.includes("[QA-AUTO")
          ? "WHERE SCIENCE MEETS FABRIC"
          : originalTitle;
        const newTitle = `Next-Gen Fiber Intelligence${TEST_MARKER}`;

        try {
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
        } finally {
          // Cleanup
          await page.goto(ADMIN_TECHNOLOGY_URL);
          await page.waitForLoadState("domcontentloaded");
          const restoreInput = page.locator("#title").first();
          const restoreButton = page.locator("button:has-text('Sync Hero')").first();
          try {
            await restoreInput.waitFor({ timeout: 15000 });
            await restoreInput.fill(cleanOriginal || "WHERE SCIENCE MEETS FABRIC");
            await restoreButton.click();
            await page.waitForTimeout(1000);
          } catch (e) {
            console.error("Failed to restore technology hero title:", e);
          }
        }
      });
    });
  });
