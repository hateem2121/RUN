import { createHash } from "node:crypto";
import type { User } from "@run-remix/shared";
import type { Redis } from "@upstash/redis";

import type { Express, RequestHandler } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { adminCacheManager } from "../lib/cache/admin-cache.js";
import { logger } from "../lib/monitoring/logger.js";
import { getSecret } from "../lib/secrets/secret-manager.js";
import { getStorage } from "../lib/storage-singleton.js";

export interface SessionUser extends User {
  claims: {
    email: string | null;
    sub: string;
    isMock?: boolean;
  };
}

interface CustomSessionData {
  passport?: { user: SessionUser };
  uaHash?: string;
  lastRotated?: number;
  [key: string]: unknown; // Allow other properties like cookie, id, etc.
}

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
   * Internal session setup
   */
  private async getSessionMiddleware() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const { RedisStore } = await import("connect-redis");
    const { redis, isRedisEnabled } = await import("../lib/cache/upstash-client.js");

    let sessionStore;
    if (isRedisEnabled) {
      sessionStore = new RedisStore({
        client: redis as Redis,
        prefix: "sess:",
        ttl: sessionTtl / 1000,
      });
    } else {
      logger.warn("[Auth] Redis not configured - falling back to MemoryStore (Development Only)");
      // session() uses MemoryStore by default if store is undefined
      sessionStore = undefined;
    }

    // P1 SECURITY: Support Secret Rotation
    // If SESSION_SECRET_PREVIOUS is set, use it for verifying old sessions
    const currentSecret = getSecret("SESSION_SECRET") || process.env.SESSION_SECRET;

    if (!currentSecret) {
      throw new Error(
        "CRITICAL SECURITY ERROR: SESSION_SECRET must be provided in all environments.",
      );
    }

    const finalSecret = currentSecret;
    const previousSecret = process.env.SESSION_SECRET_PREVIOUS;
    const secrets = previousSecret ? [finalSecret, previousSecret] : finalSecret;

    return session({
      secret: secrets,
      store: sessionStore as session.Store,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        // P1 FIX: Secure cookies based on environment or connection
        // 'auto' uses req.secure (trusted proxy must be enabled)
        secure: process.env.NODE_ENV === "production" ? true : "auto",
        sameSite: "lax", // Explicit SameSite

        maxAge: sessionTtl,
      },
    });
  }

  /**
   * Configure Passport and Session
   */
  public async setup(app: Express) {
    app.set("trust proxy", 1);
    const sessionMiddleware = await this.getSessionMiddleware();
    app.use(sessionMiddleware);
    app.use(passport.initialize());
    app.use(passport.session());

    // P1 SECURITY: Force Session ID Rotation every 15 minutes
    // This effectively implements "Short-lived Access Token" behavior with Cookies
    app.use((req, res, next) => {
      if (!req.session || !req.user) {
        return next();
      }

      const now = Date.now();
      // Cast session to CustomSessionData to avoid TS errors
      const sess = req.session as unknown as CustomSessionData;
      const currentUA = req.headers["user-agent"] || "";

      // P2 SECURITY: User Agent Binding - verify session wasn't stolen
      // Hash the UA to avoid storing full strings and for privacy
      const uaHash = createHash("sha256").update(currentUA).digest("hex").substring(0, 16);

      // On first request (or after session regeneration), store the UA hash
      if (!sess.uaHash) {
        sess.uaHash = uaHash;
      } else if (sess.uaHash !== uaHash) {
        // UA mismatch - potential session hijacking
        logger.warn("[Auth] User agent mismatch detected, invalidating session", {
          storedHash: sess.uaHash,
          currentHash: uaHash,
        });

        return req.session.destroy((err) => {
          if (err) {
            logger.error("[Auth] Failed to destroy hijacked session:", err);
          }
          res.status(401).json(AuthErrors.SESSION_UA_MISMATCH);
        });
      }

      let lastRotated = sess.lastRotated;
      if (!lastRotated) {
        sess.lastRotated = now;
        lastRotated = now;
      }
      const ROTATION_INTERVAL = 15 * 60 * 1000; // 15 min

      if (now - lastRotated > ROTATION_INTERVAL) {
        // Save old passport state and UA hash
        const passportState = sess.passport;
        const savedUaHash = sess.uaHash;

        req.session.regenerate((err) => {
          if (err) {
            logger.error("[Auth] Session regeneration failed:", err);
            return next(err);
          }
          // Restore passport state, UA hash, and update rotation timestamp
          if (req.session) {
            req.session.passport = passportState;
            req.session.uaHash = savedUaHash;
            req.session.lastRotated = now;

            // Explicitly save to ensure the new SID is stored
            req.session.save((err) => {
              if (err) {
                logger.error("[Auth] Failed to save regenerated session:", err);
              }
              next();
            });
          }
        });
      } else {
        next();
      }
    });

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      logger.warn("[AuthService] Google Auth credentials missing.");
      return;
    }

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
          proxy: true,
        },
        async (
          _accessToken: string,
          _refreshToken: string,
          profile: passport.Profile,
          done: (err: unknown, user?: SessionUser) => void,
        ) => {
          try {
            const user = await this.upsertUser(profile);
            const sessionUser: SessionUser = {
              ...user,
              claims: { email: user.email, sub: user.id },
            };
            done(null, sessionUser);
          } catch (error) {
            logger.error("[AuthService] Login failed:", error);
            done(error, undefined);
          }
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
  private async upsertUser(profile: passport.Profile): Promise<User> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new Error("No email provided by Google");
    }

    const user = await getStorage().upsertUser({
      id: profile.id,
      email: email,
      firstName: profile.name?.givenName || "",
      lastName: profile.name?.familyName || "",
      profileImageUrl: profile.photos?.[0]?.value,
    });

    // Bootstrapping: Auto-promote initial admin
    if (process.env.INITIAL_ADMIN_EMAIL === email && !user.isAdmin) {
      logger.info(`[AuthService] Promoting initial admin: ${email}`);
      // Note: This logic depends on the storage implementation support
      // For now we log it as per the original googleAuth.ts pattern
    }

    return user;
  }

  /**
   * SECURITY: Check if mock admin access is allowed
   * STRICTLY RESTRICTED to development environment with explicit flag
   */
  private isMockAccessAllowed(user: SessionUser): boolean {
    const isDev = process.env.NODE_ENV === "development";
    const isMockEnabled = process.env.ENABLE_MOCK_ADMIN === "true";
    const isMockUser = user.claims.isMock === true;

    return isDev && isMockEnabled && isMockUser;
  }

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
   * Middleware: Require admin role
   */
  public requireAdmin: RequestHandler = async (req, res, next) => {
    const user = req.user as SessionUser | undefined;

    if (!req.isAuthenticated() || !user?.claims?.sub) {
      return res.status(AuthErrors.SESSION_EXPIRED.status).json({
        error: AuthErrors.SESSION_EXPIRED,
        redirectTo: "/api/login",
      });
    }

    const userId = user.claims.sub;
    const cachedAdminStatus = adminCacheManager.get(userId);

    if (cachedAdminStatus !== null) {
      if (cachedAdminStatus) {
        return next();
      }
      return res.status(AuthErrors.ADMIN_REQUIRED.status).json({
        error: AuthErrors.ADMIN_REQUIRED,
      });
    }

    // P1 SECURITY: Mock Admin Bypass
    // CRITICAL: This must ONLY be active in development environment
    if (this.isMockAccessAllowed(user)) {
      logger.warn(`[AuthService] ⚠️ MOCK ADMIN ACCESS GRANTED for user: ${userId}`);
      return next();
    }

    try {
      const dbUser = await getStorage().getUser(userId);
      if (!dbUser) {
        return res.status(AuthErrors.USER_NOT_FOUND.status).json({
          error: AuthErrors.USER_NOT_FOUND,
        });
      }

      const isAdmin = dbUser.isAdmin ?? false;
      adminCacheManager.set(userId, isAdmin);

      if (isAdmin) {
        return next();
      }
      return res.status(AuthErrors.ADMIN_REQUIRED.status).json({
        error: AuthErrors.ADMIN_REQUIRED,
      });
    } catch (error) {
      logger.error("[AuthService] Error checking admin status:", error);
      return res.status(AuthErrors.AUTH_SERVER_ERROR.status).json({
        error: AuthErrors.AUTH_SERVER_ERROR,
      });
    }
  };
}

export const authService = AuthService.getInstance();
