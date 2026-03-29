import nodemailer from "nodemailer";
import "dotenv/config";

async function verifyEmail() {
  console.log("🔍 Checking Gmail SMTP connectivity...");

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.error("❌ Gmail credentials not configured.");
    process.exit(1);
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.verify();
    console.log("✅ Gmail SMTP connection successful.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Gmail SMTP connection failed:", error);
    process.exit(1);
  }
}

verifyEmail();
