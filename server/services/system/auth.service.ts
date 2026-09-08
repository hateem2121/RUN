import { createHash } from "node:crypto";
import type { User } from "@run-remix/shared";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import { errAsync, ok, okAsync, type Result, ResultAsync } from "neverthrow";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { adminCacheManager } from "../../lib/cache/admin-cache.js";
import { DrizzleSessionStore } from "../../lib/db/session-store.js";
import { AppError, DatabaseError, InternalError, NotFoundError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../../lib/resilience/circuit-breaker.js";
import { getSecret } from "../../lib/secrets/secret-manager.js";
import type { SessionUser } from "../../types/session.js";
import { userRepository } from "../repositories/index.js";

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
  private mockUserSeeded = false;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Reset the in-memory mock user seeded flag (for testing)
   */
  public __resetMockUserSeeded(): void {
    this.mockUserSeeded = false;
  }

  /**
   * TESTING ONLY: Reset the singleton instance
   */
  public static __resetInstance(): void {
    if (AuthService.instance) {
      AuthService.instance.mockUserSeeded = false;
    }
    AuthService.instance = undefined as unknown as AuthService;
  }

  /**
   * Internal session setup
   */
  private getSessionMiddleware(): Result<RequestHandler, AppError> {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

    const sessionStore = new DrizzleSessionStore();
    logger.info("[Auth] DrizzleSessionStore initialized");

    // Periodic session pruning every 30 minutes in server runtime
    if (process.env.VITEST !== "true") {
      const pruneInterval = setInterval(
        () => {
          sessionStore.pruneExpired().match(
            (deletedCount) => {
              if (deletedCount > 0) {
                logger.info(`[Auth] Pruned ${deletedCount} expired sessions`);
              }
            },
            (err) => logger.warn("[Auth] Failed to prune expired sessions:", err),
          );
        },
        30 * 60 * 1000,
      );
      pruneInterval.unref(); // Allow Node process to terminate cleanly
    }

    const currentSecret = getSecret("SESSION_SECRET") || process.env.SESSION_SECRET;

    if (!currentSecret) {
      logger.error("CRITICAL SECURITY ERROR: SESSION_SECRET must be provided.");
      process.exit(1);
    }

    // Validate secret length (must be at least 32 characters for security)
    if (currentSecret.length < 32) {
      logger.error("CRITICAL SECURITY ERROR: SESSION_SECRET must be at least 32 characters");
      process.exit(1);
    }

    const finalSecret = currentSecret;
    const previousSecret = process.env.SESSION_SECRET_PREVIOUS;

    // Validate previous secret if provided
    if (previousSecret && previousSecret.length < 32) {
      logger.warn(
        "SESSION_SECRET_PREVIOUS is shorter than 32 characters - rotation may be insecure",
      );
    }

    const secrets = previousSecret ? [finalSecret, previousSecret] : finalSecret;

    return ok(
      session({
        secret: secrets,
        store: sessionStore as session.Store,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure:
            process.env.NODE_ENV === "production" &&
            process.env.E2E !== "true" &&
            process.env.VITEST !== "true"
              ? true
              : "auto",
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
    const sessionResult = this.getSessionMiddleware();
    if (sessionResult.isErr()) {
      return Promise.reject(sessionResult.error);
    }
    app.use(sessionResult.value);
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(this.sessionSecurityMiddleware);

    const isTestRunner =
      process.env.E2E === "true" ||
      process.env.VITEST === "true" ||
      process.env.NODE_ENV === "test" ||
      process.env.PLAYWRIGHT_TEST === "true";

    if (
      process.env.NODE_ENV === "production" &&
      process.env.ENABLE_MOCK_ADMIN === "true" &&
      !isTestRunner
    ) {
      logger.error("CRITICAL SECURITY ERROR: ENABLE_MOCK_ADMIN must be false in production.");
      process.exit(1);
    }

    passport.serializeUser((user: Express.User, cb: (err: unknown, id?: unknown) => void) => {
      const sessionUser = user as SessionUser;
      cb(null, { id: sessionUser.id, isMock: Boolean(sessionUser.claims?.isMock) });
    });
    passport.deserializeUser(
      async (
        serialized: { id: string; isMock?: boolean } | SessionUser,
        cb: (err: unknown, user?: SessionUser) => void,
      ) => {
        if (!serialized || typeof serialized !== "object") {
          return cb(null, undefined);
        }
        if ("email" in serialized && !("isMock" in serialized)) {
          return cb(null, serialized as SessionUser);
        }
        if (serialized.isMock) {
          return cb(null, {
            id: serialized.id,
            email: "admin@runapparel.com",
            emailIndex: "admin@runapparel.com",
            firstName: "Mock",
            lastName: "Admin",
            isAdmin: true,
            claims: { email: "admin@runapparel.com", sub: serialized.id, isMock: true },
          } as SessionUser);
        }
        try {
          const result = await this.getUserInfo(serialized.id);
          if (result.isOk()) {
            cb(null, {
              ...result.value,
              claims: { email: result.value.email, sub: result.value.id },
            } as SessionUser);
          } else {
            cb(result.error);
          }
        } catch (err) {
          cb(err);
        }
      },
    );

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      if (process.env.NODE_ENV === "production" && !isTestRunner) {
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

    logger.info("[AuthService] ✅ Authentication configured");
  }

  /**
   * Upsert user in database
   */
  private upsertUser(profile: passport.Profile): ResultAsync<User, AppError> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return errAsync(new InternalError("No email provided by Google"));
    }

    return ResultAsync.fromPromise(
      withCircuit(
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
      ),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError("Failed to upsert user", { cause: error });
      },
    ).andThen((userResult) => {
      if (userResult.isErr()) {
        const error = userResult.error;
        return errAsync(
          error instanceof AppError
            ? error
            : new DatabaseError("Failed to upsert user", { cause: error }),
        );
      }

      const user = userResult.value;
      if (process.env.INITIAL_ADMIN_EMAIL === email && !user.isAdmin) {
        logger.info("[AuthService] Promoting initial admin", { email });
      }

      return okAsync(user);
    });
  }

  /**
   * SECURITY: Check if mock admin access is allowed
   * STRICTLY RESTRICTED to development environment with explicit flag
   */
  private isMockAccessAllowed(user: SessionUser): boolean {
    const isTestRunner =
      process.env.E2E === "true" ||
      process.env.VITEST === "true" ||
      process.env.NODE_ENV === "test" ||
      process.env.PLAYWRIGHT_TEST === "true";

    if (process.env.NODE_ENV === "production" && !isTestRunner) {
      return false;
    }

    const isDev = process.env.NODE_ENV === "development" || isTestRunner;
    const isMockEnabled = process.env.ENABLE_MOCK_ADMIN === "true";
    const isMockUser = user.claims?.isMock === true;

    return isDev && isMockEnabled && isMockUser && Boolean(user.isAdmin);
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

    const isTestRunner =
      process.env.E2E === "true" ||
      process.env.VITEST === "true" ||
      process.env.NODE_ENV === "test" ||
      process.env.PLAYWRIGHT_TEST === "true";

    if (process.env.NODE_ENV === "production" && !isTestRunner) {
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

    if (
      !isTestRunner &&
      process.env.NODE_ENV === "production" &&
      now - lastRotated > ROTATION_INTERVAL
    ) {
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
  public verifyAdminAccess(user: SessionUser): ResultAsync<boolean, AppError> {
    const userId = user?.claims?.sub;
    if (!userId) {
      return okAsync(false);
    }
    const cachedAdminStatus = adminCacheManager.get(userId);

    if (cachedAdminStatus !== null) {
      return okAsync(cachedAdminStatus);
    }

    if (this.isMockAccessAllowed(user)) {
      logger.warn("[AuthService] ⚠️ MOCK ADMIN ACCESS GRANTED", { userId });
      return okAsync(true);
    }

    return ResultAsync.fromPromise(
      (async () => {
        const dbUser = await withCircuit(
          "get-user-admin-check",
          () => userRepository.getUser(userId),
          DB_CIRCUIT_OPTIONS,
        );
        if (!dbUser) {
          return false;
        }

        const isAdmin = dbUser.isAdmin ?? false;
        adminCacheManager.set(userId, isAdmin);
        return isAdmin;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AuthService] Error checking admin status", { error, userId });
        return new DatabaseError("Error checking admin status", { cause: error });
      },
    );
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
  public isAccountLocked(email: string): ResultAsync<boolean, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const user = await withCircuit(
          "get-user-lockout-check",
          () => userRepository.getUserByEmail(email),
          DB_CIRCUIT_OPTIONS,
        );
        if (!user?.lockoutUntil) return false;

        if (user.lockoutUntil > new Date()) {
          return true;
        }

        // Lock expired, reset attempts
        await this.recordSuccessfulLogin(email);
        return false;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError("Failed to check lockout status", { cause: error });
      },
    );
  }

  public recordFailedLogin(email: string): ResultAsync<void, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const user = await withCircuit(
          "get-user-failed-login",
          () => userRepository.getUserByEmail(email),
          DB_CIRCUIT_OPTIONS,
        );
        if (!user) return undefined;

        const attempts = (user.failedLoginAttempts || 0) + 1;
        const updates: Partial<User> = {
          failedLoginAttempts: attempts,
          updatedAt: new Date(),
        };

        if (attempts >= 5) {
          const lockoutMinutes = 15;
          updates.lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
          logger.warn("[AuthService] Account locked following 5 failures", {
            email,
            lockoutMinutes,
          });
        }

        await withCircuit(
          "update-user-failed-login",
          () => userRepository.updateUser(user.id, updates),
          DB_CIRCUIT_OPTIONS,
        );
        return undefined;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError("Failed to record failed login", { cause: error });
      },
    );
  }

  public recordSuccessfulLogin(email: string): ResultAsync<void, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const user = await withCircuit(
          "get-user-successful-login",
          () => userRepository.getUserByEmail(email),
          DB_CIRCUIT_OPTIONS,
        );
        if (!user) return undefined;

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
        return undefined;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError("Failed to record successful login", { cause: error });
      },
    );
  }

  public getFailedAttempts(email: string): ResultAsync<number, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const user = await withCircuit(
          "get-user-failed-attempts",
          () => userRepository.getUserByEmail(email),
          DB_CIRCUIT_OPTIONS,
        );
        return user?.failedLoginAttempts ?? 0;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError("Failed to get failed attempts", { cause: error });
      },
    );
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
  public devLogin(): ResultAsync<SessionUser, AppError> {
    if (process.env.NODE_ENV === "production") {
      return errAsync(new InternalError("Dev login not allowed in production"));
    }

    return ResultAsync.fromPromise(
      (async () => {
        const adminUser = await withCircuit(
          "dev-login-fetch",
          () => userRepository.getUserByEmail("team@wear-run.com"),
          DB_CIRCUIT_OPTIONS,
        );

        if (!adminUser) {
          throw new NotFoundError("Admin user team@wear-run.com");
        }

        const sessionUser: SessionUser = {
          ...adminUser,
          claims: { sub: adminUser.id, email: adminUser.email, isMock: true },
        };

        return sessionUser;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new InternalError("Failed to perform dev login", { error });
      },
    );
  }

  /**
   * Alias for devLogin to maintain compatibility with handleDevLogin
   */
  public handleDevLogin(): ResultAsync<SessionUser, AppError> {
    return this.devLogin();
  }

  /**
   * Seed mock user for development
   */
  public seedMockUser(user: Partial<SessionUser>): ResultAsync<void, AppError> {
    if (this.mockUserSeeded) {
      return okAsync(undefined);
    }

    const skipDb = process.env.MOCK_DB === "true";
    if (skipDb) {
      this.mockUserSeeded = true;
      return okAsync(undefined);
    }

    return ResultAsync.fromPromise(
      withCircuit(
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
      ),
      (error) => {
        if (error instanceof AppError) return error;
        logger.warn("[AuthService] Failed to seed mock user", error);
        return new InternalError("Failed to seed mock user", { cause: error });
      },
    ).map(() => {
      this.mockUserSeeded = true;
      return undefined;
    });
  }

  /**
   * Get user info wrapper for route handlers
   */
  public getUserInfo(userId: string): ResultAsync<User, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const dbUser = await withCircuit(
          "get-user-info",
          () => userRepository.getUser(userId),
          DB_CIRCUIT_OPTIONS,
        );
        if (!dbUser) throw new NotFoundError("User not found");
        return dbUser;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new InternalError("Failed to get user info", { cause: error });
      },
    );
  }
}

export const authService = AuthService.getInstance();
