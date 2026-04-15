import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app, serverReady } from "../../server/server.js";

describe("Express 5 Async Error Propagation", () => {
  beforeAll(async () => {
    // Wait for the async bootstrap to complete
    await serverReady;
  });

  it("should return 400 with error detail for non-numeric ID params", async () => {
    // validateIdParam in server/utils.ts rejects non-numeric values with 400
    // Route: GET /api/products/:id — id must be a positive integer
    const response = await request(app).get("/api/products/abc").expect(400);

    expect(response.body).toMatchObject({
      message: expect.stringContaining("product"),
      parameter: "id",
      value: "abc",
    });
  });

  it("should return 404 when product ID is valid but product does not exist", async () => {
    // 9999999 parses as a valid positive integer but won't exist in DB
    const response = await request(app).get("/api/products/9999999").expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: expect.objectContaining({
        message: expect.stringContaining("not found"),
      }),
    });
  });
});
