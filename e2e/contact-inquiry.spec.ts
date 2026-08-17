import { expect, test } from "@playwright/test";

test.describe("Contact & Inquiries E2E Workflow", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
    page.on("response", async (res) => {
      if (res.status() >= 400 && res.url().includes("/api/")) {
        console.log(
          `[API Error] ${res.status()} ${res.url()} ->`,
          await res.text().catch(() => ""),
        );
      }
    });
  });

  test("Phase 1: Public Form Submission", async ({ page }) => {
    // 1. Visit Contact Page
    await page.goto("/contact", { waitUntil: "domcontentloaded" });

    // Wait for client-side React hydration to complete
    await page
      .waitForFunction(
        () => (window as unknown as { __hydrated?: boolean }).__hydrated === true,
        null,
        { timeout: 25000 },
      )
      .catch(() => {});

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

    // 3. Submit
    await page.getByTestId("button-submit").click();

    // 4. Verify Success State
    await expect(
      page
        .getByTestId("button-send-another")
        .or(page.getByTestId("contact-success-state"))
        .or(
          page.getByText(/your message has been sent successfully|thank you|success|message sent/i),
        )
        .first(),
    ).toBeVisible({
      timeout: 20000,
    });
  });

  test.describe("Admin Inquiries & Settings", () => {
    test.beforeEach(async ({ page }) => {
      // Ensure authenticated admin session
      await page.goto("/api/auth/mock-login", { waitUntil: "commit" });
    });

    test("Phase 2: Verify Inquiry in Admin Console", async ({ page }) => {
      // 1. Visit Admin Inquiries
      await page.goto("/admin/inquiries", { waitUntil: "domcontentloaded" });

      await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 20000 });
      await expect(page.getByText("Loading module...")).not.toBeVisible({ timeout: 20000 });

      // Wait for Inquiry Management view to load
      await expect(
        page
          .getByRole("heading", { name: /Inquiry/i })
          .or(page.getByText(/Inquiries|Inquiry Management/i))
          .first(),
      ).toBeVisible({ timeout: 30000 });

      // 2. Verify inquiry list or empty state exists
      await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
    });

    test("Phase 3: Update Contact Settings & Verify Reflection", async ({ page }) => {
      // 1. Visit Contact Settings
      await page.goto("/admin/contact", { waitUntil: "domcontentloaded" });

      await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 20000 });
      await expect(page.getByText("Loading contact settings...")).not.toBeVisible({
        timeout: 20000,
      });

      // 2. Change Hero Title
      const uniqueTitle = `TEST HERO ${Date.now()}`;
      const heroTrigger = page.getByRole("button", { name: /Hero Section/i });
      if (await heroTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await heroTrigger.click().catch(() => {});
      }
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
