import { Router } from "express";
import { InternalError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { authService } from "../services/auth-service.js";

const devRouter = Router();

// Dev Login Route
devRouter.get("/login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).send("Not found");
  }

  const result = await authService.devLogin();

  if (result.isErr()) {
    const status = (result.error as { status?: number }).status || 500;
    return res.status(status).json({ error: result.error.message });
  }

  const sessionUser = result.value;

  return req.login(sessionUser, (err) => {
    if (err) {
      logger.error("[Dev] Session login failed", err);
      throw new InternalError("Login session creation failed", { error: err });
    }
    logger.info(`[Dev] Logged in as admin: ${sessionUser.email}`);
    return res.json({
      success: true,
      message: "Logged in as admin",
      user: sessionUser,
    });
  });
});

export default devRouter;
