const { chromium } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://localhost:5002/sustainability");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "findings/sust/screenshots/mobile-375px.png", fullPage: true });

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("http://localhost:5002/sustainability");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "findings/sust/screenshots/tablet-768px.png", fullPage: true });

  // Desktop
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto("http://localhost:5002/sustainability");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "findings/sust/screenshots/desktop-1440px.png", fullPage: true });

  // Admin pages
  await page.goto("http://localhost:5002/admin/sustainability");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "findings/sust/screenshots/admin-sustainability.png" });

  await page.goto("http://localhost:5002/admin/sustainability-initiatives");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "findings/sust/screenshots/admin-sustainability-initiatives.png" });

  await page.goto("http://localhost:5002/admin/sustainability-goals");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "findings/sust/screenshots/admin-sustainability-goals.png" });

  await browser.close();
  console.log("Screenshots captured.");
})();
