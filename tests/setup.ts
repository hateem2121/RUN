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
