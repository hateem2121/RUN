import { createHash } from "node:crypto";
import type { User } from "@run-remix/shared";
import type { Express, RequestHandler } from "express";
import session, { type Store } from "express-session";
import type { Redis } from "ioredis";
import { err, ok, type Result } from "neverthrow";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { adminCacheManager } from "../lib/cache/admin-cache.js";
import { userRepository } from "../lib/db/repositories/index.js";
import { type AppError, DatabaseError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { getSecret } from "../lib/secrets/secret-manager.js";
import type { SessionUser } from "../types/session.js";

export const AuthErrors = {
  SESSION_EXPIRED: {
    code: "SESSION_EXPIRED",
    message: "Your session has expired. Please log in again.",
    status: 401,
  },
  ADMIN_REQUIRED: {
    code: "ADMIN_REQUIRED",
    message: "Admin privileges are required to access this resource.",
    status: 403,
  },
  AUTH_SERVER_ERROR: {
    code: "AUTH_SERVER_ERROR",
    message: "Authentication server is temporarily unavailable. Please try again.",
    status: 503,
  },
  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    message: "User account not found. Please contact support.",
    status: 404,
  },
  INVALID_SESSION: {
    code: "INVALID_SESSION",
    message: "Invalid session. Please log in again.",
    status: 401,
  },
  SESSION_UA_MISMATCH: {
    code: "SESSION_UA_MISMATCH",
    message: "Session security check failed. Please log in again.",
    status: 401,
  },
} as const;

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * TESTING ONLY: Reset the singleton instance
   */
  public static __resetInstance(): void {
    AuthService.instance = undefined as unknown as AuthService;
  }

  /**
   * Internal session setup
   */
  private async getSessionMiddleware(): Promise<Result<RequestHandler, Error>> {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const { RedisStore } = await import("connect-redis");
    const { redis, isRedisEnabled } = await import("../lib/cache/upstash-client.js");

    let sessionStore: Store | undefined;
    if (isRedisEnabled) {
      sessionStore = new RedisStore({
        client: redis as Redis,
        prefix: "sess:",
        ttl: sessionTtl / 1000,
      });
      logger.info("[Auth] Redis Session Store initialized", { ttl: sessionTtl / 1000 });
    } else {
      if (process.env.NODE_ENV === "production") {
        logger.error(
          "Redis is required for session storage in production. Set REDIS_URL or UPSTASH_REDIS_REST_URL.",
        );
        if (process.env.VITEST && process.env.STRICT_REDIS_CHECK !== "true") {
          logger.warn(
            "[Auth] Vitest production mode: falling back to MemoryStore to prevent crash.",
          );
        } else if (process.env.VITEST) {
          return err(new Error("Redis is required for session storage in production"));
        } else {
          process.exit(1);
        }
      }
      if (process.env.NODE_ENV === "development") {
        logger.debug(
          "[Auth] Redis not configured - using MemoryStore for local dev (expected, not a bug).",
        );
      } else {
        logger.warn(
          "[Auth] Redis not configured - falling back to MemoryStore (Development Only).",
        );
      }
      sessionStore = undefined;
    }

    const currentSecret = getSecret("SESSION_SECRET") || process.env.SESSION_SECRET;

    if (!currentSecret) {
      logger.error("CRITICAL SECURITY ERROR: SESSION_SECRET must be provided.");
      process.exit(1);
    }

    const finalSecret = currentSecret;
    const previousSecret = process.env.SESSION_SECRET_PREVIOUS;
    const secrets = previousSecret ? [finalSecret, previousSecret] : finalSecret;

    return ok(
      session({
        secret: secrets,
        store: sessionStore as session.Store,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production" ? true : "auto",
          sameSite: "lax",
          maxAge: sessionTtl,
        },
      }),
    );
  }

  /**
   * Configure Passport and Session
   */
  public async setup(app: Express): Promise<void> {
    const sessionResult = await this.getSessionMiddleware();
    if (sessionResult.isErr()) {
      return Promise.reject(sessionResult.error);
    }
    app.use(sessionResult.value);
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(this.sessionSecurityMiddleware);

    if (process.env.NODE_ENV === "production" && process.env.ENABLE_MOCK_ADMIN === "true") {
      logger.error("CRITICAL SECURITY ERROR: ENABLE_MOCK_ADMIN must be false in production.");
      process.exit(1);
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      if (process.env.NODE_ENV === "production") {
        logger.error("CRITICAL SECURITY ERROR: Google Auth credentials missing in production.");
        process.exit(1);
      }
      logger.warn("[AuthService] Google Auth credentials missing. OAuth will be disabled.");
      return;
    }

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
          proxy: true,
          state: true,
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: passport.Profile,
          done: (err: unknown, user?: SessionUser) => void,
        ) => {
          const result = await this.upsertUser(profile);
          if (result.isErr()) {
            logger.error("[AuthService] Login failed", {
              error: result.error,
              profileId: profile.id,
            });
            return done(result.error);
          }

          const user = result.value;
          const sessionUser: SessionUser = {
            ...user,
            claims: { email: user.email, sub: user.id },
          };
          done(null, sessionUser);
        },
      ),
    );

    passport.serializeUser((user: Express.User, cb: (err: unknown, id?: Express.User) => void) =>
      cb(null, user),
    );
    passport.deserializeUser((user: SessionUser, cb: (err: unknown, user?: SessionUser) => void) =>
      cb(null, user),
    );

    logger.info("[AuthService] ✅ Authentication configured");
  }

  /**
   * Upsert user in database
   */
  private async upsertUser(profile: passport.Profile): Promise<Result<User, AppError>> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return err(new InternalError("No email provided by Google"));
    }

    try {
      const user = await withCircuit(
        "upsert-user",
        () =>
          userRepository.upsertUser({
            id: profile.id,
            email: email,
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            profileImageUrl: profile.photos?.[0]?.value,
          }),
        DB_CIRCUIT_OPTIONS,
      );

      // Bootstrapping: Auto-promote initial admin
      if (process.env.INITIAL_ADMIN_EMAIL === email && !user.isAdmin) {
        logger.info("[AuthService] Promoting initial admin", { email });
      }

      return ok(user);
    } catch (error) {
      return err(new DatabaseError("Failed to upsert user", { cause: error }));
    }
  }

  /**
   * SECURITY: Check if mock admin access is allowed
   * STRICTLY RESTRICTED to development environment with explicit flag
   */
  private isMockAccessAllowed(user: SessionUser): boolean {
    if (process.env.NODE_ENV === "production") {
      return false;
    }

    const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
    const isMockEnabled = process.env.ENABLE_MOCK_ADMIN === "true";
    const isMockUser = user.claims.isMock === true;

    return isDev && isMockEnabled && isMockUser && user.isAdmin;
  }

  /**
   * Middleware: Session Security (Rotation & UA Binding)
   */
  public sessionSecurityMiddleware: RequestHandler = (req, res, next) => {
    if (!req.session || !req.user) {
      return next();
    }

    const now = Date.now();
    const sess = req.session;
    const currentUA = req.headers["user-agent"] || "";

    const uaHash = createHash("sha256").update(currentUA).digest("hex").substring(0, 16);

    if (process.env.NODE_ENV === "production") {
      if (!sess.uaHash) {
        sess.uaHash = uaHash;
      } else if (sess.uaHash !== uaHash) {
        logger.warn("[Auth] User agent mismatch detected, invalidating session", {
          storedHash: sess.uaHash,
          currentHash: uaHash,
        });

        return req.session.destroy((err) => {
          if (err) {
            logger.error("[Auth] Failed to destroy hijacked session", { error: err });
          }
          res.status(401).json(AuthErrors.SESSION_UA_MISMATCH);
        });
      }
    }

    let lastRotated = sess.lastRotated;
    if (!lastRotated) {
      sess.lastRotated = now;
      lastRotated = now;
    }
    const ROTATION_INTERVAL = 15 * 60 * 1000; // 15 min

    if (now - lastRotated > ROTATION_INTERVAL) {
      const passportState = sess.passport;
      const savedUaHash = sess.uaHash;

      req.session.regenerate((err) => {
        if (err) {
          logger.error("[Auth] Session regeneration failed", { error: err });
          return next(err);
        }

        if (req.session) {
          if (passportState) {
            req.session.passport = passportState;
          }
          if (savedUaHash) {
            req.session.uaHash = savedUaHash;
          }
          req.session.lastRotated = now;

          req.session.save((err) => {
            if (err) {
              logger.error("[Auth] Failed to save regenerated session", { error: err });
            }
            next();
          });
        } else {
          next();
        }
      });
    } else {
      next();
    }
  };

  /**
   * Middleware: Require authenticated user
   */
  public isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  /**
   * VERIFY ADMIN ACCESS
   */
  public async verifyAdminAccess(user: SessionUser): Promise<Result<boolean, AppError>> {
    const userId = user?.claims?.sub;
    if (!userId) {
      return ok(false);
    }
    const cachedAdminStatus = adminCacheManager.get(userId);

    if (cachedAdminStatus !== null) {
      return ok(cachedAdminStatus);
    }

    if (this.isMockAccessAllowed(user)) {
      logger.warn("[AuthService] ⚠️ MOCK ADMIN ACCESS GRANTED", { userId });
      return ok(true);
    }

    try {
      const dbUser = await withCircuit(
        "get-user-admin-check",
        () => userRepository.getUser(userId),
        DB_CIRCUIT_OPTIONS,
      );
      if (!dbUser) {
        return ok(false);
      }

      const isAdmin = dbUser.isAdmin ?? false;
      adminCacheManager.set(userId, isAdmin);
      return ok(isAdmin);
    } catch (error) {
      logger.error("[AuthService] Error checking admin status", { error, userId });
      return err(new DatabaseError("Error checking admin status", { cause: error }));
    }
  }

  /**
   * Middleware: Require admin role
   */
  public requireAdmin: RequestHandler = async (req, res, next) => {
    if (process.env.BYPASS_RBAC_FOR_TESTING === "true" && process.env.NODE_ENV !== "production") {
      logger.warn("[AuthService] ⚠️ Admin check bypassed due to BYPASS_RBAC_FOR_TESTING flag");
      return next();
    }
    const user = req.user as SessionUser;

    if (!req.isAuthenticated() || !user?.claims?.sub) {
      return res.status(AuthErrors.SESSION_EXPIRED.status).json({
        error: AuthErrors.SESSION_EXPIRED,
        redirectTo: "/api/login",
      });
    }

    const result = await this.verifyAdminAccess(user);
    if (result.isErr()) {
      logger.error("[AuthService] Error in requireAdmin middleware", { error: result.error });
      return res.status(AuthErrors.AUTH_SERVER_ERROR.status).json({
        error: AuthErrors.AUTH_SERVER_ERROR,
      });
    }

    if (result.value) {
      return next();
    }

    return res.status(AuthErrors.ADMIN_REQUIRED.status).json({
      error: AuthErrors.ADMIN_REQUIRED,
    });
  };

  /**
   * SECURITY: Account Lockout Logic
   */
  public async isAccountLocked(email: string): Promise<Result<boolean, AppError>> {
    try {
      const user = await withCircuit(
        "get-user-lockout-check",
        () => userRepository.getUserByEmail(email),
        DB_CIRCUIT_OPTIONS,
      );
      if (!user || !user.lockoutUntil) return ok(false);

      if (user.lockoutUntil > new Date()) {
        return ok(true);
      }

      // Lock expired, reset attempts
      await this.recordSuccessfulLogin(email);
      return ok(false);
    } catch (error) {
      return err(new DatabaseError("Failed to check lockout status", { cause: error }));
    }
  }

  public async recordFailedLogin(email: string): Promise<Result<void, AppError>> {
    try {
      const user = await withCircuit(
        "get-user-failed-login",
        () => userRepository.getUserByEmail(email),
        DB_CIRCUIT_OPTIONS,
      );
      if (!user) return ok(undefined);

      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates: Partial<User> = {
        failedLoginAttempts: attempts,
        updatedAt: new Date(),
      };

      if (attempts >= 5) {
        const lockoutMinutes = 15;
        updates.lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
        logger.warn("[AuthService] Account locked following 5 failures", { email, lockoutMinutes });
      }

      await withCircuit(
        "update-user-failed-login",
        () => userRepository.updateUser(user.id, updates),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(undefined);
    } catch (error) {
      return err(new DatabaseError("Failed to record failed login", { cause: error }));
    }
  }

  public async recordSuccessfulLogin(email: string): Promise<Result<void, AppError>> {
    try {
      const user = await withCircuit(
        "get-user-successful-login",
        () => userRepository.getUserByEmail(email),
        DB_CIRCUIT_OPTIONS,
      );
      if (!user) return ok(undefined);

      await withCircuit(
        "update-user-successful-login",
        () =>
          userRepository.updateUser(user.id, {
            failedLoginAttempts: 0,
            lockoutUntil: null,
            updatedAt: new Date(),
          }),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(undefined);
    } catch (error) {
      return err(new DatabaseError("Failed to record successful login", { cause: error }));
    }
  }

  public async getFailedAttempts(email: string): Promise<Result<number, AppError>> {
    try {
      const user = await withCircuit(
        "get-user-failed-attempts",
        () => userRepository.getUserByEmail(email),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(user?.failedLoginAttempts ?? 0);
    } catch (error) {
      return err(new DatabaseError("Failed to get failed attempts", { cause: error }));
    }
  }

  /**
   * SECURITY: Session & UA Utilities
   */
  public hashUserAgent(ua: string): string {
    return createHash("sha256").update(ua).digest("hex");
  }

  public async validateSession(_sessionId: string, userAgent: string): Promise<void> {
    this.hashUserAgent(userAgent).substring(0, 16);
  }

  public async shouldRotateSession(_sessionId: string): Promise<boolean> {
    return true;
  }

  /**
   * DEV ONLY: Perform mock login for administrative testing
   * RESTRICTED to development environment.
   */
  public async devLogin(): Promise<Result<SessionUser, AppError>> {
    if (process.env.NODE_ENV === "production") {
      return err(new InternalError("Dev login not allowed in production"));
    }

    try {
      const adminUser = await withCircuit(
        "dev-login-fetch",
        () => userRepository.getUserByEmail("team@wear-run.com"),
        DB_CIRCUIT_OPTIONS,
      );

      if (!adminUser) {
        return err(new NotFoundError("Admin user team@wear-run.com"));
      }

      const sessionUser: SessionUser = {
        ...adminUser,
        claims: { sub: adminUser.id, email: adminUser.email, isMock: true },
      };

      return ok(sessionUser);
    } catch (error) {
      return err(new InternalError("Failed to perform dev login", { error }));
    }
  }

  /**
   * Seed mock user for development
   */
  public async seedMockUser(user: Partial<SessionUser>): Promise<Result<void, AppError>> {
    const { isDatabasePoolHealthy } = await import("../db.js");
    const { userRepository } = await import("../lib/db/repositories/index.js");

    const skipDb = process.env.MOCK_DB === "true" || !(await isDatabasePoolHealthy());
    if (skipDb) return ok(undefined);

    try {
      await withCircuit(
        "seed-mock-user",
        () =>
          userRepository.upsertUser({
            id: user.id as string,
            email: user.email as string,
            emailIndex: user.emailIndex as string,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            isAdmin: user.isAdmin,
          }),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(undefined);
    } catch (error) {
      logger.warn("[AuthService] Failed to seed mock user", error);
      return err(new InternalError("Failed to seed mock user", { cause: error }));
    }
  }

  /**
   * Get user info wrapper for route handlers
   */
  public async getUserInfo(userId: string): Promise<Result<User, AppError>> {
    const { userRepository } = await import("../lib/db/repositories/index.js");
    try {
      const dbUser = await withCircuit(
        "get-user-info",
        () => userRepository.getUser(userId),
        DB_CIRCUIT_OPTIONS,
      );
      if (!dbUser) return err(new NotFoundError("User not found"));
      return ok(dbUser);
    } catch (error) {
      return err(new InternalError("Failed to get user info", { cause: error }));
    }
  }
}

export const authService = AuthService.getInstance();
