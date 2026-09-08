import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import { ok } from "neverthrow";
import passport from "passport";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import authRouter from "../../routes/auth.js";
import { authService } from "../../services/system/auth.service.js";
import type { SessionUser } from "../../types/session.js";

// Mock DrizzleSessionStore with an in-memory session map for fast, DB-independent route tests
const sharedSessions = new Map<string, session.SessionData>();

vi.mock("../../lib/db/session-store.js", () => {
  class MockSessionStore extends session.Store {
    override get(
      sid: string,
      callback: (err: unknown, session?: session.SessionData | null) => void,
    ) {
      callback(null, sharedSessions.get(sid) ?? null);
    }
    override set(
      sid: string,
      sessionData: session.SessionData,
      callback?: (err?: unknown) => void,
    ) {
      sharedSessions.set(sid, sessionData);
      callback?.();
    }
    override destroy(sid: string, callback?: (err?: unknown) => void) {
      sharedSessions.delete(sid);
      callback?.();
    }
    pruneExpired() {
      return { match: () => {} };
    }
  }

  return { DrizzleSessionStore: MockSessionStore };
});

vi.mock("../../lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Set required environment variables
process.env.NODE_ENV = "test";
process.env.ENABLE_MOCK_ADMIN = "true";
process.env.SESSION_SECRET = "test-session-secret-must-be-at-least-32-chars-long";

describe("Mock Login Acceleration & Session Serialization (Task 7)", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    sharedSessions.clear();
    authService.resetMockUserSeeded();

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Use the actual AuthService.setup pipeline (Passport, session, serialize/deserialize)
    await authService.setup(app);

    app.use("/api/auth", authRouter);
  });

  describe("Fast Mock Login Invariant", () => {
    it("completes mock login in under 200ms and returns 200 with session cookie", async () => {
      const start = performance.now();
      const response = await request(app)
        .get("/api/auth/mock-login")
        .set("Accept", "application/json");
      const duration = performance.now() - start;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe("mock-admin-id");

      // Verify session cookie was set
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies[0]).toMatch(/connect\.sid=/);

      // Verify fast execution duration (< 200ms in test environment)
      expect(duration).toBeLessThan(200);
    });

    it("serializes only minimal { id, isMock } payload into session store", async () => {
      const response = await request(app)
        .get("/api/auth/mock-login")
        .set("Accept", "application/json");

      expect(response.status).toBe(200);

      // Extract session ID from cookie header: connect.sid=s%3A<sid>.<signature>; ...
      const cookieHeader = response.headers["set-cookie"][0];
      const match = cookieHeader.match(/connect\.sid=s%3A([^.]+)\./);
      expect(match).toBeTruthy();
      const sessionId = match ? match[1] : "";

      // Inspect session data stored in memory store
      const sessionData = sharedSessions.get(sessionId) ?? null;

      expect(sessionData).not.toBeNull();
      expect(sessionData?.passport).toBeDefined();

      const serializedUser = sessionData?.passport?.user as { id: string; isMock?: boolean };
      expect(serializedUser).toEqual({
        id: "mock-admin-id",
        isMock: true,
      });

      // Assert that large user properties are NOT serialized into the session
      expect((serializedUser as Record<string, unknown>).email).toBeUndefined();
      expect((serializedUser as Record<string, unknown>).failedLoginAttempts).toBeUndefined();
      expect((serializedUser as Record<string, unknown>).profileImageUrl).toBeUndefined();
    });
  });

  describe("Session Rehydration & Authenticated Endpoints", () => {
    it("subsequent calls with session cookie rehydrate the admin user correctly without DB calls", async () => {
      // Step 1: Perform mock login
      const loginRes = await request(app)
        .get("/api/auth/mock-login")
        .set("Accept", "application/json");

      expect(loginRes.status).toBe(200);
      const sessionCookie = loginRes.headers["set-cookie"][0];

      // Spy on getUserInfo to verify it is NOT called during mock rehydration
      const getUserInfoSpy = vi.spyOn(authService, "getUserInfo");

      // Step 2: Make subsequent authenticated request to /api/auth/user
      const userRes = await request(app)
        .get("/api/auth/user")
        .set("Cookie", sessionCookie)
        .set("Accept", "application/json");

      expect(userRes.status).toBe(200);
      expect(userRes.body.id).toBe("mock-admin-id");
      expect(userRes.body.isAdmin).toBe(true);

      // Verify in-memory rehydration bypassed any DB query
      expect(getUserInfoSpy).not.toHaveBeenCalled();
    });

    it("subsequent mock login requests reuse in-memory seeded cache", async () => {
      const seedSpy = vi.spyOn(authService, "seedMockUser");

      // First login seeds the mock user
      await request(app).get("/api/auth/mock-login").set("Accept", "application/json");
      expect(seedSpy).toHaveBeenCalledTimes(1);

      // Second login completes quickly without re-running seeding queries
      const start = performance.now();
      const secondRes = await request(app)
        .get("/api/auth/mock-login")
        .set("Accept", "application/json");
      const duration = performance.now() - start;

      expect(secondRes.status).toBe(200);
      expect(seedSpy).toHaveBeenCalledTimes(2);
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Deserialization Backward-Compatibility", () => {
    type DeserializerFn = (
      serialized: unknown,
      cb: (err: unknown, user?: SessionUser) => void,
    ) => void;

    it("rehydrates legacy full SessionUser objects directly", async () => {
      const legacyUser: SessionUser = {
        id: "legacy-admin",
        email: "legacy@runapparel.com",
        emailIndex: "legacy-idx",
        firstName: "Legacy",
        lastName: "Admin",
        profileImageUrl: null,
        isAdmin: true,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        claims: {
          email: "legacy@runapparel.com",
          sub: "legacy-admin",
        },
      };

      const deserializers = (
        passport as unknown as {
          _deserializers: DeserializerFn[];
        }
      )._deserializers;
      const deserializer = deserializers[deserializers.length - 1];

      const rehydrated = await new Promise<SessionUser | undefined>((resolve, reject) => {
        deserializer(legacyUser, (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      });

      expect(rehydrated).toBeDefined();
      expect(rehydrated?.id).toBe("legacy-admin");
      expect(rehydrated?.email).toBe("legacy@runapparel.com");
    });

    it("fetches standard non-mock user via getUserInfo during deserialization", async () => {
      const mockStandardUser = {
        id: "standard-user-123",
        email: "athlete@runapparel.com",
        emailIndex: "athlete-idx",
        firstName: "Athlete",
        lastName: "One",
        profileImageUrl: null,
        isAdmin: false,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(authService, "getUserInfo").mockResolvedValue(ok(mockStandardUser));

      const deserializers = (
        passport as unknown as {
          _deserializers: DeserializerFn[];
        }
      )._deserializers;
      const deserializer = deserializers[deserializers.length - 1];

      const rehydrated = await new Promise<SessionUser | undefined>((resolve, reject) => {
        deserializer({ id: "standard-user-123", isMock: false }, (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      });

      expect(rehydrated).toBeDefined();
      expect(rehydrated?.id).toBe("standard-user-123");
      expect(rehydrated?.email).toBe("athlete@runapparel.com");
      expect(authService.getUserInfo).toHaveBeenCalledWith("standard-user-123");
    });

    it("handles null or non-object serialized values gracefully", async () => {
      const deserializers = (
        passport as unknown as {
          _deserializers: DeserializerFn[];
        }
      )._deserializers;
      const deserializer = deserializers[deserializers.length - 1];

      const result = await new Promise<SessionUser | undefined>((resolve, reject) => {
        deserializer(null, (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      });

      expect(result).toBeUndefined();
    });
  });
});
