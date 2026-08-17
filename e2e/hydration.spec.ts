import { expect, test } from "@playwright/test";

function isHydrationError(msgText: string): boolean {
  const lower = msgText.toLowerCase();
  return (
    lower.includes("hydration failed") ||
    lower.includes("text content does not match") ||
    lower.includes("did not match. server:") ||
    lower.includes("prop `classname` did not match") ||
    lower.includes("a tree hydrated but some attributes")
  );
}

test.describe("Hydration & SSR Safety", () => {
  test("should not have any hydration mismatches or console errors on homepage", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (isHydrationError(text)) {
        consoleErrors.push(text);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    expect(consoleErrors).toEqual([]);
  });

  test("should load category page without hydration errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (isHydrationError(text)) {
        consoleErrors.push(text);
      }
    });

    await page.goto("/categories");
    await page.waitForLoadState("domcontentloaded");
    expect(consoleErrors).toEqual([]);
  });

  test("should load product detail page without hydration errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (isHydrationError(text)) {
        consoleErrors.push(text);
      }
    });

    await page.goto("/products");
    await page.waitForLoadState("domcontentloaded");
    expect(consoleErrors).toEqual([]);
  });

  test("should load resources page without hydration errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (isHydrationError(text)) {
        consoleErrors.push(text);
      }
    });

    await page.goto("/about");
    await page.waitForLoadState("domcontentloaded");
    expect(consoleErrors).toEqual([]);
  });

  test("should check for CSP violations", async ({ page }) => {
    const securityViolations: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("Content Security Policy") || text.includes("refused to execute")) {
        securityViolations.push(text);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const criticalViolations = securityViolations.filter(
      (v) =>
        v.includes("refused to execute inline script") || v.includes("refused to load the script"),
    );

    expect(criticalViolations).toEqual([]);
  });

  test("should not have hydration errors with localStorage state (Zustand persist)", async ({
    page,
    context,
  }) => {
    await context.addInitScript(() => {
      localStorage.setItem(
        "quote-storage",
        JSON.stringify({
          state: {
            items: [{ id: 1, name: "Test Product", quantity: 10, minOrderQuantity: 1 }],
            isDrawerOpen: false,
          },
          version: 0,
        }),
      );
    });

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (isHydrationError(text)) {
        consoleErrors.push(text);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);

    expect(consoleErrors).toEqual([]);
  });
});
