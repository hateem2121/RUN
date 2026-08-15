import nodemailer from "nodemailer";
import "dotenv/config";
import { ResultAsync } from "neverthrow";
import { logger } from "../server/lib/monitoring/logger.js";

async function verifyEmail() {
  logger.info("🔍 Checking Gmail SMTP connectivity...");

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    logger.error("❌ Gmail credentials not configured.");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  const result = await ResultAsync.fromPromise(transporter.verify(), (error) =>
    error instanceof Error ? error : new Error(String(error)),
  );

  result.match(
    () => {
      logger.info("✅ Gmail SMTP connection successful.");
      process.exit(0);
    },
    (error) => {
      logger.error("❌ Gmail SMTP connection failed:", error);
      process.exit(1);
    },
  );
}

verifyEmail();
