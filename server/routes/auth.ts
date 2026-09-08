import { type Response, Router } from "express";
import passport from "passport";
import { logger } from "../lib/monitoring/logger.js";
import { authService } from "../services/system/auth.service.js";
import { type WebAuthnCredential, webauthnService } from "../services/system/webauthn.service.js";
import type { SessionUser } from "../types/session.js";

const router = Router();

// Login route - starts OAuth flow or forwards to mock-login in test/E2E
router.get("/login", (req, res, next) => {
  const isMockEnabled =
    process.env.ENABLE_MOCK_ADMIN === "true" ||
    process.env.NODE_ENV === "test" ||
    process.env.VITEST === "true" ||
    process.env.E2E === "true" ||
    process.env.PLAYWRIGHT_TEST === "true";

  if (
    isMockEnabled &&
    (!process.env.GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID === "mock-client-id" ||
      process.env.GOOGLE_CLIENT_ID === "dummy-google-client-id")
  ) {
    const returnTo = (req.query.returnUrl as string) || (req.query.returnTo as string) || "/admin";
    res.redirect(`/api/auth/mock-login?returnTo=${encodeURIComponent(returnTo)}`);
    return;
  }

  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
});

// Mock Login Route (Development, Test, and E2E Only)
// SECURITY: Strict check - mock login ONLY enabled when ENABLE_MOCK_ADMIN is explicitly "true" or in test environments
router.get("/mock-login", async (req, res) => {
  const isMockEnabled =
    process.env.ENABLE_MOCK_ADMIN === "true" ||
    process.env.NODE_ENV === "test" ||
    process.env.VITEST === "true" ||
    process.env.E2E === "true";

  if (!isMockEnabled) {
    res.status(404).json({ error: "Not found" });
    return;
  }

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

  await authService.seedMockUser(mockUser);

  req.session.regenerate((err) => {
    if (err) {
      logger.error(
        `Session regeneration failed: ${err instanceof Error ? err.stack : String(err)}`,
      );
      res.status(500).json({ error: "Session regeneration failed" });
      return;
    }

    req.login(mockUser, (loginErr) => {
      if (loginErr) {
        logger.error(
          `Mock login failed: ${loginErr instanceof Error ? loginErr.stack : String(loginErr)}`,
        );
        res.status(500).json({ error: "Mock login failed" });
        return;
      }

      // Ensure session is saved before redirecting/responding
      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error(
            `Session save failed: ${saveErr instanceof Error ? saveErr.stack : String(saveErr)}`,
          );
          res.status(500).json({ error: "Session save failed" });
          return;
        }

        const rawReturnTo = req.query.returnTo || req.query.returnUrl;
        const returnTo =
          typeof rawReturnTo === "string" &&
          rawReturnTo.startsWith("/") &&
          !rawReturnTo.startsWith("//") &&
          !rawReturnTo.includes("\\") &&
          /^\/[a-zA-Z0-9_\-/?=&%#.]*$/.test(rawReturnTo)
            ? rawReturnTo
            : "/admin";
        if (req.headers.accept?.includes("application/json")) {
          res.json({ success: true, user: mockUser });
          return;
        }
        res.redirect(returnTo);
      });
    });
  });
});

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

    // Return mock user immediately if isMock flag or mock id is set
    if (user.claims?.isMock || user.id === "mock-admin-id") {
      return res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        isAdmin: user.isAdmin,
      });
    }

    const userId = user.claims?.sub ?? user.id;
    const dbUserResult = await authService.getUserInfo(userId);
    if (dbUserResult.isErr()) {
      return res.status(404).json({ message: "User not found" });
    }
    const dbUser = dbUserResult.value;

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

// ============================================================================
// WEBAUTHN FIDO2 PASSKEYS ROUTES (AUTH-01)
// ============================================================================
const webauthnRouter = Router();

// POST /api/auth/webauthn/register/options (requires authenticated session)
webauthnRouter.post("/register/options", authService.isAuthenticated, (req, res): void => {
  const user = req.user as SessionUser;
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const userId = user.claims?.sub ?? user.id;
  const username = user.email || userId;
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "User";

  const options = webauthnService.generateRegistrationOptions(userId, username, displayName);

  req.session.currentWebAuthnChallenge = options.challenge;
  req.session.webauthnUserId = userId;

  req.session.save((err) => {
    if (err) {
      logger.error("[WebAuthn] Failed to save challenge in session:", err);
      res.status(500).json({ error: "Failed to persist challenge" });
      return;
    }
    res.json(options);
  });
});

