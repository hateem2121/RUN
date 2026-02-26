import { db } from "./server/db";
import { footerConfiguration } from "./shared/schema";

async function verify() {
  try {
    const config = await db.select().from(footerConfiguration).limit(1);
    console.log("DATABASE_FOOTER_CONFIG:", JSON.stringify(config, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("DATABASE_ERROR:", err);
    process.exit(1);
  }
}

verify();
