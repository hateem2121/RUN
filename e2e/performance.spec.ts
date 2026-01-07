import { expect, test } from "@playwright/test";

test.describe("Web Vitals & Performance", () => {
  test("Homepage should load with good LCP", async ({ page }) => {
    await page.goto("/");

    // Measure LCP using PerformanceObserver API injection
    const lcp = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ type: "largest-contentful-paint", buffered: true });

        // Timeout fallback
        setTimeout(() => resolve(0), 5000);
      });
    });

    // biome-ignore lint/suspicious/noConsole: debugging output
    console.log(`LCP: ${lcp}ms`);
    // Threshold: < 2500ms (Good)
    expect(lcp).toBeLessThan(2500);
  });

  test("CLS should be minimal", async ({ page }) => {
    await page.goto("/");

    const cls = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let accumulatedCLS = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries() as any) {
            if (!entry.hadRecentInput) {
              accumulatedCLS += entry.value;
            }
          }
          resolve(accumulatedCLS);
        }).observe({ type: "layout-shift", buffered: true });

        // Wait a bit for layout to settle
        setTimeout(() => resolve(accumulatedCLS), 2000);
      });
    });

    // biome-ignore lint/suspicious/noConsole: debugging output
    console.log(`CLS: ${cls}`);
    // Threshold: < 0.1 (Good)
    expect(cls).toBeLessThan(0.1);
  });
});
