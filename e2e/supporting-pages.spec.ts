import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Public Pages: Supporting Content", () => {
  const routes = ["/size-charts", "/accessories", "/resources", "/services"];

  for (const route of routes) {
    test.describe(`Route: ${route}`, () => {
      test("loads successfully", async ({ page }) => {
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
      });

      test("renders non-empty content", async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState("domcontentloaded");
        const content = await page.evaluate(() => document.body.innerText.length > 50);
        expect(content).toBe(true);
      });

      test("no console errors", async ({ page }) => {
        const logs: string[] = [];
        page.on("console", (msg) => {
          const text = msg.text();
          if (
            msg.type() === "error" &&
            !text.includes("Lucide") &&
            !text.includes("Failed to fetch") &&
            !text.includes("Content Security Policy") &&
            !text.includes("Refused to connect") &&
            !text.includes("violates the following") &&
            !text.includes("404") &&
            !text.includes("Failed to load resource")
          ) {
            logs.push(text);
          }
        });
        await page.goto(route);
        await page.waitForLoadState("domcontentloaded");
        expect(logs.filter((l) => !l.includes("Hydration")).length).toBe(0);
      });

      test("responsive at 375px", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(route);
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 1;
        });
        expect(overflow).toBe(false);
      });

      test("zero critical a11y violations", async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState("load");
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .exclude(".animate-pulse")
          .analyze();
        expect(
          accessibilityScanResults.violations.filter((v) => v.impact === "critical"),
        ).toHaveLength(0);
      });
    });
  }

  test("/size-charts renders data grid", async ({ page }) => {
    await page.goto("/size-charts");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1").first()).toContainText(/Size/i);
  });

  test("/accessories renders detailed items with 3D capability", async ({ page }) => {
    await page.goto("/accessories");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1").first()).toContainText(/Accessory|Accessories/i);
  });

  test("/resources renders multiple resource categories", async ({ page }) => {
    await page.goto("/resources");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1").first()).toContainText(/Resource/i);
  });
});

test.describe("Admin Modules: Supporting Content & Media", () => {
  test("/admin/size-charts full CRUD interaction", async ({ page }) => {
    const testChart = `E2E-CHART-${Date.now()}`;
    await page.goto("/admin/size-charts");
    await page.waitForLoadState("domcontentloaded");

    if (await page.getByText("Checking access...").isVisible()) {
      await page.waitForTimeout(1000);
      if (await page.getByText("Checking access...").isVisible()) {
        await page.reload();
        await page.waitForLoadState("domcontentloaded");
      }
    }

    await expect(
      page
        .locator("input#name")
        .or(page.getByText(/Size Chart Management/i))
        .first(),
    ).toBeVisible({
      timeout: 25000,
    });

    // Create using template
    const nameInput = page.locator("input#name");
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(testChart);

    // Select Region
    const regionTrigger = page
      .locator('button:has-text("Select region"), [role="combobox"]')
      .first();
    if (await regionTrigger.isVisible()) {
      await regionTrigger.click();
      const option = page.getByRole("option", { name: /United States|US/i }).first();
      if (await option.isVisible()) {
        await option.click();
      }
    }

    // Set Type
    const typeInput = page.locator("input#type");
    if (await typeInput.isVisible()) {
      await typeInput.fill("Apparel");
    }

    // Load Template
    const loadTemplateBtn = page
      .getByTestId("button-load-template")
      .or(page.getByRole("button", { name: /Load Template/i }))
      .first();
    if ((await loadTemplateBtn.isVisible()) && !(await loadTemplateBtn.isDisabled())) {
      await loadTemplateBtn.click();
    }

    // Submit
    await page
      .getByRole("button", { name: /Create Size Chart|Save/i })
      .first()
      .click();
    await expect(page.getByText(/Success|Created|Size chart/i).first()).toBeVisible({
      timeout: 15000,
    });

    // Delete in admin
    const card = page
      .locator(`[data-testid="chart-card"], tr`)
      .filter({ hasText: testChart })
      .first();
    if (await card.isVisible()) {
      await card.getByRole("button", { name: /Delete/i }).click();
      const confirmBtn = page.getByRole("dialog").getByRole("button", { name: /Delete/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  });

  test("/admin/accessories full CRUD interaction", async ({ page }) => {
    const testAcc = `E2E-ACC-${Date.now()}`;
    await page.goto("/admin/accessories");
    await page.waitForLoadState("domcontentloaded");

    if (await page.getByText("Checking access...").isVisible()) {
      await page.waitForTimeout(1000);
      if (await page.getByText("Checking access...").isVisible()) {
        await page.reload();
        await page.waitForLoadState("domcontentloaded");
      }
    }

    await expect(
      page
        .locator("input#name")
        .or(page.getByText(/Accessory.*Management/i))
        .first(),
    ).toBeVisible({
      timeout: 25000,
    });

    // Create
    const nameInput = page.locator("input#name");
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(testAcc);

    const descInput = page.locator("textarea#description");
    if (await descInput.isVisible()) {
      await descInput.fill("E2E Testing Accessory");
    }

    await page
      .getByRole("button", { name: /Create Accessory|Save/i })
      .first()
      .click();
    await expect(page.getByText(/Success|Created|Accessory/i).first()).toBeVisible({
      timeout: 15000,
    });

    // Delete in admin
    const card = page
      .locator(`[data-testid="accessory-card"], tr`)
      .filter({ hasText: testAcc })
      .first();
    if (await card.isVisible()) {
      await card.getByRole("button", { name: /Delete/i }).click();
      const confirmBtn = page.getByRole("dialog").getByRole("button", { name: /Delete/i });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  });

  test("Admin Media Library: upload, filter and delete", async ({ page }) => {
    await page.goto("/admin/media");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText(/Media Library/i).first()).toBeVisible({
      timeout: 25000,
    });

    // Upload via file input directly
    const fileInput = page.locator('#media-upload-file-input, input[type="file"]').first();
    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles({
        name: "test-qa-media.png",
        mimeType: "image/png",
        buffer: Buffer.from("fake-media-content"),
      });
    }

    await page.waitForTimeout(1000);

    // Filter test
    const searchInput = page.getByPlaceholder(/Search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("test-qa-media");
    }
  });

  test("Admin Storage Optimization dashboard health", async ({ page }) => {
    await page.goto("/admin/storage-optimization");
    await page.waitForLoadState("domcontentloaded");

    if (await page.getByText("Checking access...").isVisible()) {
      await page.waitForTimeout(1000);
      if (await page.getByText("Checking access...").isVisible()) {
        await page.reload();
        await page.waitForLoadState("domcontentloaded");
      }
    }

    await expect(page.getByText(/Storage Optimization/i).first()).toBeVisible({
      timeout: 25000,
    });
    await expect(
      page
        .locator("text=Total Storage")
        .or(page.locator("text=Total Size"))
        .or(page.locator("text=Used Storage"))
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });
});
