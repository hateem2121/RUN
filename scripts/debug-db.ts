import { db } from "../server/db.js";
import {
  technologyEquipment,
  technologyInnovations,
  technologyResearch,
} from "../shared/schema.js";

async function main() {
  try {
    const _research = await db.select().from(technologyResearch).limit(1);
  } catch (_error) {}

  try {
    const _innovations = await db.select().from(technologyInnovations).limit(1);
  } catch (_error) {}

  try {
    const _equipment = await db.select().from(technologyEquipment).limit(1);
  } catch (_error) {}
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
