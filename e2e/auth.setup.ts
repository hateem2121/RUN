import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as setup } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate as admin", async ({ page }) => {
  // Set a reasonable timeout for navigation
  page.setDefaultTimeout(15000);

  // 1. Visit mock login which sets connect.sid session cookie and redirects to /admin
  await page.goto("/api/auth/mock-login", { waitUntil: "commit" });

  // Wait for URL to change to /admin with reload fallback
  try {
    await page.waitForURL("**/admin**", { timeout: 10000 });
  } catch {
    await page.reload({ waitUntil: "commit" });
    await page.waitForURL("**/admin**", { timeout: 15000 });
  }

  await page.waitForLoadState("domcontentloaded");

  // Wait for "Checking access..." to disappear (admin page loading indicator)
  try {
    await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 8000 });
  } catch {
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 20000 });
  }

  // 2. Save storage state with authenticated session cookies
  await page.context().storageState({ path: authFile });
});
