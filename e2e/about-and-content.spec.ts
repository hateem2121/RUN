import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5002";

test.describe("Public Pages: About & Secondary Content", () => {
  for (const route of ["/about", "/certifications", "/fabrics", "/fibers"]) {
    test.describe(`Route: ${route}`, () => {
      test("loads successfully", async ({ page }) => {
        const response = await page.goto(`${BASE_URL}${route}`);
        expect(response?.status()).toBe(200);
      });

      test("renders non-empty content", async ({ page }) => {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForSelector("main, #root, body");
        const content = await page.evaluate(() => document.body.innerText.length > 50);
        expect(content).toBe(true);
      });

      test("no console errors", async ({ page }) => {
        const logs: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error" && !msg.text().includes("Lucide")) {
            logs.push(msg.text());
          }
        });
        await page.goto(`${BASE_URL}${route}`);
        if (logs.length > 0) {
          const fs = require("fs");
          fs.appendFileSync("e2e-console-logs.txt", `\n--- ${route} ---\n${logs.join("\n")}\n`);
        }
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

  test("/about renders specific sections", async ({ page }) => {
    await page.goto(`${BASE_URL}/about`);

    // Use resilient locators that wait for visibility and scroll if needed
    const heroHeading = page.getByRole("heading", { name: /About RUN Apparel/i });
    await expect(heroHeading).toBeVisible();

    // GSAP ScrollExpansion Hero can be tricky for standard scrolling.
    // We'll scroll deeply to trigger all animations.
    await page.evaluate(() => window.scrollTo(0, 5000));
    await page.waitForTimeout(1000);

    const missionHeading = page.getByRole("heading", { name: "Our Mission" });
    await expect(missionHeading).toBeVisible({ timeout: 15000 });

    const visionHeading = page.getByRole("heading", { name: "Our Vision" });
    await expect(visionHeading).toBeVisible({ timeout: 15000 });

    // Heritage and Team
    const ceoText = page.getByText("Founder & CEO");
    await ceoText.scrollIntoViewIfNeeded();
    await expect(ceoText).toBeVisible({ timeout: 10000 });

    // Global Presence
    const mapHeading = page.getByRole("heading", { name: "Global Presence" });
    await mapHeading.scrollIntoViewIfNeeded();
    await expect(mapHeading).toBeVisible({ timeout: 10000 });

    await expect(page.getByText("Headquarters & Main Factory")).toBeVisible();
  });

  test("/certifications renders cards and documents", async ({ page, request }) => {
    await page.goto(`${BASE_URL}/certifications`);
    await page.waitForSelector('[data-testid="resource-card"]', { timeout: 10000 });
    const card = page.locator('[data-testid="resource-card"]').first();
    await expect(card).toBeVisible();

    const docLinks = page.locator(
      'a:has-text("View Document"), a:has-text("Download PDF"), a[href*=".pdf"]',
    );
    const count = await docLinks.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const href = await docLinks.nth(i).getAttribute("href");
        if (href && !href.startsWith("mailto:") && !href.startsWith("#")) {
          const docUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
          try {
            const response = await request.head(docUrl);
            expect(response.status()).toBeLessThan(400);
          } catch (e) {
            const response = await request.get(docUrl);
            expect(response.status()).toBeLessThan(400);
          }
        }
      }
    }
  });

  test("/fabrics renders fabric cards and filters", async ({ page }) => {
    await page.goto(`${BASE_URL}/fabrics`);
    // Use .first() to handle cases where background text or themes might duplicate the h1 title
    await expect(
      page.getByRole("heading", { level: 1, name: /Premium Fabric Collection/i }).first(),
    ).toBeVisible();

    const searchInput = page.getByPlaceholder(/Search fabrics/i).first();
    await expect(searchInput).toBeVisible();

    // Wait for content items to appear (checking for data presence)
    const fabricCard = page.locator('[data-testid="fabric-card"]').first();
    await fabricCard.scrollIntoViewIfNeeded();
    await expect(fabricCard).toBeVisible({ timeout: 15000 });
  });

  test("/fibers renders information and cross-links", async ({ page }) => {
    await page.goto(`${BASE_URL}/fibers`);
    await expect(
      page.getByRole("heading", { level: 1, name: /Fiber Materials Library/i }).first(),
    ).toBeVisible();

    const fiberCard = page.locator('[data-testid="fiber-card"]').first();
    await fiberCard.scrollIntoViewIfNeeded();
    await expect(fiberCard).toBeVisible({ timeout: 15000 });

    const fabricLink = page.locator('a:has-text("Fabrics"), a[href="/fabrics"]').first();
    if (await fabricLink.isVisible()) {
      await fabricLink.click();
      await expect(page).toHaveURL(/.*fabrics/);
    }
  });
});

