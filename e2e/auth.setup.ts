import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as setup } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate as admin", async ({ page }) => {
  // 1. Visit mock login which sets connect.sid session cookie and redirects to /admin
  await page.goto("/api/auth/mock-login");
  await page.waitForURL("**/admin**");
  await page.waitForLoadState("domcontentloaded");

  // 2. Save storage state with authenticated session cookies
  await page.context().storageState({ path: authFile });
});
