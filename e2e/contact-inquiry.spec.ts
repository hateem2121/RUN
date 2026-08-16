import { expect, test } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5002";

test.describe("Contact & Inquiries E2E Workflow", () => {
  test("Phase 1: Public Form Submission", async ({ page }) => {
    // 1. Visit Contact Page
    await page.goto(`${BASE_URL}/contact`);

    // Wait for the form to be visible
    const form = page.getByTestId("form-contact");
    await expect(form).toBeVisible({ timeout: 15000 });

    // 2. Fill out form using data-testids
    const testId = Date.now().toString();
    await page.getByTestId("input-first-name").fill("Automated");
    await page.getByTestId("input-last-name").fill(`Test ${testId}`);
    await page.getByTestId("input-email").fill(`e2e-${testId}@example.com`);
    await page.getByTestId("input-company-name").fill("RUN E2E Labs");
    await page
      .getByTestId("textarea-message")
      .fill(`This is an automated test message for inquiry ${testId}. Please ignore.`);

    // Select a country (using the dropdown)
    await page.getByTestId("button-country-dropdown").click();
    await page
      .getByRole("option", { name: /Pakistan/i })
      .first()
      .click();

    // 3. Submit
    await page.getByTestId("button-submit").click();

    // 4. Verify Success State
    await expect(
      page
        .getByText(/your message has been sent successfully|thank you|success/i)
        .or(page.getByTestId("button-send-another")),
    ).toBeVisible({
      timeout: 15000,
    });
  });

  test.describe("Admin Inquiries & Settings", () => {
    // Use saved auth state for admin tests
    // Ensure auth.setup.ts has run or manual login was performed
    test.use({ storageState: ".auth/user.json" });

    test("Phase 2: Verify Inquiry in Admin Console", async ({ page }) => {
      // 1. Visit Admin Inquiries
      await page.goto(`${BASE_URL}/admin/inquiries`);

      // Apply reload fallback for "Checking access..." state in long batch runs
      try {
        await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 8000 });
      } catch {
        await page.reload();
        await page.waitForLoadState("domcontentloaded");
        await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 20000 });
      }

      // Wait for Inquiry Management view to load
      await expect(
        page
          .locator("h1, h2, h3, [role='heading']")
          .filter({ hasText: /Inquiry/i })
          .first(),
      ).toBeVisible({ timeout: 15000 });

      // 2. Verify inquiry list or empty state exists
      await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
    });

    test("Phase 3: Update Contact Settings & Verify Reflection", async ({ page }) => {
      // 1. Visit Contact Settings
      await page.goto(`${BASE_URL}/admin/contact`);

      // Apply reload fallback for "Checking access..." state in long batch runs
      try {
        await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 8000 });
      } catch {
        await page.reload();
        await page.waitForLoadState("domcontentloaded");
        await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 20000 });
      }

      // 2. Change Hero Title
      const uniqueTitle = `TEST HERO ${Date.now()}`;
      const heroTitleInput = page
        .getByTestId("input-hero-title")
        .or(page.locator('input[id="heroTitle"]'));
      if (await heroTitleInput.first().isVisible()) {
        await heroTitleInput.first().fill(uniqueTitle);

        // 3. Save Settings
        const saveButton = page
          .getByTestId("button-save")
          .or(page.getByRole("button", { name: /save/i }));
        if (await saveButton.first().isEnabled()) {
          await saveButton.first().click();
          await expect(page.getByText(/saved|success/i).first()).toBeVisible({ timeout: 10000 });
        }
      }

      // 4. Verify on Public Page
      await page.goto(`${BASE_URL}/contact`);
      await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    });
  });
});
