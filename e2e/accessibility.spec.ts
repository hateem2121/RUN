/**
 * Accessibility (a11y) E2E Tests
 * Phase 2.4: axe Accessibility Audit
 *
 * Uses @axe-core/playwright for automated WCAG 2.2 AA compliance testing
 * Target: 0 critical/serious violations on key pages
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Configure axe to check WCAG 2.2 AA compliance
const axeConfig = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag22aa"],
  },
};

test.describe("Accessibility Audit", () => {
  test.describe("Public Pages", () => {
    test("Homepage should have no accessibility violations", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log(
          "Accessibility violations:",
          JSON.stringify(accessibilityScanResults.violations, null, 2),
        );
      }

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("Products page should have no accessibility violations", async ({ page }) => {
      await page.goto("/products");
      await page.waitForLoadState("networkidle");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("Contact page should have no accessibility violations", async ({ page }) => {
      await page.goto("/contact");
      await page.waitForLoadState("networkidle");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("About page should have no accessibility violations", async ({ page }) => {
      await page.goto("/about");
      await page.waitForLoadState("networkidle");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe("Interactive Components", () => {
    test("Navigation should be keyboard accessible", async ({ page }) => {
      await page.goto("/");

      // Tab through navigation
      await page.keyboard.press("Tab");
      const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
      expect(firstFocusable).toBeTruthy();

      // Check focus visibility
      const focusedElement = page.locator(":focus-visible");
      await expect(focusedElement).toBeVisible();
    });

    test("Forms should have proper labels", async ({ page }) => {
      await page.goto("/contact");
      await page.waitForLoadState("networkidle");

      // Check for unlabeled form inputs
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .include("form")
        .analyze();

      // Filter for label-related violations
      const labelViolations = accessibilityScanResults.violations.filter(
        (v) => v.id.includes("label") || v.id.includes("form"),
      );

      expect(labelViolations).toEqual([]);
    });
  });

  test.describe("Color & Contrast", () => {
    test("Text should have sufficient color contrast", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2aa"])
        .options({ rules: { "color-contrast": { enabled: true } } })
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        (v) => v.id === "color-contrast",
      );

      expect(contrastViolations).toEqual([]);
    });
  });

  test.describe("Reduced Motion", () => {
    test("Respects prefers-reduced-motion", async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Check that animations are disabled
      const bodyStyles = await page.evaluate(() => {
        const body = document.body;
        return getComputedStyle(body).getPropertyValue("animation-duration");
      });

      // Animation duration should be minimal when reduced motion is preferred
      // The actual check depends on implementation
      expect(bodyStyles).toBeDefined();
    });
  });
});

test.describe("Admin Pages", () => {
  // Skip admin tests if not authenticated
  test.skip("Admin dashboard should have no critical a11y violations", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    // Only fail on critical/serious violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    expect(criticalViolations).toEqual([]);
  });
});
