import { logger } from "../../server/lib/monitoring/logger.js";

const NEON_API_KEY = process.env.NEON_API_KEY;
const PROJECT_ID = process.env.NEON_PROJECT_ID;

if (!NEON_API_KEY || !PROJECT_ID) {
  console.error("❌ NEON_API_KEY and NEON_PROJECT_ID environment variables are required.");
  process.exit(1);
}

interface NeonBranch {
  id: string;
  name: string;
  created_at: string;
}

async function cleanupBranches() {
  console.log("🔍 Fetching branches for project:", PROJECT_ID);

  try {
    const response = await fetch(
      `https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches`,
      {
        headers: {
          Authorization: `Bearer ${NEON_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch branches: ${response.statusText}`);
    }

    const data = (await response.json()) as { branches: NeonBranch[] };
    const branches = data.branches;

    console.log(`📊 Found ${branches.length} branches total.`);

    const targets = branches.filter(
      (b) => b.name.startsWith("preview/") || b.name.startsWith("backup/"),
    );

    console.log(`🎯 Identified ${targets.length} branches for potential cleanup.`);

    for (const branch of targets) {
      const createdAt = new Date(branch.created_at);
      const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

      // Manual cleanup might want to be more conservative or aggressive
      if (ageHours > 24) {
        console.log(`🗑️ Deleting branch: ${branch.name} (Age: ${Math.round(ageHours)}h)`);

        const delResponse = await fetch(
          `https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches/${branch.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${NEON_API_KEY}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!delResponse.ok) {
          console.error(`❌ Failed to delete ${branch.name}: ${delResponse.statusText}`);
        } else {
          console.log(`✅ Deleted ${branch.name}`);
        }
      } else {
        console.log(`⏳ Skipping young branch: ${branch.name} (Age: ${Math.round(ageHours)}h)`);
      }
    }

    console.log("✨ Cleanup complete.");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

cleanupBranches();
