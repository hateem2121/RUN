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
    await page.getByTestId("textarea-message").fill(`This is an automated test message for inquiry ${testId}. Please ignore.`);

    // Select a country (using the dropdown)
    await page.getByTestId("button-country-dropdown").click();
    await page.getByText("Pakistan").first().click();

    // 3. Submit
    await page.getByTestId("button-submit").click();

    // 4. Verify Success Message
    await expect(page.getByText(/message sent/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/your message has been sent successfully/i)).toBeVisible();
  });

  test.describe("Admin Inquiries & Settings", () => {
    // Use saved auth state for admin tests
    // Ensure auth.setup.ts has run or manual login was performed
    test.use({ storageState: ".auth/user.json" });

    test("Phase 2: Verify Inquiry in Admin Console", async ({ page }) => {
      // 1. Visit Admin Inquiries
      await page.goto(`${BASE_URL}/admin/inquiries`);
      
      // Wait for table to load
      await expect(page.getByRole("table")).toBeVisible({ timeout: 15000 });
      
      // 2. Verify recent inquiry exists (search for "Automated Test")
      await expect(page.getByText(/automated test/i).first()).toBeVisible();
    });

    test("Phase 3: Update Contact Settings & Verify Reflection", async ({ page }) => {
      // 1. Visit Contact Settings
      await page.goto(`${BASE_URL}/admin/contact`);
      
      // 2. Change Hero Title
      const uniqueTitle = `TEST HERO ${Date.now()}`;
      const heroTitleInput = page.locator('input[name="heroTitle"]');
      await expect(heroTitleInput).toBeVisible();
      await heroTitleInput.fill(uniqueTitle);
      
      // 3. Save Settings
      await page.getByRole("button", { name: /save/i }).click();
      
      // Allow some time for cache invalidation/db update
      await expect(page.getByText(/success/i)).toBeVisible();

      // 4. Verify on Public Page
      await page.goto(`${BASE_URL}/contact`);
      
      // Use a slightly longer timeout in case of SSR/hydration delay
      await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });
    });
  });
});
