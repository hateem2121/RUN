import Database from "@replit/database";

const db = new Database();

(async () => {
  /* 1️⃣ GET COUNTER TO KNOW HOW MANY ASSETS EXIST */
  const counterData = (await db.get("mediaAssets_counter")) || 0;
  const counter = typeof counterData === "object" ? counterData.value || 0 : counterData;

  // If counter is 0, try to find the actual range by checking known IDs
  let actualCounter = counter;
  if (counter === 0) {
    for (let id = 1; id <= 100; id++) {
      const key = `mediaAssets:${id}`;
      const asset = await db.get(key);
      if (asset) {
        actualCounter = Math.max(actualCounter, id);
      }
    }
  }

  /* 2️⃣ BACKUP & MIGRATION */
  const backupData = {};
  let migrationCount = 0;
  let _updateCount = 0;

  for (let id = 1; id <= actualCounter; id++) {
    const key = `mediaAssets:${id}`;
    const asset = await db.get(key);

    if (!asset) continue;

    // Parse the asset if it's a string
    const parsedAsset = typeof asset === "string" ? JSON.parse(asset) : asset;
    const value = parsedAsset.value || parsedAsset;

    if (!value || !value.id) continue;

    // Backup original
    backupData[key] = asset;

    // Debug: Show first few assets to understand structure
    if (migrationCount < 3) {
    }

    // Check if migration needed
    let needsUpdate = false;
    const clone = { ...value };

    // Main file URL
    if (value.url?.includes("object-storage.replit.app")) {
      const filename = value.url.split("/").pop();
      clone.url = `/api/media/proxy/${filename}`;
      needsUpdate = true;
    }

    // Thumbnail URL
    if (value.thumbnailUrl?.includes("object-storage.replit.app")) {
      const filename = value.thumbnailUrl.split("/").pop();
      clone.thumbnailUrl = `/api/media/proxy/${filename}`;
      needsUpdate = true;
    }

    if (needsUpdate) {
      // Update with same structure as original
      const updatedAsset =
        typeof asset === "string"
          ? JSON.stringify(clone)
          : parsedAsset.value
            ? { ...parsedAsset, value: clone }
            : clone;

      await db.set(key, updatedAsset);
      _updateCount++;
    }

    migrationCount++;
  }

  // Save backup
  await db.set("mediaAssets_migration_backup", backupData);
})();
