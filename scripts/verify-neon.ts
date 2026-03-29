import { checkDatabaseConnection } from "../server/db.js";

async function verifyNeon() {
  console.log("🔍 Checking Neon DB connectivity...");
  const isConnected = await checkDatabaseConnection();

  if (isConnected) {
    console.log("✅ Neon DB connection successful.");
    process.exit(0);
  } else {
    console.error("❌ Neon DB connection failed.");
    process.exit(1);
  }
}

verifyNeon();
