import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";

async function fixWetsuitDuplicate() {
  try {
    const fabricData = await db.query.fabrics.findFirst({
      where: eq(fabrics.name, "Eco-Flex™ Scuba 3.0"),
    });

    if (!fabricData) {
      return;
    }

    const props = fabricData.properties as any;

    // Remove the duplicate first entry (100%/0%)
    props.compositions = props.compositions.filter((comp: any, index: number) => {
      // Remove the first "Limestone-Nylon" with 100%/0%
      if (index === 0 && comp.name === "Limestone-Nylon" && comp.fibers[0]?.percentage === "100") {
        return false;
      }
      return true;
    });

    await db
      .update(fabrics)
      .set({
        properties: props,
      })
      .where(eq(fabrics.id, fabricData.id));
    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

fixWetsuitDuplicate();
