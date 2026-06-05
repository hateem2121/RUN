import { chromium } from "playwright-core";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Mobile 375px
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://localhost:5002/resources", { waitUntil: "networkidle" });
  await page.screenshot({ path: "findings/rsrc/screenshots/mobile-375px.png", fullPage: true });

  // 2. Tablet 768px
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("http://localhost:5002/resources", { waitUntil: "networkidle" });
  await page.screenshot({ path: "findings/rsrc/screenshots/tablet-768px.png", fullPage: true });

  // 3. Desktop 1440px
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:5002/resources", { waitUntil: "networkidle" });
  await page.screenshot({ path: "findings/rsrc/screenshots/desktop-1440px.png", fullPage: true });

  // 4. Admin resources
  // NOTE: Admin resources might require auth, wait let's just see if it works
  await page.goto("http://localhost:5002/admin/resources", { waitUntil: "networkidle" });
  await page.screenshot({ path: "findings/rsrc/screenshots/admin-resources.png", fullPage: true });

  await browser.close();
})();
