import { db } from "../server/db.js";
import { categories, navigationItems, products } from "../shared/schema.js";

async function checkData() {
  try {
    const productsCount = await db.select().from(products);
    const categoriesCount = await db.select().from(categories);
    const navItemsCount = await db.select().from(navigationItems);

    if (productsCount.length > 0) {
    }
    if (navItemsCount.length > 0) {
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

checkData();
