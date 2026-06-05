const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://localhost:5002/analytics", { waitUntil: "networkidle" });
  await page.screenshot({ path: "findings/anlx/screenshots/mobile-375px.png", fullPage: true });

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("http://localhost:5002/analytics", { waitUntil: "networkidle" });
  await page.screenshot({ path: "findings/anlx/screenshots/tablet-768px.png", fullPage: true });

  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:5002/analytics", { waitUntil: "networkidle" });
  await page.screenshot({ path: "findings/anlx/screenshots/desktop-1440px.png", fullPage: true });

  // Admin
  await page.goto("http://localhost:5002/admin/analytics", { waitUntil: "networkidle" });
  await page.screenshot({ path: "findings/anlx/screenshots/admin-analytics.png", fullPage: true });

  await browser.close();
})();
