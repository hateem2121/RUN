import { chromium } from "playwright-core";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto("http://localhost:5002/");

  // Wait a bit for animations
  await page.waitForTimeout(2000);

  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({
    path: "/Users/hateemjamshaid/Sites/RUN/findings/home/screenshots/desktop-1440px.png",
    fullPage: true,
  });

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({
    path: "/Users/hateemjamshaid/Sites/RUN/findings/home/screenshots/tablet-768px.png",
    fullPage: true,
  });

  // Mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: "/Users/hateemjamshaid/Sites/RUN/findings/home/screenshots/mobile-375px.png",
    fullPage: true,
  });

  // Admin pages
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:5002/admin/homepage-hero");
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "/Users/hateemjamshaid/Sites/RUN/findings/home/screenshots/admin-homepage-hero.png",
    fullPage: true,
  });

  await page.goto("http://localhost:5002/admin/homepage-slogans");
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "/Users/hateemjamshaid/Sites/RUN/findings/home/screenshots/admin-homepage-slogans.png",
    fullPage: true,
  });

  await page.goto("http://localhost:5002/admin/homepage-sections");
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "/Users/hateemjamshaid/Sites/RUN/findings/home/screenshots/admin-homepage-sections.png",
    fullPage: true,
  });

  await browser.close();
})();
