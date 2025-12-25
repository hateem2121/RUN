import { delay, HttpResponse, http } from "msw";

export const handlers = [
  // Network timeout simulation
  http.get("/api/timeout-simulation", async () => {
    await delay(10000); // 10 seconds delay
    return HttpResponse.json({ message: "Response after timeout" });
  }),

  // 500 Internal Server Error simulation
  http.get("/api/products/error-simulation", () => {
    return new HttpResponse(null, { status: 500 });
  }),

  // 404 Not Found simulation
  http.get("/api/products/404-simulation", () => {
    return new HttpResponse(null, { status: 404 });
  }),

  // Database failure simulation
  http.get("/api/db-health-check", () => {
    return HttpResponse.json({ error: "Database connection failed" }, { status: 503 });
  }),

  // Default handler for unhandled requests (optional, usually let them pass or warn)
];
