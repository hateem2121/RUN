import { test } from "@playwright/test";

test("diagnostic: check auth session", async ({ page }) => {
  // Listen for console logs
  page.on("console", (msg) => console.log(`BROWSER LOG: ${msg.text()}`));

  // Listen for network responses
  page.on("response", (response) => {
    if (response.url().includes("/api/auth/user")) {
      console.log(`AUTH API RESPONSE (${response.status()}):`);
      response
        .json()
        .then((data) => console.log(JSON.stringify(data)))
        .catch(() => {});
    }
  });

  console.log("Navigating to mock-login...");
  await page.goto("/api/mock-login");

  console.log("Waiting for URL to be /admin...");
  await page.waitForURL("**/admin", { timeout: 15000 });

  console.log("Current URL:", page.url());

  // Wait for 10 seconds to see if state changes
  console.log("Waiting 10s for hydration...");
  await page.waitForTimeout(10000);

  const content = await page.textContent("body");
  console.log("Body content preview:", content?.substring(0, 100));
});
