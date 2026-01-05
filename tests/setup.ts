import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Replit database (Vitest 4.0 syntax)
vi.mock("@replit/database", () => {
  const Database = vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  }));

  return {
    Database,
    default: { Database }, // Vitest 4.0 requires explicit default export
  };
});

// Mock IntersectionObserver for 3D model tests
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
  takeRecords: vi.fn(),
}));

// Mock WebGL for gradient tests
Object.defineProperty(window, "WebGLRenderingContext", {
  writable: true,
  value: vi.fn(),
});
// Set required environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost:5432/test";
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-12345";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-12345";
process.env.NODE_ENV = "test";
process.env.ENABLE_DEBUG_ROUTES = "true";
process.env.DEBUG_ROUTE_TOKEN = "test-token-123";
