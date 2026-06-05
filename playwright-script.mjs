import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto("http://localhost:5002/admin");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "findings/admn/screenshots/desktop-1440px.png" });

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "findings/admn/screenshots/tablet-768px.png" });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "findings/admn/screenshots/mobile-375px.png" });

  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto("http://localhost:5002/admin/manufacturing-hero");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "findings/admn/screenshots/admin-manufacturing-hero.png" });

  await page.goto("http://localhost:5002/admin/products");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "findings/admn/screenshots/admin-products.png" });

  await browser.close();
})();
