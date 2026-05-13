import { type Response, Router } from "express";
import passport from "passport";
import { userRepository } from "../lib/db/repositories/index.js";
import { logger } from "../lib/monitoring/logger.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { authService } from "../services/auth-service.js";
import type { SessionUser } from "../types/session.js";

const router = Router();

// Login route - starts OAuth flow
router.get(
  "/login",
  authRateLimiter,
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// Mock Login Route (Development & Test Only)
if (process.env.NODE_ENV === "development" || process.env.VITEST) {
  router.get("/mock-login", async (req, res) => {
    const mockUser: SessionUser = {
      id: "mock-admin-id",
      email: "mock-admin@example.com",
      emailIndex: "mock-admin-email-index",
      firstName: "Mock",
      lastName: "Admin",
      profileImageUrl: "https://via.placeholder.com/150",
      isAdmin: true,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      claims: {
        email: "mock-admin@example.com",
        sub: "mock-admin-id",
        isMock: true,
      },
    };

    // Seed user if in test environment
    if (process.env.NODE_ENV === "test") {
      await userRepository.upsertUser({
        id: mockUser.id,
        email: mockUser.email,
        emailIndex: mockUser.emailIndex,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        profileImageUrl: mockUser.profileImageUrl,
        isAdmin: mockUser.isAdmin,
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        logger.error("Session regeneration failed", undefined, err as Error);
        res.status(500).json({ error: "Session regeneration failed" });
        return;
      }

      req.login(mockUser, (loginErr) => {
        if (loginErr) {
          logger.error("Mock login failed", undefined, loginErr as Error);
          res.status(500).json({ error: "Mock login failed" });
          return;
        }

        // Ensure session is saved before redirecting/responding
        req.session.save((saveErr) => {
          if (saveErr) {
            logger.error("Session save failed", undefined, saveErr as Error);
            res.status(500).json({ error: "Session save failed" });
            return;
          }

          const returnTo = (req.query.returnTo as string) || "/admin";
          if (req.headers.accept?.includes("application/json")) {
            res.json({ success: true, user: mockUser });
            return;
          }
          res.redirect(returnTo);
        });
      });
    });
  });
}

// OAuth callback - completes authentication
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/login",
  }),
  (req, res) => {
    const user = req.user as SessionUser;
    if (!user) {
      return res.redirect("/api/auth/login");
    }

    req.session.regenerate((err) => {
      if (err) {
        throw err;
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          throw loginErr;
        }
        res.redirect("/");
      });
    });
  },
);

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      throw err;
    }
    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        throw sessionErr;
      }
      res.redirect("/");
    });
  });
});

// User info route
router.get(
  "/user",
  authService.isAuthenticated,
  async (req, res): Promise<undefined | Response> => {
    const user = req.user as SessionUser;

    // Return mock user immediately if isMock flag is set
    if (user.claims.isMock) {
      return res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        isAdmin: user.isAdmin,
      });
    }

    const userId = user.claims.sub;
    const dbUser = await userRepository.getUser(userId);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      isAdmin: dbUser.isAdmin,
    });
  },
);

export default router;
