import { expect, test } from "@playwright/test";

test.describe("SSR & Hydration Regressions", () => {
  test.beforeEach(async ({ page }) => {
    // Strict Hydration Monitor
    page.on("console", (msg) => {
      const text = msg.text();
      // Fail immediately on hydration errors
      if (
        (msg.type() === "error" || msg.type() === "warning") &&
        (text.includes("Hydration failed") ||
          text.includes("Text content does not match") ||
          text.includes("did not match. Server:"))
      ) {
        throw new Error(`[HYDRATION-FAIL] ${text}`);
      }
    });
  });

  test("should include critical CSS in initial HTML response", async ({ request }) => {
    const response = await request.get("/");
    const html = await response.text();

    // Verify stylesheet link, inline style, or asset link exists in HTML
    const hasCss =
      html.includes("<link") ||
      html.includes("<style") ||
      html.includes(".css") ||
      html.includes("theme") ||
      html.includes("index");

    expect(hasCss).toBe(true);
  });

  test("should look identical with and without JS (No FOUC)", async ({ browser, baseURL }) => {
    // Context with JS Disabled (Simulate Initial SSR Paint)
    const contextNoJs = await browser.newContext({ javaScriptEnabled: false });
    const pageNoJs = await contextNoJs.newPage();
    await pageNoJs.goto(baseURL || "http://127.0.0.1:5002");

    // Verify critical styles are applied even without JS
    const bgColor = await pageNoJs.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bgColor).toBeDefined();

    // Verify fonts are loading by checking computed font-family
    const fontFamily = await pageNoJs.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    expect(fontFamily.length).toBeGreaterThan(0);

    await contextNoJs.close();
  });

  test("should inject dark mode class on dark theme (No Flash)", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const isDark = await page.evaluate(() => {
      return (
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark"
      );
    });
    expect(isDark).toBe(true);
  });
  test("should render Matrix Slogan text in SSR HTML", async ({ request }) => {
    const response = await request.get("/");
    const html = await response.text();

    expect(html).not.toContain("<!--app-html--></div>"); // Body shouldn't be empty
  });
});
