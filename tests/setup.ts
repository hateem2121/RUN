import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

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
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  root = null;
  rootMargin = "";
  thresholds = [];
  takeRecords = vi.fn();
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock WebGL for gradient tests
Object.defineProperty(window, "WebGLRenderingContext", {
  writable: true,
  value: vi.fn(),
});
// Set required environment variables for tests
// P0 RESTORATION: Using Neon ephemeral test branch for deterministic integration tests
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_ifse9Lj4CwBp@ep-cold-unit-ad2tlicp-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || "test-session-secret-1234567890-32-chars-long";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-1234567890-32-chars-long";
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "test-encryption-key-32-chars-long!!!";
process.env.NODE_ENV = "test";
process.env.ENABLE_DEBUG_ROUTES = "true";
process.env.DEBUG_ROUTE_TOKEN = "test-token-123";
process.env.TEST_REAL_DB = "true"; // Enable real DB logic in server/db.ts
process.env.INITIAL_ADMIN_EMAIL = "admin@run-remix.test";
process.env.BYPASS_RBAC_FOR_TESTING = "false";
