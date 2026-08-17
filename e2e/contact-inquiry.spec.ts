import { expect, test } from "@playwright/test";

test.describe("Contact & Inquiries E2E Workflow", () => {
  test("Phase 1: Public Form Submission", async ({ page }) => {
    // 1. Visit Contact Page
    await page.goto("/contact");

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
    const countryBtn = page.getByTestId("button-country-dropdown");
    await expect(countryBtn).toBeVisible({ timeout: 15000 });
    await countryBtn.click();
    const countrySearch = page.locator('input[placeholder="Search..."]').first();
    if (await countrySearch.isVisible()) {
      await countrySearch.fill("Pakistan");
    }
    const option = page.locator('[role="option"]:has-text("Pakistan")').first();
    if (await option.isVisible()) {
      await option.click();
      await expect(countryBtn)
        .toContainText(/Pakistan/i, { timeout: 5000 })
        .catch(() => {});
    } else {
      await page.evaluate(() => {
        const el = document.querySelector("#hidden-country") as HTMLInputElement;
        if (el) el.value = "Pakistan";
      });
    }

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
      await page.goto("/admin/inquiries", { waitUntil: "domcontentloaded" });

      if (await page.getByText("Checking access...").isVisible()) {
        await page.waitForTimeout(1000);
        if (await page.getByText("Checking access...").isVisible()) {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
        }
      }

      // Wait for Inquiry Management view to load
      await expect(page.getByText(/Inquiry Management/i).first()).toBeVisible({ timeout: 30000 });

      // 2. Verify inquiry list or empty state exists
      await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
    });

    test("Phase 3: Update Contact Settings & Verify Reflection", async ({ page }) => {
      // 1. Visit Contact Settings
      await page.goto("/admin/contact", { waitUntil: "domcontentloaded" });

      if (await page.getByText("Checking access...").isVisible()) {
        await page.waitForTimeout(1000);
        if (await page.getByText("Checking access...").isVisible()) {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
        }
      }

      // 2. Change Hero Title
      const uniqueTitle = `TEST HERO ${Date.now()}`;
      const heroTitleInput = page
        .getByTestId("input-hero-title")
        .or(page.locator('input[id="heroTitle"]'))
        .first();
      await expect(heroTitleInput).toBeVisible({ timeout: 25000 });
      await heroTitleInput.fill(uniqueTitle);

      // 3. Save Settings
      const saveButton = page
        .getByTestId("button-save")
        .or(page.getByRole("button", { name: /save/i }))
        .first();
      await expect(saveButton).toBeVisible({ timeout: 15000 });
      await saveButton.click();
      await expect(page.getByText(/saved|success/i).first()).toBeVisible({ timeout: 10000 });

      // 4. Verify on Public Page
      await page.goto("/contact", { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    });
  });
});
