import { eq } from "drizzle-orm";
import { aboutHero, mediaAssets } from "../../shared/schema.js";
import { db } from "../db.js";

async function seedAboutHero() {
  // 1. Create a dummy media asset record to satisfy the foreign key constraint
  const placeholderUrl =
    "https://images.unsplash.com/photo-1552674605-4694559e5bc7?q=80&w=2669&auto=format&fit=crop";

  // Check if this specific asset already exists to avoid duplicates
  const existingAsset = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.filename, "hero-placeholder.jpg"))
    .limit(1);

  let mediaId: number;

  if (existingAsset.length > 0 && existingAsset[0]) {
    mediaId = existingAsset[0].id;
  } else {
    // Create new asset
    const result = await db
      .insert(mediaAssets)
      .values({
        filename: "hero-placeholder.jpg",
        originalName: "hero-placeholder.jpg",
        mimeType: "image/jpeg",
        type: "image",
        url: placeholderUrl,
        storagePath: "placeholders/hero.jpg", // Mock path
        bucketName: "placeholder-bucket", // Mock bucket
        isActive: true,
        metadata: {},
      })
      .returning();

    if (!result[0]) {
      throw new Error("Failed to create media asset");
    }
    mediaId = result[0].id;
  }

  // 2. Update the About Hero record to point to this media asset
  const existingHero = await db.select().from(aboutHero).limit(1);

  if (existingHero.length > 0 && existingHero[0]) {
    await db
      .update(aboutHero)
      .set({
        backgroundMediaId: mediaId, // Set the background media!
        imageId: null, // Clear imageId if we are using backgroundMediaId for the full hero
        // headline/subheadline can be updated here if we want to fix typography content too, but let's stick to the visual fix first.
      })
      .where(eq(aboutHero.id, existingHero[0].id));
  } else {
    await db.insert(aboutHero).values({
      title: "Crafting Athletic Excellence",
      subtitle: "Since 2003",
      description: "Leading manufacturer of premium activewear.",
      backgroundMediaId: mediaId,
      isActive: true,
    });
  }
  process.exit(0);
}

seedAboutHero().catch((_err) => {
  process.exit(1);
});