// POST /api/auth/webauthn/register/verify (saves credential to session/user)
webauthnRouter.post(
  "/register/verify",
  authService.isAuthenticated,
  async (req, res): Promise<void> => {
    const user = req.user as SessionUser;
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const challenge = req.session.currentWebAuthnChallenge;
    if (!challenge) {
      res.status(400).json({ verified: false, error: "No pending registration challenge" });
      return;
    }

    const responsePayload = (req.body.response || req.body) as {
      id: string;
      rawId?: string;
      clientDataJSON: string;
      attestationObject: string;
    };

    if (
      !responsePayload.id ||
      !responsePayload.clientDataJSON ||
      !responsePayload.attestationObject
    ) {
      res.status(400).json({ verified: false, error: "Invalid registration payload" });
      return;
    }

    const verification = await webauthnService.verifyRegistrationResponse({
      challenge,
      response: {
        id: responsePayload.id,
        rawId: responsePayload.rawId || responsePayload.id,
        clientDataJSON: responsePayload.clientDataJSON,
        attestationObject: responsePayload.attestationObject,
      },
    });

    if (!verification.verified || !verification.credential) {
      res.status(400).json({ verified: false, error: "Registration verification failed" });
      return;
    }

    const userId = user.claims?.sub ?? user.id;

    // Save credential to session and service
    if (!req.session.webauthnCredentials) {
      req.session.webauthnCredentials = [];
    }
    req.session.webauthnCredentials.push(verification.credential);
    req.session.currentWebAuthnChallenge = undefined;

    webauthnService.saveUserCredential(userId, verification.credential);

    req.session.save((err) => {
      if (err) {
        logger.error("[WebAuthn] Failed to save credential in session:", err);
        res.status(500).json({ error: "Failed to save session" });
        return;
      }
      res.json({ verified: true, credential: verification.credential });
    });
  },
);

// POST /api/auth/webauthn/auth/options
webauthnRouter.post("/auth/options", (req, res): void => {
  const userId =
    (req.body?.userId as string | undefined) ?? (req.user as SessionUser | undefined)?.id;
  const credentials = userId
    ? webauthnService.getUserCredentials(userId)
    : req.session.webauthnCredentials;

  const options = webauthnService.generateAuthenticationOptions(credentials);
  req.session.currentWebAuthnChallenge = options.challenge;

  req.session.save((err) => {
    if (err) {
      logger.error("[WebAuthn] Failed to save authentication challenge:", err);
      res.status(500).json({ error: "Failed to persist challenge" });
      return;
    }
    res.json(options);
  });
});

// POST /api/auth/webauthn/auth/verify (verifies passkey assertion, upgrades session with mfaVerified: true)
webauthnRouter.post("/auth/verify", async (req, res): Promise<void> => {
  const challenge = req.session.currentWebAuthnChallenge;
  if (!challenge) {
    res.status(400).json({ verified: false, error: "No pending authentication challenge" });
    return;
  }

  const responsePayload = (req.body.response || req.body) as {
    id: string;
    rawId?: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string | undefined;
  };

  const credentialId = responsePayload.id || responsePayload.rawId;
  if (!credentialId) {
    res.status(400).json({ verified: false, error: "Missing credential ID" });
    return;
  }

  // Locate matching credential
  const credential =
    (req.body.credential as WebAuthnCredential | undefined) ??
    req.session.webauthnCredentials?.find((c) => c.id === credentialId) ??
    webauthnService.getCredentialById(credentialId);

  if (!credential) {
    res.status(400).json({ verified: false, error: "Credential not found" });
    return;
  }

  const verification = await webauthnService.verifyAuthenticationResponse({
    challenge,
    credential,
    response: {
      id: responsePayload.id,
      rawId: responsePayload.rawId || responsePayload.id,
      clientDataJSON: responsePayload.clientDataJSON,
      authenticatorData: responsePayload.authenticatorData,
      signature: responsePayload.signature,
      userHandle: responsePayload.userHandle,
    },
  });

  if (!verification.verified) {
    res.status(400).json({ verified: false, error: "Authentication verification failed" });
    return;
  }

  // Upgrade session with mfaVerified: true
  req.session.mfaVerified = true;
  req.session.currentWebAuthnChallenge = undefined;
  credential.counter = verification.newCounter;
  webauthnService.updateCredentialCounter(credential.id, verification.newCounter);

  req.session.save((err) => {
    if (err) {
      logger.error("[WebAuthn] Failed to save MFA session:", err);
      res.status(500).json({ error: "Failed to update session" });
      return;
    }
    res.json({ verified: true, mfaVerified: true });
  });
});

router.use("/webauthn", webauthnRouter);

export default router;
