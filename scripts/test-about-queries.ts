import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import {
  aboutHero,
  aboutMapLocations,
  aboutSections,
  aboutStatistics,
  aboutTeamMessages,
  aboutTimelineEntries,
} from "../shared/schemas/index.js";

async function testQueries() {
  const queries = [
    {
      name: "aboutHero",
      query: db.select().from(aboutHero).where(eq(aboutHero.isActive, true)).limit(1),
    },
    {
      name: "aboutTimeline",
      query: db.select().from(aboutTimelineEntries).where(eq(aboutTimelineEntries.isActive, true)),
    },
    {
      name: "aboutMap",
      query: db.select().from(aboutMapLocations).where(eq(aboutMapLocations.isActive, true)),
    },
    {
      name: "aboutSections",
      query: db.select().from(aboutSections).where(eq(aboutSections.isActive, true)),
    },
    {
      name: "aboutStats",
      query: db.select().from(aboutStatistics).where(eq(aboutStatistics.isActive, true)),
    },
    {
      name: "aboutTeam",
      query: db.select().from(aboutTeamMessages).where(eq(aboutTeamMessages.isActive, true)),
    },
  ];

  for (const q of queries) {
    console.log(`Testing query: ${q.name}...`);
    try {
      const result = await q.query;
      console.log(`  ✅ ${q.name} success: ${result.length} rows`);
    } catch (e) {
      console.log(`  ❌ ${q.name} failed:`, e.message);
      if (e.cause) console.log(`    Cause:`, e.cause);
    }
  }
  process.exit(0);
}

testQueries();
