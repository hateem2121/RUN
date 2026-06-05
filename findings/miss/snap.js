import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const viewports = [
    { width: 375, height: 812, name: "mobile-375px" },
    { width: 768, height: 1024, name: "tablet-768px" },
    { width: 1440, height: 900, name: "desktop-1440px" },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("http://localhost:5002/blog");
    // wait a moment for animations
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `findings/miss/screenshots/${vp.name}.png` });
  }

  await browser.close();
})();
