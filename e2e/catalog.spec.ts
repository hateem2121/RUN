/**
 * e2e/catalog.spec.ts
 * Phase 1A — Public Catalog Routes (all 5) + Phase 1B — Dynamic Route Edge Cases
 *
 * Seed-data constants (real rows from DB):
 *   - Category: "Athletic Wear" | slug: "athletic-wear" | id: 36
 *   - Product:  "Pro Performance Running Shirt" | slug: "pro-performance-running-shirt" | id: 49 | categoryId: 36
 *
 * The product detail route looks up products by `products.urlPath` column (which is null
 * for all seeded rows).  Each product-detail test patches urlPath at the start and resets
 * it in a finally block so the DB is left clean.
 *
 * Auth: .auth/user.json  (set by e2e/auth.setup.ts) — used for urlPath admin PATCH only.
 * Public catalog routes (/products, /categories, …) do not require auth.
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const BASE = "http://localhost:5002";

// ─── Seed-data identifiers ───────────────────────────────────────────────────
const PRODUCT_ID = 49;
const CATEGORY_SLUG = "athletic-wear";
const PRODUCT_SLUG = "pro-performance-running-shirt";
const PRODUCT_URL_PATH = `/categories/${CATEGORY_SLUG}/${PRODUCT_SLUG}`;

// ─── Admin auth (used only for urlPath PATCH helper) ─────────────────────────
test.use({ storageState: ".auth/user.json" });

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function patchProductUrlPath(
  page: import("@playwright/test").Page,
  productId: number,
  urlPath: string | null,
): Promise<void> {
  const status = await page.evaluate(
    async (data) => {
      const csrfToken =
        document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("csrf_token="))
          ?.split("=")[1] ?? "";
      const resp = await fetch(`/api/products/${data.productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ urlPath: data.urlPath }),
      });
      return resp.status;
    },
    { productId, urlPath },
  );
  if (status !== 200 && status !== 201) {
    console.warn(`[catalog setup] PATCH /api/products/${productId} returned ${status}`);
  }
}

/** Warm up the authenticated session so CSRF cookies are hydrated */
async function warmSession(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(`${BASE}/admin/homepage`);
  await page.waitForLoadState("networkidle");
}

// ── Phase 1A — /products ──────────────────────────────────────────────────────
test.describe("/products", () => {
  test("loads HTTP 200", async ({ page }) => {
    const resp = await page.goto(`${BASE}/products`);
    expect(resp?.status()).toBe(200);
  });

  test("at least one product card renders", async ({ page }) => {
    await page.goto(`${BASE}/products`);
    await page.waitForLoadState("networkidle");
    // After getProductsSummary fix, SSR + hydration renders product cards
    const cards = page.locator("a[href*='/categories/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("each visible product card has content", async ({ page }) => {
    await page.goto(`${BASE}/products`);
    await page.waitForLoadState("networkidle");
    const cards = page.locator("a[href*='/categories/']");
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const hasContent = await cards.first().evaluate((el) => el.innerText.trim().length > 0);
    expect(hasContent).toBe(true);
  });

  test("no critical console errors on /products", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${BASE}/products`);
    await page.waitForLoadState("networkidle");
    const criticalErrors = errors.filter(
      (e) => !e.includes("unsplash") && !e.includes("api/media"),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("no horizontal overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/products`);
    await page.waitForLoadState("domcontentloaded");
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(380);
  });

  test("accessibility: zero critical violations on /products", async ({ page }) => {
    await page.goto(`${BASE}/products`);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    const criticals = results.violations.filter((v) => v.impact === "critical");
    expect(criticals).toHaveLength(0);
  });
});

