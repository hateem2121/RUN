import { users } from "@run-remix/shared";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db.js";
import { logger } from "../lib/monitoring/logger.js";

const devRouter = Router();

// Dev Login Route
devRouter.get("/login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).send("Not found");
  }

  try {
    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, "team@wear-run.com"),
    });

    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    const sessionUser = {
      ...adminUser,
      claims: { sub: adminUser.id, email: adminUser.email, isMock: true },
    };

    return req.login(sessionUser, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login failed" });
      }
      logger.info(`[Dev] Logged in as admin: ${adminUser.email}`);
      return res.json({
        success: true,
        message: "Logged in as admin",
        user: sessionUser,
      });
    });
  } catch (error) {
    logger.error("[Dev] Login failed manually:", error);
    return res.status(500).json({ error: String(error) });
  }
});

export default devRouter;
