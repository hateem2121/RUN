import { LRUCache } from "lru-cache";

try {
  new LRUCache({ max: 10 });
  process.exit(0);
} catch (e) {
  console.error("LRUCache error:", e);
  process.exit(1);
}
