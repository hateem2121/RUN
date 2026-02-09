import { test } from "@playwright/test";

test.describe("Homepage Forensic Baseline", () => {
  test("Capture Baseline - Light Mode", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(2000); // Wait for preloader/animations
    await page.screenshot({ path: "artifacts/hp-light.png", fullPage: true });

    const consoleLogs: string[] = [];
    page.on("console", (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    await page.reload();
    await page.waitForTimeout(2000);

    const _domSnapshot = await page.evaluate(() => {
      return {
        htmlClasses: document.documentElement.className,
        bodyStyles: window.getComputedStyle(document.body).cssText,
        mainStyles: window.getComputedStyle(document.querySelector("main")!).cssText,
      };
    });
  });

  test("Capture Baseline - Dark Mode", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ colorScheme: "dark" });
    // Some apps use a class on html/body for dark mode
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "artifacts/hp-dark.png", fullPage: true });
  });

  test("Check Hydration and Viewports", async ({ page }) => {
    const viewports = [
      { width: 360, height: 800 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
      { width: 1536, height: 864 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto("/");
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `artifacts/hp-${vp.width}x${vp.height}.png` });
    }
  });
});
