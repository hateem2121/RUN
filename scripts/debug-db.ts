import { db } from "../server/db.js";
import {
  technologyEquipment,
  technologyInnovations,
  technologyResearch,
} from "../shared/schema.js";

async function main() {
  console.log("Starting debug query...");

  try {
    console.log("Querying technologyResearch...");
    const research = await db.select().from(technologyResearch).limit(1);
    console.log("Research Result:", research);
  } catch (error) {
    console.error("Research Failed:", error);
  }

  try {
    console.log("Querying technologyInnovations...");
    const innovations = await db.select().from(technologyInnovations).limit(1);
    console.log("Innovations Result:", innovations);
  } catch (error) {
    console.error("Innovations Failed:", error);
  }

  try {
    console.log("Querying technologyEquipment...");
    const equipment = await db.select().from(technologyEquipment).limit(1);
    console.log("Equipment Result:", equipment);
  } catch (error) {
    console.error("Equipment Failed:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
