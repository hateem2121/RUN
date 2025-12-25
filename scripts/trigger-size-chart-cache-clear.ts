import fetch from "node-fetch";

async function triggerSizeChartCacheClear() {
  try {
    const createRes = await fetch("http://localhost:5001/api/size-charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "CACHE_CLEAR_TRIGGER",
        region: "US",
        type: "System",
        description: "Temporary item to trigger cache invalidation",
        measurements: { S: { Chest: "100" } },
        isActive: false,
      }),
    });

    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`Failed to create dummy: ${createRes.status} - ${text}`);
    }

    const dummy = await createRes.json();
    const deleteRes = await fetch(`http://localhost:5001/api/size-charts/${dummy.id}`, {
      method: "DELETE",
    });

    if (!deleteRes.ok) {
      throw new Error(`Failed to delete dummy: ${deleteRes.status}`);
    }
    const listRes = await fetch("http://localhost:5001/api/size-charts");
    const list = await listRes.json();

    // List the new charts to confirm
    const newCharts = list.filter(
      (c: any) =>
        c.name.includes("Sculpt & Stride") ||
        c.name.includes("Heavyweight Fleece") ||
        c.name.includes("Pro-Grip"),
    );

    if (newCharts.length > 0) {
      newCharts.forEach((c: any) => {});
    }
  } catch (error) {}
}

await triggerSizeChartCacheClear();
