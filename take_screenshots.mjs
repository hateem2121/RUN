import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = "http://localhost:5002";
  const outputDir = "/Users/hateemjamshaid/Sites/RUN/findings/mfgi/screenshots";

  try {
    console.log("Navigating to manufacturing page...");
    await page.goto(`${baseUrl}/manufacturing`, { waitUntil: "networkidle" });

    console.log("Taking desktop screenshot...");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(2000); // wait for animations
    await page.screenshot({ path: `${outputDir}/desktop-1440px.png`, fullPage: true });

    console.log("Taking tablet screenshot...");
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${outputDir}/tablet-768px.png`, fullPage: true });

    console.log("Taking mobile screenshot...");
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${outputDir}/mobile-375px.png`, fullPage: true });

    const adminModules = [
      "manufacturing-hero",
      "manufacturing-processes",
      "manufacturing-capabilities",
      "manufacturing-qualities",
      "manufacturing-case-studies",
    ];

    await page.setViewportSize({ width: 1440, height: 900 });
    for (const mod of adminModules) {
      console.log(`Navigating to admin/${mod}...`);
      await page.goto(`${baseUrl}/admin/${mod}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${outputDir}/admin-${mod}.png` });
    }
  } catch (error) {
    console.error("Screenshot error:", error);
  } finally {
    await browser.close();
  }
}

run();
