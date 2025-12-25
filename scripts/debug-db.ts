import { db } from "../server/db.js";
import {
  technologyEquipment,
  technologyInnovations,
  technologyResearch,
} from "../shared/schema.js";

async function main() {
  try {
    const research = await db.select().from(technologyResearch).limit(1);
  } catch (error) {}

  try {
    const innovations = await db.select().from(technologyInnovations).limit(1);
  } catch (error) {}

  try {
    const equipment = await db.select().from(technologyEquipment).limit(1);
  } catch (error) {}
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
