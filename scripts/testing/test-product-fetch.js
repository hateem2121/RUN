const { getStorage } = require("./server/lib/storage-singleton.js");

async function test() {
  try {
    const storage = getStorage();

    const result = await storage.getProductBySlug("relaxed-fit-performance-t-shirt");

    if (result && typeof result === "object" && "ok" in result) {
    }
  } catch (_err) {}
}

test();
