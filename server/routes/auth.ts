import { type Response, Router } from "express";
import passport from "passport";
import { adminCacheManager } from "../lib/cache/admin-cache.js";
import { getStorage } from "../lib/storage-singleton.js";
import { authService, type SessionUser } from "../services/auth-service.js";

const router = Router();

// Login route - starts OAuth flow
router.get(
  "/login",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

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
