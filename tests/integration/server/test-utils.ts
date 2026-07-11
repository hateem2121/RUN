import type { Server } from "node:http";
import type { UpsertUser, User } from "@run-remix/shared";
import express from "express";
import { setupErrorHandling, setupMiddleware } from "../../../server/boot/middleware.js";
import { adminCacheManager } from "../../../server/lib/cache/admin-cache.js";
import { logger } from "../../../server/lib/monitoring/logger.js";
import { getStorage, StorageSingleton } from "../../../server/lib/storage-singleton.js";
import type { SessionUser } from "../../../server/types/session.js";
import { MemoryStorage } from "./memory-storage.js";

/**
 * Test middleware to inject a user into the request based on a header
 * Use 'X-Test-User' header with a JSON string of the user object
 */
const testAuthMiddleware: express.RequestHandler = (req, _res, next) => {
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
    process.env.ENABLE_MOCK_ADMIN = "true";

    // Baseline Data Seeding for common endpoints in api-audit.test.ts
    // -------------------------------------------------------------------------

    // Seeding Certificates
    await testStorage.createCertificate({
      name: "Global Recycled Standard (GRS)",
      description: "Certifying recycled content",
      imageId: null,
      isActive: true,
    });

    // Seeding Fabrics
    await testStorage.createFabric({
      name: "AERO-CORE Performance Mesh",
      description: "Lightweight moisture-wicking fabric",
      weight: "120gsm",
      isActive: true,
    });

    // Seeding Fibers
    await testStorage.createFiber({
      name: "Recycled Polyester",
      type: "synthetic",
      description: "Post-consumer waste transformation",
      isActive: true,
    });

    // Seeding Size Charts
    await testStorage.createSizeChart({
      name: "Standard Size Chart",
      measurements: {
        tables: [{ title: "Tops", rows: [], columns: [] }],
      },
      isActive: true,
    });

    // Seeding About Page Content
    await testStorage.updateAboutHero({
      title: "Our Story",
      subtitle: "Heritage of Excellence",
      imageId: null,
      isActive: true,
    });

    await testStorage.createAboutTimelineEntry({
      year: "1889",
      title: "The Beginning",
      description: "Durus Industries founded",
      imageId: null,
      isActive: true,
    });

    await testStorage.createAboutMapLocation({
      name: "Sialkot Facility",
      city: "Sialkot",
      country: "Pakistan",
      latitude: "32.4900000000",
      longitude: "74.5200000000",
      type: "Manufacturing",
      isActive: true,
    });

    await testStorage.createAboutSection({
      sectionType: "content",
      title: "Craftsmanship",
      content: "Deeply rooted in Sialkot's tradition of precision manufacturing.",
      imageId: null,
      isActive: true,
      sortOrder: 0,
    });

    await testStorage.createAboutStatistic({
      label: "Years of Experience",
      value: "135+",
      isActive: true,
      sortOrder: 0,
    });
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

  // Inject services for RBAC Dependency Injection
  const { AdminService } = await import("../../../server/services/admin/admin.service.js");
  const adminService = new AdminService();
  app.set("adminService", adminService);

  // Inject test auth middleware AFTER standard middleware but BEFORE routes
  // This ensures it overrides any session-based identity
  app.use(testAuthMiddleware);

  // Note: setupRoutes usually includes SSR which we might want to skip or mock for integration tests
  // For API integration tests, we can just register the routers directly if needed,
  // but setupRoutes is more comprehensive.
  const { setupRoutes } = await import("../../../server/boot/routes.js");
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
    failedLoginAttempts: 0,
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
      isMock: true,
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
    // biome-ignore lint/suspicious/noExplicitAny: augmenting Express request in test utilities
    (req as any).user = user;
    // biome-ignore lint/suspicious/noExplicitAny: augmenting Express request in test utilities
    (req as any).isAuthenticated = (): this is { user: SessionUser } => true;
    next();
  };
}

/**
 * Utility to create a test user in the database
 */
async function createTestUser(userData: Partial<UpsertUser> = {}): Promise<User> {
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

  getStorage();
  // Implementation depends on storage exposed methods
  // For now, this is a placeholder
  logger.info("[TestUtils] Database cleanup requested");
}
