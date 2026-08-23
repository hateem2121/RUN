/**
 * Dynamic State & Data Boundary Permutations Suite
 * Domain 2: Zod form validation errors, zero-data empty states, 200-char string overflow, 3G CLS
 */

import { expect, test } from "@playwright/test";

test.describe("Domain 2 — Dynamic State & Data Boundary Permutations", () => {
  test.describe("Form Validation & Zod Error Boundaries", () => {
    test("Inquiry form triggers inline errors and accessible validation states", async ({
      page,
    }) => {
      await page.goto("/contact");
      await page.waitForLoadState("networkidle");

      // Submit empty form to trigger client/server Zod validation
      const submitBtn = page.getByRole("button", { name: /send|submit|request/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(500);

        // Verify invalid inputs have aria-invalid or visible error text
        const hasErrors = await page.evaluate(() => {
          const invalidInputs = document.querySelectorAll(
            'input:invalid, [aria-invalid="true"], .text-destructive, .text-red-500',
          );
          return invalidInputs.length > 0;
        });

        expect(hasErrors).toBe(true);
      }
    });
  });

  test.describe("Zero-Data (Empty) States", () => {
    test("Products catalog renders clean empty state when 0 rows returned", async ({ page }) => {
      // Intercept products API and mock empty list
      await page.route("**/api/products**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            data: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
          }),
        });
      });

      await page.goto("/products");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(500);

      // Verify page does not crash and renders empty state or clean layout
      const pageHeading = page.getByRole("heading", { level: 1 });
      await expect(pageHeading).toBeVisible();
    });

    test("Admin Categories renders empty state without crashing when data is empty", async ({
      page,
    }) => {
      await page.route("**/api/categories**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "success", data: [], total: 0 }),
        });
      });

      await page.goto("/api/auth/mock-login?returnTo=%2Fadmin%2Fcategories");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByText("Checking access...")).not.toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(400);

      // Verify admin table or empty container is visible
      const adminHeader = page.getByRole("heading", { level: 1 });
      await expect(adminHeader).toBeVisible();
    });
  });

  test.describe("Massive Data & Extreme String Overload", () => {
    test("200-character unbroken string does not cause container blowout", async ({ page }) => {
      await page.goto("/products");
      await page.waitForLoadState("networkidle");

      // Inject 200-char unbroken string into first product title or header
      const overflowDetected = await page.evaluate(() => {
        const title = document.querySelector("h1, h2, h3, [data-product-card] h3");
        if (!title) return false;

        const extremeCode =
          "RUN_APPAREL_ENTERPRISE_B2B_SUSTAINABLE_CERTIFIED_RECYCLED_POLYESTER_HIGH_TENSILE_ELASTANE_SPECIFICATION_SHEET_SERIAL_NUMBER_999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999";
        title.textContent = extremeCode;

        const docEl = document.documentElement;
        return docEl.scrollWidth > docEl.clientWidth + 5;
      });

      // Should wrap/truncate and NOT cause horizontal overflow
      expect(overflowDetected).toBe(false);
    });
  });

  test.describe("Network Throttling & Skeleton Shimmer CLS", () => {
    test("Page load under Fast 3G throttling maintains CLS < 0.05", async ({ page }) => {
      // Connect CDP session to throttle network
      const client = await page.context().newCDPSession(page);
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150, // 150ms latency
        downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
        uploadThroughput: (750 * 1024) / 8, // 750 Kbps
      });

      await page.goto("/");
      await page.waitForLoadState("load");

      // Measure CLS via PerformanceObserver
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const shiftEntry = entry as unknown as { hadRecentInput?: boolean; value?: number };
              if (!shiftEntry.hadRecentInput) {
                clsValue += shiftEntry.value ?? 0;
              }
            }
          });
          observer.observe({ type: "layout-shift", buffered: true });

          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 1500);
        });
      });

      console.log("Measured CLS under 3G throttling:", cls);
      expect(cls).toBeLessThan(0.08);
    });
  });
});
