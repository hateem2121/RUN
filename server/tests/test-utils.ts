import type { Server } from "node:http";
import type { UpsertUser, User } from "@run-remix/shared";
import express from "express";
import { setupErrorHandling, setupMiddleware } from "../boot/middleware.js";
import { adminCacheManager } from "../lib/cache/admin-cache.js";
import { logger } from "../lib/monitoring/logger.js";
import { getStorage, StorageSingleton } from "../lib/storage-singleton.js";
import type { SessionUser } from "../types/session.js";
import { MemoryStorage } from "./memory-storage.js";

/**
 * Test middleware to inject a user into the request based on a header
 * Use 'X-Test-User' header with a JSON string of the user object
 */
export const testAuthMiddleware: express.RequestHandler = (req, _res, next) => {
  const testUserHeader = req.headers["x-test-user"];
  if (testUserHeader && typeof testUserHeader === "string") {
    try {
      req.user = JSON.parse(testUserHeader) as SessionUser;
      (req as unknown as { isAuthenticated: () => boolean }).isAuthenticated = () => true;
    } catch (_e) {
      logger.error("[TestUtils] Failed to parse X-Test-User header");
    }
  }
  next();
};

/**
 * Setup a test app instance with all middleware and routes
 * Optionally provide a storage instance to use
 */
export async function setupTestApp(storage?: MemoryStorage) {
  const app = express();
  app.use(express.json());

  // Use memory storage for integration tests if enabled
  if (process.env.NODE_ENV === "test") {
    const testStorage = storage || new MemoryStorage();
    StorageSingleton.setInstance(testStorage);
    // Clear admin cache to ensure fresh state for each test run
    adminCacheManager.clear();
  }

  // Global test middleware
  app.use((req, _res, next) => {
    // Bypass CSRF for tests
    (req as unknown as { _skipCsrf?: boolean })._skipCsrf = true;
    next();
  });

  // Setup standard middleware
  // Note: setupMiddleware includes authService.setup(app) internally
  await setupMiddleware(app);

  // Inject test auth middleware AFTER standard middleware but BEFORE routes
  // This ensures it overrides any session-based identity
  app.use(testAuthMiddleware);

  // Note: setupRoutes usually includes SSR which we might want to skip or mock for integration tests
  // For API integration tests, we can just register the routers directly if needed,
  // but setupRoutes is more comprehensive.
  const { setupRoutes } = await import("../boot/routes.js");
  // We pass a mock httpServer if needed, but for supertest 'app' is enough
  await setupRoutes(app, {} as unknown as Server);

  setupErrorHandling(app);

  return app;
}

/**
 * Creates a mock SessionUser for use in authenticated requests
 */
export function createMockSessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  const base = {
    id: "test-user-id",
    email: "test@wear-run.com",
    emailIndex: "test-user-index",
    isAdmin: false,
    firstName: "Test",
    lastName: "User",
    profileImageUrl: "https://example.com/image.jpg",
    failedLoginAttempts: "0",
    lockoutUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const combined = { ...base, ...overrides };

  return {
    ...combined,
    claims: {
      sub: combined.id,
      email: combined.email,
      ...overrides.claims,
    },
  } as SessionUser;
}

/**
 * Helper to bypass authentication in tests by injecting a user into the request
 * This should be used as middleware in the test app
 */
export function withAuthenticatedUser(user: SessionUser) {
  return (
    req: import("express").Request,
    _res: import("express").Response,
    next: import("express").NextFunction,
  ) => {
    (req as any).user = user;
    (req as any).isAuthenticated = function(): this is { user: SessionUser } {
      return true;
    };
    next();
  };
}

/**
 * Utility to create a test user in the database
 */
export async function createTestUser(userData: Partial<UpsertUser> = {}): Promise<User> {
  const storage = getStorage();
  const defaultUser: UpsertUser = {
    id: `test-user-${Math.random().toString(36).substring(7)}`,
    email: `test-${Math.random().toString(36).substring(7)}@wear-run.com`,
    firstName: "Test",
    lastName: "User",
    profileImageUrl: "https://example.com/image.jpg",
    isAdmin: false,
  };

  return await storage.upsertUser({ ...defaultUser, ...userData });
}

/**
 * Utility to create a test admin user
 */
export async function createTestAdmin(userData: Partial<UpsertUser> = {}): Promise<User> {
  return await createTestUser({ ...userData, isAdmin: true });
}

/**
 * Cleanup database after tests (optional, depends on if using real DB)
 */
export async function cleanupDatabase() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Cleanup allowed only in test environment");
  }

  const _storage = getStorage();
  // Implementation depends on storage exposed methods
  // For now, this is a placeholder
  logger.info("[TestUtils] Database cleanup requested");
}
