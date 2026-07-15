import { describe, expect, it, vi } from "vitest";

// Mock Express
vi.mock("express", () => {
  const router = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    use: vi.fn(),
  };
  return {
    Router: () => router,
    default: {
      Router: () => router,
      json: vi.fn(),
      urlencoded: vi.fn(),
    },
  };
});

import * as authRoute from "../../../server/routes/auth.js";
import * as debugRoute from "../../../server/routes/debug.js";
import * as devRoute from "../../../server/routes/dev.js";
import * as docsRoute from "../../../server/routes/docs.js";
import * as indexRoute from "../../../server/routes/index.js";
import * as metricsRoute from "../../../server/routes/metrics.js";
import * as workerRoute from "../../../server/routes/worker.js";

describe("Server Routes Auto", () => {
  it("should load auth route", () => expect(authRoute).toBeDefined());
  it("should load debug route", () => expect(debugRoute).toBeDefined());
  it("should load dev route", () => expect(devRoute).toBeDefined());
  it("should load docs route", () => expect(docsRoute).toBeDefined());
  it("should load metrics route", () => expect(metricsRoute).toBeDefined());
  it("should load worker route", () => expect(workerRoute).toBeDefined());
  it("should load index route", () => expect(indexRoute).toBeDefined());
});
