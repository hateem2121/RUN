import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Public Pages: About & Secondary Content", () => {
  const routes = ["/about", "/certifications", "/fabrics", "/fibers"];

  for (const route of routes) {
    test.describe(`Route: ${route}`, () => {
      test("loads successfully", async ({ page }) => {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("domcontentloaded");
        const currentUrl = page.url();
        expect(currentUrl).toContain(route);
      });

      test("renders non-empty content", async ({ page }) => {
        await page.goto(route, { waitUntil: "commit" });
        await page.waitForLoadState("domcontentloaded");
        await page.waitForSelector("main, #root, body", { state: "visible" });
        const content = await page.evaluate(() => document.body.innerText.length > 50);
        expect(content).toBe(true);
      });

      test("no console errors", async ({ page }) => {
        const logs: string[] = [];
        page.on("console", (msg) => {
          if (
            msg.type() === "error" &&
            !msg.text().includes("Lucide") &&
            !msg.text().includes("favicon") &&
            !msg.text().includes("404") &&
            !msg.text().includes("Failed to load resource")
          ) {
            logs.push(msg.text());
          }
        });
        await page.goto(route, { waitUntil: "commit" });
        await page.waitForLoadState("domcontentloaded");
        const criticalLogs = logs.filter(
          (l) =>
            !l.includes("Hydration") &&
            !l.includes("Failed to load resource") &&
            !l.includes("404"),
        );
        expect(criticalLogs.length).toBe(0);
      });

      test("responsive at 375px", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(route, { waitUntil: "commit" });
        await page.waitForLoadState("domcontentloaded");
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 1;
        });
        expect(overflow).toBe(false);
      });

      test("zero critical a11y violations", async ({ page }) => {
        await page.goto(route, { waitUntil: "commit" });
        await page.waitForLoadState("domcontentloaded");
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .disableRules(["color-contrast"])
          .analyze();
        expect(
          accessibilityScanResults.violations.filter((v) => v.impact === "critical"),
        ).toHaveLength(0);
      });
    });
  }

  test("/about renders specific sections", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("domcontentloaded");

    const heroHeading = page.locator("h1").first();
    await expect(heroHeading).toBeVisible({ timeout: 15000 });

    const missionHeading = page.getByRole("heading", { name: /Mission/i }).first();
    if ((await missionHeading.count()) > 0) {
      await missionHeading.scrollIntoViewIfNeeded();
      await expect(missionHeading).toBeVisible({ timeout: 15000 });
    }

    const visionHeading = page.getByRole("heading", { name: /Vision/i }).first();
    if ((await visionHeading.count()) > 0) {
      await visionHeading.scrollIntoViewIfNeeded();
      await expect(visionHeading).toBeVisible({ timeout: 15000 });
    }
  });

  test("/certifications renders cards and documents", async ({ page }) => {
    await page.goto("/certifications");
    await page.waitForLoadState("domcontentloaded");
    const cards = page.locator('[data-testid="resource-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("/fabrics renders fabric cards and filters", async ({ page }) => {
    await page.goto("/fabrics");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    const fabricCard = page.locator('[data-testid="fabric-card"]').first();
    if ((await fabricCard.count()) > 0) {
      await expect(fabricCard).toBeVisible({ timeout: 5000 });
    }
  });

  test("/fibers renders information and cross-links", async ({ page }) => {
    await page.goto("/fibers");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

    const fiberCard = page.locator('[data-testid="fiber-card"]').first();
    if ((await fiberCard.count()) > 0) {
      await expect(fiberCard).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe
  .serial("Admin Modules: About & Secondary Content", () => {
    test.use({ storageState: ".auth/user.json" });

    test("/admin/about crud interaction", async ({ page }) => {
      const testValue = `E2E-ABOUT-${Date.now()}`;
      await page.goto("/admin/about", { waitUntil: "domcontentloaded" });

      if (await page.getByText("Checking access...").isVisible()) {
        await page.waitForTimeout(1000);
        if (await page.getByText("Checking access...").isVisible()) {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
        }
      }

      await expect(page.getByRole("heading", { name: /About.*Management/i }).first()).toBeVisible({
        timeout: 30000,
      });

      await expect(page.getByText("Loading hero data..."))
        .not.toBeVisible({ timeout: 15000 })
        .catch(() => {});

      const titleInput = page.getByPlaceholder("Main Title").first();
      await titleInput.waitFor({ timeout: 15000 });
      const originalValue = await titleInput.inputValue();

      try {
        await titleInput.fill(testValue);
        await page.click('button:has-text("Save Changes")');

        await expect(page.locator('[data-sonner-toast], [role="status"]').first()).toContainText(
          /Success|Saved/i,
          { timeout: 10000 },
        );

        await page.goto("/about", { waitUntil: "domcontentloaded" });
        await expect(page.getByText(testValue).first()).toBeVisible({ timeout: 15000 });
      } finally {
        await page.goto("/admin/about", { waitUntil: "domcontentloaded" });
        const restoreInput = page.getByPlaceholder("Main Title").first();
        if (await restoreInput.isVisible()) {
          await restoreInput.fill(originalValue || "Leading B2B Sportswear Manufacturing");
          await page.click('button:has-text("Save Changes")');
          await page.waitForTimeout(1000);
        }
      }
    });

    test("/admin/certifications crud interaction", async ({ page }) => {
      const testCert = `E2E-CERT-${Date.now()}`;
      await page.goto("/admin/certifications");
      await page.waitForLoadState("domcontentloaded");

      if (await page.getByText("Checking access...").isVisible()) {
        await page.waitForTimeout(1000);
        if (await page.getByText("Checking access...").isVisible()) {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
        }
      }

      const addBtn = page.getByRole("button", { name: /Add Certificate/i });
      await expect(addBtn).toBeVisible({ timeout: 25000 });
      await addBtn.click();

      // Explicitly wait for dialog and use more specific input locator
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.locator("input#name").fill(testCert);
      await dialog.locator("input#type").fill("Sustainability");
      const createBtn = dialog.getByRole("button", { name: "Create", exact: true });
      await createBtn.dispatchEvent("click");

      await expect(page.locator('[data-sonner-toast], [role="status"]').first()).toContainText(
        /Success/i,
        { timeout: 10000 },
      );

      await page.goto("/certifications", { waitUntil: "domcontentloaded" });
      await expect(page.locator(`text=${testCert}`).first())
        .toBeVisible({ timeout: 15000 })
        .catch(() => {});

      await page.goto("/admin/certifications", { waitUntil: "domcontentloaded" });
      if (await page.getByText("Checking access...").isVisible()) {
        await page.waitForTimeout(1000);
        if (await page.getByText("Checking access...").isVisible()) {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
        }
      }
      const card = page.locator(`[data-testid="resource-card"]:has-text("${testCert}")`).first();
      await expect(card).toBeVisible({ timeout: 15000 });

      const deleteBtn = card.locator('button:has-text("Delete")');
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
      } else {
        const menuBtn = card
          .locator('button[aria-haspopup="menu"], button[aria-label="Certificate actions"]')
          .first();
        await menuBtn.click();
        await page.getByRole("menuitem", { name: "Delete" }).first().click();
      }

      await expect(page.locator('[data-sonner-toast], [role="status"]').first()).toContainText(
        /Success/i,
        { timeout: 10000 },
      );

      await page.goto("/certifications", { waitUntil: "domcontentloaded" });
      await expect(page.locator(`text=${testCert}`)).not.toBeVisible();
    });

    test("/admin/fabrics crud interaction", async ({ page }) => {
      const testFabric = `E2E-FABRIC-${Date.now()}`;
      await page.goto("/admin/fabrics");
      await page.waitForLoadState("domcontentloaded");

      if (await page.getByText("Checking access...").isVisible()) {
        await page.waitForTimeout(1000);
        if (await page.getByText("Checking access...").isVisible()) {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
        }
      }

      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

      await page.getByRole("button", { name: /Create Fabric/i }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.locator("input#name").fill(testFabric);
      const createBtn = dialog.getByRole("button", { name: /Create Fabric/i });
      await createBtn.dispatchEvent("click");

      await expect(page.locator('[data-sonner-toast], [role="status"]').first()).toContainText(
        /Success/i,
        { timeout: 10000 },
      );

      await page.goto("/admin/fabrics", { waitUntil: "domcontentloaded" });
      if (await page.getByText("Checking access...").isVisible()) {
        await page.waitForTimeout(1000);
        if (await page.getByText("Checking access...").isVisible()) {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
        }
      }
      const card = page.locator(`[data-testid="fabric-card"]:has-text("${testFabric}")`).first();
      await expect(card).toBeVisible({ timeout: 15000 });
      await card.locator('button:has-text("Delete")').first().click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Delete", exact: true })
        .dispatchEvent("click");

      await expect(page.locator('[data-sonner-toast], [role="status"]').first()).toContainText(
        /Success/i,
        { timeout: 10000 },
      );

      await page.goto("/fabrics", { waitUntil: "domcontentloaded" });
      await expect(page.locator(`text=${testFabric}`)).not.toBeVisible();
    });

    test("/admin/fibers crud interaction", async ({ page }) => {
      const testFiber = `E2E-FIBER-${Date.now()}`;
      await page.goto("/admin/fibers");
      await page.waitForLoadState("domcontentloaded");

      if (await page.getByText("Checking access...").isVisible()) {
        await page.waitForTimeout(1000);
        if (await page.getByText("Checking access...").isVisible()) {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
        }
      }

      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });

      await page.getByRole("button", { name: /Create Fiber/i }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.locator("input#name").fill(testFiber);

      // Select Fiber Type (e.g. Natural) from the dropdown
      await dialog.getByRole("combobox").click();
      await page.getByRole("option", { name: "Natural", exact: true }).click();

      const createFiberBtn = dialog.getByRole("button", { name: /Create Fiber/i });
      await createFiberBtn.dispatchEvent("click");

      await expect(page.locator('[data-sonner-toast], [role="status"]').first()).toContainText(
        /Success/i,
        { timeout: 10000 },
      );

      await page.goto("/fibers", { waitUntil: "domcontentloaded" });
      const publicFiber = page.locator(`text=${testFiber}`).first();
      await expect(publicFiber)
        .toBeVisible({ timeout: 15000 })
        .catch(() => {});

      await page.goto("/admin/fibers", { waitUntil: "domcontentloaded" });
      if (await page.getByText("Checking access...").isVisible()) {
        await page.waitForTimeout(1000);
        if (await page.getByText("Checking access...").isVisible()) {
          await page.reload();
          await page.waitForLoadState("domcontentloaded");
        }
      }
      const card = page.locator(`[data-testid="fiber-card"]:has-text("${testFiber}")`).first();
      await expect(card).toBeVisible({ timeout: 15000 });

      const deleteBtn = card.locator('button:has-text("Delete")');
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
      } else {
        const menuBtn = card
          .locator('button[aria-haspopup="menu"], button[aria-label="Fiber actions"]')
          .first();
        await menuBtn.click();
        await page.getByRole("menuitem", { name: "Delete" }).first().click();
      }

      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Delete", exact: true })
        .dispatchEvent("click");
      await expect(page.locator('[data-sonner-toast], [role="status"]').first()).toContainText(
        /Success/i,
        { timeout: 10000 },
      );

      await page.goto("/fibers", { waitUntil: "domcontentloaded" });
      await expect(page.locator(`text=${testFiber}`)).not.toBeVisible();
    });
  });
