import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const HERO_FALLBACK_TEXTS = ["YOUR STRATEGIC", "B2B MANUFACTURING", "PARTNER"];

test.describe("Homepage (/)", () => {
  test("loads with HTTP 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("page has a non-empty <title> tag (SEO requirement)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const title = await page.title();
    expect(title, "Homepage is missing a <title> tag — SEO and a11y gap").not.toBe("");
    expect(title).toMatch(/RUN/i);
  });

  test("SSR: hero content present in initial HTML before JS hydration", async ({ page }) => {
    // Block JS to simulate raw SSR response
    await page.route("**/*.js", (route) => route.abort());
    await page.goto("/");
    // Hero h1 must be in the SSR HTML — either fallback or CMS title
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const text = await h1.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test("no hydration mismatch errors in console", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const t = msg.text();
        // React hydration mismatches contain these strings
        if (t.includes("Hydration") || t.includes("hydrat") || t.includes("did not match")) {
          errors.push(t);
        }
      }
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors, `Hydration errors found: ${errors.join("\n")}`).toHaveLength(0);
  });

  test("preloader completes and reveals page content", async ({ page }) => {
    await page.goto("/");
    // Preloader may cover content — wait for it to finish (up to 8s)
    await page
      .locator(".hero-line")
      .first()
      .waitFor({ state: "visible", timeout: 8000 })
      .catch(() => {});
    const heroLines = page.locator(".hero-line");
    const count = await heroLines.count();
    expect(count).toBeGreaterThan(0);
    // Each hero line must have non-empty text
    const firstLineText = await heroLines.first().innerText();
    expect(firstLineText.trim().length).toBeGreaterThan(0);
  });

  test("GSAP: hero lines are rendered in DOM", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const heroLinesCount = await page.evaluate(() => {
      return document.querySelectorAll(".hero-line").length;
    });
    expect(heroLinesCount).toBeGreaterThan(0);
  });

  test("navigation header is in the DOM with interactive children", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const header = page.locator("header").first();
    await expect(header).toBeAttached();
    // Logo link inside the header
    const logoLink = header.locator('a[href="/"], a[aria-label*="Homepage"]').first();
    await expect(logoLink).toBeVisible({ timeout: 10000 });
  });

  test("CMS sections render non-empty content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // At least one meaningful text block below the hero must be non-empty
    // The hero h1 with CMS title OR fallback text must be present
    const heroText = await page.locator("h1").first().innerText();
    const hasCmsOrFallback =
      heroText.trim().length > 0 ||
      HERO_FALLBACK_TEXTS.some((t) => heroText.toUpperCase().includes(t));
    expect(hasCmsOrFallback).toBe(true);

    // Sections component renders CMS narrative — check for any section heading
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(200);
  });

  test("no model-viewer console errors (3D viewer not present on homepage)", async ({ page }) => {
    const modelErrors: string[] = [];
    page.on("console", (msg) => {
      if (
        msg.type() === "error" &&
        (msg.text().includes("model-viewer") || msg.text().includes("modelViewer"))
      ) {
        modelErrors.push(msg.text());
      }
    });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    expect(modelErrors).toHaveLength(0);
  });

  test("responsive at 375px — no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(380); // 5px tolerance
  });

  test("responsive at 768px — no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(773);
  });

  test("responsive at 1440px — no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1445);
  });

  test("accessibility: zero critical violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Wait an extra 1s for SPA routing to settle
    await page.waitForTimeout(1000);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude(".animate-pulse") // exclude loading skeletons
      .analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(
      critical,
      `Critical a11y violations:\n${critical.map((v) => `  - ${v.id}: ${v.description}`).join("\n")}`,
    ).toHaveLength(0);
  });

  test("LCP measurement (target <3500ms prod, <15000ms dev)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const lcp = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            resolve(last?.startTime ?? 0);
          }).observe({ type: "largest-contentful-paint", buffered: true });
          setTimeout(() => {
            const entries = performance.getEntriesByType("largest-contentful-paint");
            resolve(entries[entries.length - 1]?.startTime ?? 0);
          }, 2000);
        }),
    );
    expect(lcp, `LCP was ${lcp}ms — dev target is <15000ms for batch execution`).toBeLessThan(
      15000,
    );
  });
});

