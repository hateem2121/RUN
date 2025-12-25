import fetch from "node-fetch";

async function triggerCacheInvalidation() {
  try {
    const createRes = await fetch("http://localhost:5001/api/accessories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "CACHE_CLEAR_TRIGGER",
        category: "System",
        description: "Temporary item to trigger cache invalidation",
        isActive: false,
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create dummy: ${createRes.status}`);
    }

    const dummy = await createRes.json();
    const deleteRes = await fetch(`http://localhost:5001/api/accessories/${dummy.id}`, {
      method: "DELETE",
    });

    if (!deleteRes.ok) {
      throw new Error(`Failed to delete dummy: ${deleteRes.status}`);
    }
    const listRes = await fetch("http://localhost:5001/api/accessories");
    const list = await listRes.json();
  } catch (error) {}
}

await triggerCacheInvalidation();
