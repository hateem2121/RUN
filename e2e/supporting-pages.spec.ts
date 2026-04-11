import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5002";

test.describe("Public Pages: Supporting Content", () => {
  const routes = ["/size-charts", "/accessories", "/resources", "/services"];

  for (const route of routes) {
    test.describe(`Route: ${route}`, () => {
      test("loads successfully", async ({ page }) => {
        const response = await page.goto(`${BASE_URL}${route}`);
        expect(response?.status()).toBe(200);
      });

      test("renders non-empty content", async ({ page }) => {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForLoadState("networkidle");
        const content = await page.evaluate(() => document.body.innerText.length > 50);
        expect(content).toBe(true);
      });

      test("no console errors", async ({ page }) => {
        const logs: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error" && !msg.text().includes("Lucide")) logs.push(msg.text());
        });
        await page.goto(`${BASE_URL}${route}`);
        expect(logs.filter((l) => !l.includes("Hydration")).length).toBe(0);
      });

      test("responsive at 375px", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${BASE_URL}${route}`);
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 1;
        });
        expect(overflow).toBe(false);
      });

      test("zero critical a11y violations", async ({ page }) => {
        await page.goto(`${BASE_URL}${route}`);
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        expect(
          accessibilityScanResults.violations.filter((v) => v.impact === "critical"),
        ).toHaveLength(0);
      });
    });
  }

  test("/size-charts renders data grid", async ({ page }) => {
    await page.goto(`${BASE_URL}/size-charts`);
    await page.waitForSelector('[data-testid="resource-card"]', { timeout: 10000 });

    // Expand the first card to see the table
    const firstCard = page.locator('[data-testid="resource-card"]').first();
    await firstCard.click();

    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });
    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible();
    await expect(table.locator('tr, [role="row"]').nth(1)).toBeVisible();
  });

  test("/accessories renders detailed items with 3D capability", async ({ page }) => {
    await page.goto(`${BASE_URL}/accessories`);
    await page.waitForSelector('[data-testid="resource-card"]', { timeout: 10000 });
    const item = page.locator('[data-testid="resource-card"]').first();
    await expect(item).toBeVisible();

    // Check for 3D viewer if present
    const modelViewer = page.locator("model-viewer");
    const count = await modelViewer.count();
    if (count > 0) {
      await expect(modelViewer.first()).toBeVisible();
    }
  });

  test("/resources renders multiple resource categories", async ({ page }) => {
    await page.goto(`${BASE_URL}/resources`);
    await expect(page.locator("h1")).toContainText(/Resource/i);
    const links = page.locator('a[href*="/resources/"], a[href*=".pdf"], .resource-card a');
    expect(await links.count()).toBeGreaterThan(0);
  });
});

test.describe("Admin Modules: Supporting Content & Media", () => {
  test.use({ storageState: ".auth/user.json" });

  test("/admin/size-charts full CRUD interaction", async ({ page }) => {
    const testChart = `E2E-CHART-${Date.now()}`;
    await page.goto(`${BASE_URL}/admin/size-charts`);
    await expect(page.locator("h1")).toContainText(/Size Chart Management/i);

    // Create using template
    await page.fill("input#name", testChart);

    // Select Region
    await page.click('button:has-text("Select region")');
    await page.click('role=option[name="United States"]');

    // Set Type
    await page.fill("input#type", "Apparel");

    // Load Template
    await page.click('button:has-text("Load Template")');
    await expect(page.locator("body")).toContainText(/Template Loaded/i);

    // Submit
    await page.click('button:has-text("Create Size Chart")');
    await expect(page.locator("body")).toContainText(/Success/i);

    // Verify in public list
    await page.goto(`${BASE_URL}/size-charts`);
    await expect(page.locator(`text=${testChart}`)).toBeVisible();

    // Delete in admin
    await page.goto(`${BASE_URL}/admin/size-charts`);
    const card = page.locator(`[data-testid="chart-card"]:has-text("${testChart}")`).first();
    await card.locator('button:has-text("Delete")').click();
    await page.click('role=dialog button:has-text("Delete")');
    await expect(page.locator("body")).toContainText(/Success/i);
  });

  test("/admin/accessories full CRUD interaction", async ({ page }) => {
    const testAcc = `E2E-ACC-${Date.now()}`;
    await page.goto(`${BASE_URL}/admin/accessories`);
    await expect(page.locator("h1")).toContainText(/Accessory/i);

    // Create
    await page.fill("input#name", testAcc);
    await page.fill("input#category", "Hardware");
    await page.fill("textarea#description", "E2E Testing Accessory");
    await page.click('button:has-text("Create Accessory")');

    await expect(page.locator("body")).toContainText(/Success/i);

    // Verify in public
    await page.goto(`${BASE_URL}/accessories`);
    await expect(page.locator(`text=${testAcc}`).first()).toBeVisible();

    // Delete in admin
    await page.goto(`${BASE_URL}/admin/accessories`);
    const card = page.locator(`[data-testid="accessory-card"]:has-text("${testAcc}")`).first();
    await card.locator('button:has-text("Delete")').click();
    await page.click('role=dialog button:has-text("Delete")');
    await expect(page.locator("text=Success")).toBeVisible();
  });

  test("Admin Media Library: upload, filter and delete", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/media`);
    await expect(page.locator('h1:has-text("Media Library")')).toBeVisible();

    // Upload
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.click("text=Select Files");
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "test-qa-media.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-media-content"),
    });

    await expect(page.locator("text=completed")).toBeVisible({ timeout: 20000 });

    // Filter test
    const searchInput = page.getByPlaceholder("Search media assets...").first();
    await searchInput.fill("test-qa-media");

    const mediaCard = page
      .locator('.media-card, [role="griditem"]')
      .filter({ hasText: "test-qa-media" })
      .first();
    await expect(mediaCard).toBeVisible();

    // Delete
    await mediaCard.click();
    await page.click('button:has-text("Delete")');
    await page.click('role=dialog button:has-text("Delete")');

    await expect(page.locator("text=test-qa-media")).not.toBeVisible();
  });

  test("Admin Storage Optimization dashboard health", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/storage-optimization`);
    await expect(page.locator('h1:has-text("Storage")')).toBeVisible();
    await expect(
      page.locator("text=Total Size").or(page.locator("text=Used Storage")),
    ).toBeVisible();
  });
});