test.describe("Admin Homepage (/admin/homepage)", () => {
  test.use({ storageState: ".auth/user.json" });

  test("admin homepage module loads without auth redirect", async ({ page }) => {
    await page.goto("/admin/homepage");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).not.toHaveURL(/login|mock-login/);
    // Admin header must be visible — homepage-management.tsx is lazy-loaded, allow extra time
    await expect(page.getByText("Homepage Orchestration")).toBeVisible({ timeout: 20000 });
  });

  test("admin hero tab loads current CMS content", async ({ page }) => {
    await page.goto("/admin/homepage?tab=hero");
    // Wait for lazy module and CMS data to load
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("Homepage Orchestration")).toBeVisible({ timeout: 20000 });
    // An input containing the current hero title should be present
    const inputs = page.locator('input[type="text"], textarea').first();
    await expect(inputs).toBeVisible({ timeout: 8000 });
  });

  test("admin: hero form renders editable title field", async ({ page }) => {
    // Verify the admin UI shows a populated title input that can be edited
    await page.goto("/admin/homepage?tab=hero");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("Homepage Orchestration")).toBeVisible({ timeout: 25000 });
    const titleInput = page.locator("#title");
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    // Input must be populated with the current CMS title (proves data loaded)
    await expect(titleInput).not.toHaveValue("", { timeout: 10000 });
    // Fill with a new value — this simulates what an admin would do
    const testTitle = `TEST-HEADING-${Date.now()}`;
    await titleInput.click({ clickCount: 3 });
    await titleInput.fill(testTitle);
    // After filling, the Sync Hero button must become enabled (isDirty=true)
    await page.waitForTimeout(300); // settle React state
    const saveBtn = page.getByRole("button", { name: /save|update|publish|sync hero/i }).first();
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
  });

  test("admin: UI Sync Hero persists title change (E2E CRUD)", async ({ page }) => {
    // 1. Get current title (to restore after test)
    const heroRes = await page.request.get("/api/homepage-hero");
    expect(heroRes.ok()).toBe(true);
    const heroData = await heroRes.json();
    const originalTitle: string = heroData.title ?? "Next-Generation Sportswear Manufacturing";

    // 2. Navigate to admin UI
    await page.goto("/admin/homepage?tab=hero");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("Homepage Orchestration")).toBeVisible({ timeout: 25000 });
    const titleInput = page.locator("#title");
    await expect(titleInput).toBeVisible({ timeout: 15000 });

    const testTitle = `TEST-UI-SYNC-${Date.now()}`;

    try {
      // 3. Update via UI
      await titleInput.click({ clickCount: 3 });
      await titleInput.fill(testTitle);

      const saveBtn = page.getByRole("button", { name: /save|update|publish|sync hero/i }).first();
      await expect(saveBtn).toBeEnabled({ timeout: 5000 });
      await saveBtn.click();

      // 4. Verify success via button state (isDirty=false)
      await expect(saveBtn).toBeDisabled({ timeout: 10000 });

      // 5. Verify persistence via API
      const verifyRes = await page.request.get("/api/homepage-hero");
      const verifyData = await verifyRes.json();
      expect(verifyData.title, "Title should be persisted to database").toBe(testTitle);

      // 6. Verify reflection on Public Homepage
      await page.goto("/");
      await page.waitForLoadState("domcontentloaded");
      const h1 = page.locator("h1").first();
      await expect(h1).toContainText(testTitle, { timeout: 10000 });
    } finally {
      // 7. RESTORE original data
      await page.goto("/admin/homepage?tab=hero");
      await expect(titleInput).toBeVisible({ timeout: 15000 });
      await titleInput.click({ clickCount: 3 });
      await titleInput.fill(originalTitle);
      const saveBtn = page.getByRole("button", { name: /save|update|publish|sync hero/i }).first();
      await saveBtn.click();
      await expect(saveBtn).toBeDisabled({ timeout: 10000 });
    }
  });
});
