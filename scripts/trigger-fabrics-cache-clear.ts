import fetch from "node-fetch";

async function triggerFabricsCacheClear() {
  try {
    const createResponse = await fetch("http://localhost:5001/api/fabrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `CACHE_CLEAR_TRIGGER_${Date.now()}`,
        description: "Temporary fabric to trigger cache invalidation",
        weight: "0 GSM",
        isActive: false,
        properties: {},
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create dummy fabric: ${createResponse.statusText}`);
    }

    const createdFabric = await createResponse.json();
    const fabricId = createdFabric.id;
    const deleteResponse = await fetch(`http://localhost:5001/api/fabrics/${fabricId}`, {
      method: "DELETE",
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete dummy fabric: ${deleteResponse.statusText}`);
    }
    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

await triggerFabricsCacheClear();
