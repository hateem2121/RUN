import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app, serverReady } from "../../server/server.js";

describe("Express 5 Async Error Propagation", () => {
  beforeAll(async () => {
    // Wait for the async bootstrap to complete
    await serverReady;
  });

  it("should catch Zod validation errors in async params via global errorHandler", async () => {
    // MediaIdParamSchema: id: z.coerce.number().positive()
    // Path is /api/:id (no /media prefix in this specific router mount)
    const response = await request(app).get("/api/abc").expect(400);

    expect(response.body).toMatchObject({
      status: "fail",
      code: "VALIDATION_ERROR",
    });
  });

  it("should handle Not Found errors in async routes natively", async () => {
    // 9999999 is a positive number but won't exist in DB
    const response = await request(app).get("/api/9999999").expect(404);

    expect(response.body).toMatchObject({
      status: "fail",
      code: "RESOURCE_NOT_FOUND",
    });
  });
});
