import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function fixWetsuitDuplicate() {
  try {
    console.log("🔧 Fixing Wetsuit Duplicate Composition...\n");

    const fabricData = await db.query.fabrics.findFirst({
      where: eq(fabrics.name, "Eco-Flex™ Scuba 3.0"),
    });

    if (!fabricData) {
      console.log("❌ Fabric 'Eco-Flex™ Scuba 3.0' not found");
      return;
    }

    const props = fabricData.properties as any;

    // Remove the duplicate first entry (100%/0%)
    props.compositions = props.compositions.filter((comp: any, index: number) => {
      // Remove the first "Limestone-Nylon" with 100%/0%
      if (index === 0 && comp.name === "Limestone-Nylon" && comp.fibers[0]?.percentage === "100") {
        console.log("  🗑️ Removing duplicate Limestone-Nylon (100%/0%)");
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

    console.log("\n✅ Fixed wetsuit composition!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixWetsuitDuplicate();
