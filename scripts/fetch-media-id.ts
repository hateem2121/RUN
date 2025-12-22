import { desc } from "drizzle-orm";
import { db } from "../server/db.js";
import { mediaAssets } from "../shared/schema.js";

async function main() {
    try {
        const result = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.id)).limit(1);
        if (result.length > 0) {
            console.log(JSON.stringify(result[0], null, 2));
        } else {
            console.log("No media assets found.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error fetching media asset:", error);
        process.exit(1);
    }
}

main();
