#!/usr/bin/env tsx

import { db } from "../server/db.js";
import { accessories } from "../shared/schema.js";

async function checkAccessories() {
  try {
    const allAccessories = await db.select().from(accessories);

    allAccessories.forEach((_acc, _index) => {});
  } finally {
    process.exit(0);
  }
}

try {
  await checkAccessories();
} catch (_error) {
  process.exit(1);
}
