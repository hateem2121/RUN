import { type Response, Router } from "express";
import passport from "passport";
import { adminCacheManager } from "../lib/cache/admin-cache.js";
import { getStorage } from "../lib/storage-singleton.js";
import { authService } from "../services/auth-service.js";
import type { SessionUser } from "../types/session.js";

const router = Router();

// Login route - starts OAuth flow
router.get(
  "/login",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// Mock Login Route (Development Only)
if (process.env.NODE_ENV === "development") {
  router.get("/mock-login", (req, res) => {
    const mockUser: SessionUser = {
      id: "mock-admin-id",
      email: "mock-admin@example.com",
      firstName: "Mock",
      lastName: "Admin",
      profileImageUrl: "https://via.placeholder.com/150",
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      claims: {
        email: "mock-admin@example.com",
        sub: "mock-admin-id",
        isMock: true,
      },
    };

    req.login(mockUser, (err) => {
      if (err) {
        console.error("Mock login failed", err);
        return res.status(500).json({ error: "Mock login failed" });
      }
      // Redirect to admin dashboard
      return res.redirect("/admin");
    });
  });
}

// OAuth callback - completes authentication
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/login",
  }),
  (_req, res) => {
    res.redirect("/");
  },
);

// Logout route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// User info route
router.get(
  "/auth/user",
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
    const dbUser = await getStorage().getUser(userId);
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

// Admin Cache Management
router.post("/admin/cache/clear", authService.requireAdmin, (req, res) => {
  const { userId } = req.body;
  if (userId) {
    adminCacheManager.clearUser(userId);
  } else {
    adminCacheManager.clear();
  }
  res.json({ success: true, message: "Admin cache cleared" });
});

router.get("/admin/cache/stats", authService.requireAdmin, (_req, res) => {
  const stats = adminCacheManager.getStats();
  res.json({ ...stats, timestamp: new Date().toISOString() });
});

export default router;