test.describe("Admin Modules: About & Secondary Content", () => {
  test.use({ storageState: ".auth/user.json" });

  test("/admin/about crud interaction", async ({ page }) => {
    const testValue = `E2E-ABOUT-${Date.now()}`;
    await page.goto(`${BASE_URL}/admin/about`);

    await expect(page.getByRole("heading", { name: /About page Management/i })).toBeVisible();

    const titleInput = page.getByPlaceholder("Main Title").first();
    await titleInput.waitFor();
    const originalValue = await titleInput.inputValue();

    await titleInput.fill(testValue);
    await page.click('button:has-text("Save Changes")');

    // Specific toast locator for better reliability
    await expect(page.locator('[role="status"]')).toContainText(/Success/i, { timeout: 10000 });

    await page.goto(`${BASE_URL}/about`);

    // Wait for GSAP hero expansion and hydration
    await page.mouse.wheel(0, 2000);
    await expect(page.getByText(testValue)).toBeVisible({ timeout: 15000 });

    await page.goto(`${BASE_URL}/admin/about`);
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('[role="status"]')).toContainText(/Success/i, { timeout: 10000 });
  });

  test("/admin/certifications crud interaction", async ({ page }) => {
    const testCert = `E2E-CERT-${Date.now()}`;
    await page.goto(`${BASE_URL}/admin/certifications`);

    // Explicitly wait for the list to load
    await page.waitForSelector('h1:has-text("Certificate Management")');

    await page.getByRole("button", { name: /Add Certificate/i }).click();

    // Explicitly wait for dialog and use more specific input locator
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator("input#name").fill(testCert);
    await dialog.locator("input#type").fill("Sustainability");
    await page.getByRole("button", { name: /Create/i, exact: true }).click();

    await expect(page.locator('[role="status"]')).toContainText(/Success/i, { timeout: 10000 });

    await page.goto(`${BASE_URL}/certifications`);
    await expect(page.locator(`text=${testCert}`).first()).toBeVisible();

    await page.goto(`${BASE_URL}/admin/certifications`);
    const card = page.locator(`[data-testid="resource-card"]:has-text("${testCert}")`).first();
    await expect(card).toBeVisible();

    await card.locator('button:has-text("Delete")').click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();

    await expect(page.locator('[role="status"]')).toContainText(/Success/i, { timeout: 10000 });

    await page.goto(`${BASE_URL}/certifications`);
    await expect(page.locator(`text=${testCert}`)).not.toBeVisible();
  });

  test("/admin/fabrics crud interaction", async ({ page }) => {
    const testFabric = `E2E-FABRIC-${Date.now()}`;
    await page.goto(`${BASE_URL}/admin/fabrics`);

    await page.getByRole("button", { name: /Create Fabric/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator("input#name").fill(testFabric);
    await page.getByRole("button", { name: /Create Fabric/i, exact: true }).click();

    await expect(page.locator('[role="status"]')).toContainText(/Success/i, { timeout: 10000 });

    await page.goto(`${BASE_URL}/fabrics`);
    await expect(page.locator(`text=${testFabric}`).first()).toBeVisible();

    await page.goto(`${BASE_URL}/admin/fabrics`);
    const card = page.locator(`[data-testid="fabric-card"]:has-text("${testFabric}")`).first();
    await card.locator('button:has-text("Delete")').click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();

    await expect(page.locator('[role="status"]')).toContainText(/Success/i, { timeout: 10000 });

    await page.goto(`${BASE_URL}/fabrics`);
    await expect(page.locator(`text=${testFabric}`)).not.toBeVisible();
  });

  test("/admin/fibers crud interaction", async ({ page }) => {
    const testFiber = `E2E-FIBER-${Date.now()}`;
    await page.goto(`${BASE_URL}/admin/fibers`);

    await page.getByRole("button", { name: /Create Fiber/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator("input#name").fill(testFiber);
    await page.getByRole("button", { name: /Create Fiber/i, exact: true }).click();

    await expect(page.locator('[role="status"]')).toContainText(/Success/i, { timeout: 10000 });

    await page.goto(`${BASE_URL}/fibers`);
    await expect(page.locator(`text=${testFiber}`).first()).toBeVisible();

    await page.goto(`${BASE_URL}/admin/fibers`);
    const card = page.locator(`[data-testid="fiber-card"]:has-text("${testFiber}")`).first();

    const deleteBtn = card.locator('button:has-text("Delete")');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
    } else {
      const menuBtn = card.locator('button[aria-haspopup="menu"]').first();
      await menuBtn.click();
      await page.click("text=Delete");
    }

    await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.locator('[role="status"]')).toContainText(/Success/i, { timeout: 10000 });

    await page.goto(`${BASE_URL}/fibers`);
    await expect(page.locator(`text=${testFiber}`)).not.toBeVisible();
  });
});
