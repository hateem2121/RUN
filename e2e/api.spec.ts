import { expect, test } from "@playwright/test";

const BASE_URL = "http://localhost:5002";

test.describe("API Integration: Secondary Pages", () => {
  const publicEndpoints = [
    "/api/navigation-items",
    "/api/navigation-settings",
    "/api/media",
    "/api/about-hero",
    "/api/about-locations",
    "/api/sustainability",
    "/api/manufacturing-hero",
  ];

  for (const endpoint of publicEndpoints) {
    test(`GET ${endpoint} returns 200 and valid JSON`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${endpoint}`);
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toBeDefined();
    });
  }

  test("GET /api/media handles pagination", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/media?limit=5&page=1`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    if (Array.isArray(data)) {
      expect(data.length).toBeLessThanOrEqual(5);
    }
  });

  test("GET /api/navigation-items has expected structure", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/navigation-items`);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("label");
      expect(data[0]).toHaveProperty("href");
    }
  });
});
