import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test as setup } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate as admin", async ({ page }) => {
  // 0. Listen to console logs to catch React errors
  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("BROWSER PAGE ERROR:", err.message));

  // 1. Visit mock login
  await page.goto("/api/auth/mock-login");

  // 2. Wait for redirect to /admin
  await page.waitForURL("**/admin");

  // 3. Wait for the "Checking access..." loading screen to disappear
  // If it's stuck due to Vite 504, we reload once
  try {
    await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 10000 });
  } catch (_e) {
    console.log("Stuck on 'Checking access...', reloading...");
    await page.reload();
    await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 15000 });
  }

  // 4. Verify the Admin Console is loaded (wait for the sidebar nav to appear)
  await expect(async () => {
    // Check for either the visible text or the title attribute when collapsed
    const dashboard = page.locator('a[title="Dashboard"], a:has-text("Dashboard")').first();
    if (!(await dashboard.isVisible())) {
      console.log("Dashboard not visible! Current URL:", page.url());
      const navHtml = await page
        .locator("nav")
        .innerHTML()
        .catch(() => "nav not found");
      console.log("NAV HTML:", navHtml);
      await page.reload();
    }
    await expect(dashboard).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 30000 });

  // 5. Save storage state
  await page.context().storageState({ path: authFile });
});
