import { LRUCache } from "lru-cache";

try {
  const cache = new LRUCache({ max: 10 });
  console.log("LRUCache is a valid constructor. Version check passed.");
  process.exit(0);
} catch (e) {
  console.error("LRUCache error:", e);
  process.exit(1);
}
