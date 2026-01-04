import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60 * 1000, // 60s for visual regression tests
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02, // 2% threshold for visual diffs
      animations: "disabled", // Disable animations for stable screenshots
      threshold: 0.2, // Pixel-level threshold
    },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: undefined, // Fully parallel in all environments
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  // Snapshot paths - baselines committed to repo
  snapshotDir: "./e2e/__snapshots__",
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",
  use: {
    actionTimeout: 10000,
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5001",
    // Reliability: retain traces only on failure (keeps CI artifacts small)
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