// ── Phase 1A — /categories ────────────────────────────────────────────────────
test.describe("/categories", () => {
  test("loads HTTP 200", async ({ page }) => {
    const resp = await page.goto(`${BASE}/categories`);
    expect(resp?.status()).toBe(200);
  });

  test("at least one category renders", async ({ page }) => {
    await page.goto(`${BASE}/categories`);
    await page.waitForLoadState("networkidle");
    // Categories render as h2 headings (with or without featured content)
    const headings = page.locator("h1, h2");
    await expect(headings.first()).toBeVisible({ timeout: 10000 });
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test("page title renders 'Product Categories'", async ({ page }) => {
    await page.goto(`${BASE}/categories`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Product Categories")).toBeVisible({ timeout: 10000 });
  });

  test("no horizontal overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/categories`);
    await page.waitForLoadState("domcontentloaded");
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(380);
  });

  test("accessibility: zero critical violations on /categories", async ({ page }) => {
    await page.goto(`${BASE}/categories`);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    const criticals = results.violations.filter((v) => v.impact === "critical");
    expect(criticals).toHaveLength(0);
  });
});

// ── Phase 1A — /categories/:slug ─────────────────────────────────────────────
test.describe("/categories/:slug", () => {
  test("loads HTTP 200 for real slug", async ({ page }) => {
    const resp = await page.goto(`${BASE}/categories/${CATEGORY_SLUG}`);
    expect(resp?.status()).toBe(200);
  });

  test("category title renders on detail page", async ({ page }) => {
    await page.goto(`${BASE}/categories/${CATEGORY_SLUG}`);
    await page.waitForLoadState("networkidle");
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    const text = await heading.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test("link to /categories/:slug/products is present or products listed inline", async ({
    page,
  }) => {
    await page.goto(`${BASE}/categories/${CATEGORY_SLUG}`);
    await page.waitForLoadState("networkidle");
    const productsLink = page.locator(
      `a[href='/categories/${CATEGORY_SLUG}/products'], a[href*='products']`,
    );
    const productCards = page.locator("a[href*='/categories/']");
    const hasLink = (await productsLink.count()) > 0;
    const hasCards = (await productCards.count()) > 0;
    expect(hasLink || hasCards).toBe(true);
  });

  test("no horizontal overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/categories/${CATEGORY_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(380);
  });
});

// ── Phase 1A — /categories/:slug/products ────────────────────────────────────
test.describe("/categories/:slug/products", () => {
  test("loads HTTP 200", async ({ page }) => {
    const resp = await page.goto(`${BASE}/categories/${CATEGORY_SLUG}/products`);
    expect(resp?.status()).toBe(200);
  });

  test("products list renders — at least one product", async ({ page }) => {
    await page.goto(`${BASE}/categories/${CATEGORY_SLUG}/products`);
    await page.waitForLoadState("networkidle");
    const productItems = page.locator(
      "a[href*='/categories/'], [class*='card'], [class*='product']",
    );
    await expect(productItems.first()).toBeVisible({ timeout: 10000 });
  });

  test("no horizontal overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/categories/${CATEGORY_SLUG}/products`);
    await page.waitForLoadState("domcontentloaded");
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(380);
  });

  test("accessibility: zero critical violations", async ({ page }) => {
    await page.goto(`${BASE}/categories/${CATEGORY_SLUG}/products`);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    const criticals = results.violations.filter((v) => v.impact === "critical");
    expect(criticals).toHaveLength(0);
  });
});

// ── Phase 1A — /categories/:category/:product ─────────────────────────────────
test.describe("/categories/:category/:product", () => {
  // Each test here patches urlPath at the start (using the page fixture which
  // has the correct auth session from test.use({ storageState })) and resets
  // it in a finally block.

  test("loads HTTP 200 after urlPath is set on product", async ({ page }) => {
    await warmSession(page);
    await patchProductUrlPath(page, PRODUCT_ID, PRODUCT_URL_PATH);
    try {
      const resp = await page.goto(`${BASE}${PRODUCT_URL_PATH}`);
      expect(resp?.status()).toBe(200);
    } finally {
      await warmSession(page);
      await patchProductUrlPath(page, PRODUCT_ID, null);
    }
  });

  test("product name renders in heading", async ({ page }) => {
    await warmSession(page);
    await patchProductUrlPath(page, PRODUCT_ID, PRODUCT_URL_PATH);
    try {
      await page.goto(`${BASE}${PRODUCT_URL_PATH}`);
      await page.waitForLoadState("networkidle");
      const heading = page.locator("h1").first();
      await expect(heading).toBeVisible({ timeout: 15000 });
      const text = (await heading.innerText()).trim();
      expect(text.length).toBeGreaterThan(0);
    } finally {
      await warmSession(page);
      await patchProductUrlPath(page, PRODUCT_ID, null);
    }
  });

  test("product description visible", async ({ page }) => {
    await warmSession(page);
    await patchProductUrlPath(page, PRODUCT_ID, PRODUCT_URL_PATH);
    try {
      await page.goto(`${BASE}${PRODUCT_URL_PATH}`);
      await page.waitForLoadState("networkidle");
      const descriptionEl = page.locator("p").first();
      await expect(descriptionEl).toBeVisible({ timeout: 10000 });
    } finally {
      await warmSession(page);
      await patchProductUrlPath(page, PRODUCT_ID, null);
    }
  });

  test("no hydration mismatch errors", async ({ page }) => {
    await warmSession(page);
    await patchProductUrlPath(page, PRODUCT_ID, PRODUCT_URL_PATH);
    try {
      const hydrationErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" && msg.text().toLowerCase().includes("hydrat")) {
          hydrationErrors.push(msg.text());
        }
      });
      await page.goto(`${BASE}${PRODUCT_URL_PATH}`);
      await page.waitForLoadState("networkidle");
      expect(hydrationErrors).toHaveLength(0);
    } finally {
      await warmSession(page);
      await patchProductUrlPath(page, PRODUCT_ID, null);
    }
  });

  test("model-viewer: no console errors if 3D model absent (graceful fallback)", async ({
    page,
  }) => {
    await warmSession(page);
    await patchProductUrlPath(page, PRODUCT_ID, PRODUCT_URL_PATH);
    try {
      const modelErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" && msg.text().includes("model-viewer")) {
          modelErrors.push(msg.text());
        }
      });
      await page.goto(`${BASE}${PRODUCT_URL_PATH}`);
      await page.waitForLoadState("networkidle");
      expect(modelErrors).toHaveLength(0);
    } finally {
      await warmSession(page);
      await patchProductUrlPath(page, PRODUCT_ID, null);
    }
  });

  test("no horizontal overflow at 375px", async ({ page }) => {
    await warmSession(page);
    await patchProductUrlPath(page, PRODUCT_ID, PRODUCT_URL_PATH);
    try {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`${BASE}${PRODUCT_URL_PATH}`);
      await page.waitForLoadState("domcontentloaded");
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(380);
    } finally {
      await warmSession(page);
      await patchProductUrlPath(page, PRODUCT_ID, null);
    }
  });

  test("accessibility: zero critical violations", async ({ page }) => {
    await warmSession(page);
    await patchProductUrlPath(page, PRODUCT_ID, PRODUCT_URL_PATH);
    try {
      await page.goto(`${BASE}${PRODUCT_URL_PATH}`);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"])
        .analyze();
      const criticals = results.violations.filter((v) => v.impact === "critical");
      expect(criticals).toHaveLength(0);
    } finally {
      await warmSession(page);
      await patchProductUrlPath(page, PRODUCT_ID, null);
    }
  });
});

// ── Phase 1B — Dynamic Route 404 Edge Cases ───────────────────────────────────
test.describe("404 edge cases — graceful errors (no crash)", () => {
  test("/categories/nonexistent-slug returns graceful page (not crash)", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const resp = await page.goto(`${BASE}/categories/nonexistent-slug-xyz-404`);
    const status = resp?.status() ?? 0;
    expect([200, 404]).toContain(status);
    const body = await page.locator("body").innerText();
    expect(body.trim().length).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test("/categories/nonexistent/products returns graceful page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const resp = await page.goto(`${BASE}/categories/nonexistent-slug-xyz-404/products`);
    const status = resp?.status() ?? 0;
    expect([200, 404]).toContain(status);
    const body = await page.locator("body").innerText();
    expect(body.trim().length).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test("/categories/real-category/bad-product returns graceful error (not blank crash)", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const resp = await page.goto(`${BASE}/categories/${CATEGORY_SLUG}/definitely-does-not-exist`);
    expect(resp).toBeDefined();
    const body = await page.locator("body").innerText();
    expect(body.trim().length).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
    expect(body).not.toMatch(/^\s*$/);
  });
});
