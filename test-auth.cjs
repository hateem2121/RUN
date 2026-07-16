const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on("request", (request) => console.log(">>", request.method(), request.url()));
  page.on("response", (response) => console.log("<<", response.status(), response.url()));

  await page.goto("http://localhost:5002/api/auth/mock-login");

  await page.waitForLoadState("networkidle");
  console.log("Final URL:", page.url());

  const content = await page.content();
  console.log("Content length:", content.length);
  if (content.includes("Redirecting to login")) console.log("Found redirecting message!");

  await browser.close();
})();
