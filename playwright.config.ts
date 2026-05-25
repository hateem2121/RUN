import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60 * 1000, // 60s for visual regression tests
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
      threshold: 0.3,
    },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: undefined,
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  snapshotDir: "./e2e/__snapshots__",
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",
  use: {
    actionTimeout: 15000,
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5002",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    // Synchronize User-Agent to avoid SESSION_UA_MISMATCH
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Playwright/E2E",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "diagnostic",
      testMatch: /diagnostic-auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "cd server && npx tsx index.ts",
    url: "http://127.0.0.1:5002/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: "development",
      ENABLE_OTEL: "false",
      SKIP_SECRET_MANAGER: "true",
      PORT: "5002",
      DOTENV_CONFIG_PATH: "../.env",
      SKIP_VITE_DEV_SERVER: "true",
    },
  },
});
