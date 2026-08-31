import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import sharp from "sharp";

const BRAIN_DIR =
  "/Users/hateemjamshaid/.gemini/antigravity/brain/847b1cf5-641c-470a-b287-1cefe74b9e6e";
const PUBLIC_IMG_DIR = path.resolve("client/public/images");

interface AssetSpec {
  folder: string;
  filename: string;
  width: number;
  height: number;
  sourceType: "brain" | "url";
  sourcePath?: string;
  sourceUrl?: string;
}

const ASSET_SPECS: AssetSpec[] = [
  // ── 1. Categories ──────────────────────────────────────────────────────────
  {
    folder: "categories",
    filename: "team-wear.webp",
    width: 800,
    height: 600,
    sourceType: "brain",
    sourcePath: "team_wear_category_1788118580464.jpg",
  },
  {
    folder: "categories",
    filename: "active-wear.webp",
    width: 800,
    height: 600,
    sourceType: "brain",
    sourcePath: "active_wear_category_1788118606985.jpg",
  },
  {
    folder: "categories",
    filename: "casual-wear.webp",
    width: 800,
    height: 600,
    sourceType: "brain",
    sourcePath: "casual_wear_category_1788118636663.jpg",
  },
  {
    folder: "categories",
    filename: "outer-wear.webp",
    width: 800,
    height: 600,
    sourceType: "brain",
    sourcePath: "outer_wear_category_1788118669097.jpg",
  },
  {
    folder: "categories",
    filename: "sports-accessories.webp",
    width: 800,
    height: 600,
    sourceType: "brain",
    sourcePath: "accessories_category_1788118707251.jpg",
  },

  // ── 2. Featured Products ───────────────────────────────────────────────────
  {
    folder: "products",
    filename: "aero-tech-shell.webp",
    width: 800,
    height: 1000,
    sourceType: "brain",
    sourcePath: "product_aero_shell_1788118748675.jpg",
  },
  {
    folder: "products",
    filename: "pro-team-jersey.webp",
    width: 800,
    height: 1000,
    sourceType: "brain",
    sourcePath: "product_pro_jersey_1788118791275.jpg",
  },
  {
    folder: "products",
    filename: "seamless-compression-tight.webp",
    width: 800,
    height: 1000,
    sourceType: "brain",
    sourcePath: "product_compression_set_1788118839424.jpg",
  },
  {
    folder: "products",
    filename: "carbon-knit-runner.webp",
    width: 800,
    height: 1000,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1578768079052-aa76e5200291?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "products",
    filename: "thermal-storm-hoodie.webp",
    width: 800,
    height: 1000,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "products",
    filename: "hydro-dri-base.webp",
    width: 800,
    height: 1000,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1200&auto=format&fit=crop",
  },

  // ── 3. Production Pipeline / Process ───────────────────────────────────────
  {
    folder: "homepage",
    filename: "process-1.webp",
    width: 800,
    height: 600,
    sourceType: "brain",
    sourcePath: "process_research_rd_1788119003076.jpg",
  },
  {
    folder: "homepage",
    filename: "process-2.webp",
    width: 800,
    height: 600,
    sourceType: "brain",
    sourcePath: "process_pattern_cutting_1788119064646.jpg",
  },
  {
    folder: "homepage",
    filename: "process-3.webp",
    width: 800,
    height: 600,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "homepage",
    filename: "process-4.webp",
    width: 800,
    height: 600,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
  },

  // ── 4. Manufacturing ───────────────────────────────────────────────────────
  {
    folder: "manufacturing",
    filename: "facility-solar-overview.webp",
    width: 1600,
    height: 900,
    sourceType: "brain",
    sourcePath: "factory_solar_facility_1788118553687.jpg",
  },
  {
    folder: "manufacturing",
    filename: "laser-cutting.webp",
    width: 1200,
    height: 800,
    sourceType: "brain",
    sourcePath: "process_pattern_cutting_1788119064646.jpg",
  },
  {
    folder: "manufacturing",
    filename: "automated-sewing.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "manufacturing",
    filename: "quality-testing-lab.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "manufacturing",
    filename: "export-logistics.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
  },

  // ── 5. Sustainability ──────────────────────────────────────────────────────
  {
    folder: "sustainability",
    filename: "solar-rooftop.webp",
    width: 1600,
    height: 900,
    sourceType: "brain",
    sourcePath: "factory_solar_facility_1788118553687.jpg",
  },
  {
    folder: "sustainability",
    filename: "water-recycling-zld.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "sustainability",
    filename: "organic-cotton.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "sustainability",
    filename: "recycled-polyester.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1200&auto=format&fit=crop",
  },

  // ── 6. Technology ──────────────────────────────────────────────────────────
  {
    folder: "technology",
    filename: "3d-digital-twin.webp",
    width: 1200,
    height: 800,
    sourceType: "brain",
    sourcePath: "process_research_rd_1788119003076.jpg",
  },
  {
    folder: "technology",
    filename: "seamless-knitting.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "technology",
    filename: "ultrasonic-bonding.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "technology",
    filename: "automated-inspection.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=1200&auto=format&fit=crop",
  },

  // ── 7. About & Heritage ────────────────────────────────────────────────────
  {
    folder: "about",
    filename: "heritage-1889.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "about",
    filename: "master-craftsmen.webp",
    width: 1200,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "about",
    filename: "hq-campus.webp",
    width: 1600,
    height: 900,
    sourceType: "brain",
    sourcePath: "factory_solar_facility_1788118553687.jpg",
  },

  // ── 8. Technical Fabrics ───────────────────────────────────────────────────
  {
    folder: "fabrics",
    filename: "dri-fit-mesh.webp",
    width: 800,
    height: 800,
    sourceType: "brain",
    sourcePath: "fabric_placeholder_universal_1788118943828.jpg",
  },
  {
    folder: "fabrics",
    filename: "merino-blend.webp",
    width: 800,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "fabrics",
    filename: "cordura-nylon.webp",
    width: 800,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop",
  },
  {
    folder: "fabrics",
    filename: "organic-fleece.webp",
    width: 800,
    height: 800,
    sourceType: "url",
    sourceUrl:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=1200&auto=format&fit=crop",
  },

  // ── 9. Universal Placeholders ──────────────────────────────────────────────
  {
    folder: "placeholders",
    filename: "product-placeholder.webp",
    width: 800,
    height: 800,
    sourceType: "brain",
    sourcePath: "product_placeholder_universal_1788118888927.jpg",
  },
  {
    folder: "placeholders",
    filename: "fabric-placeholder.webp",
    width: 800,
    height: 800,
    sourceType: "brain",
    sourcePath: "fabric_placeholder_universal_1788118943828.jpg",
  },
  {
    folder: "placeholders",
    filename: "category-placeholder.webp",
    width: 800,
    height: 600,
    sourceType: "brain",
    sourcePath: "active_wear_category_1788118606985.jpg",
  },
  {
    folder: "placeholders",
    filename: "certificate-placeholder.webp",
    width: 800,
    height: 600,
    sourceType: "brain",
    sourcePath: "factory_solar_facility_1788118553687.jpg",
  },
];

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          downloadImage(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function run() {
  console.log("🚀 [Asset Generator] Starting multi-format WebP generation...");

  // Ensure all directories exist
  const folders = new Set(ASSET_SPECS.map((s) => s.folder));
  for (const folder of folders) {
    const dir = path.join(PUBLIC_IMG_DIR, folder);
    await fs.mkdir(dir, { recursive: true });
  }

  let count = 0;
  for (const spec of ASSET_SPECS) {
    const outPath = path.join(PUBLIC_IMG_DIR, spec.folder, spec.filename);
    try {
      let inputBuffer: Buffer;
      if (spec.sourceType === "brain" && spec.sourcePath) {
        const brainPath = path.join(BRAIN_DIR, spec.sourcePath);
        inputBuffer = await fs.readFile(brainPath);
      } else if (spec.sourceType === "url" && spec.sourceUrl) {
        inputBuffer = await downloadImage(spec.sourceUrl);
      } else {
        console.warn(`Skipping ${spec.filename} - invalid source`);
        continue;
      }

      // Convert & optimize to WebP with Sharp
      const outputBuffer = await sharp(inputBuffer)
        .resize(spec.width, spec.height, { fit: "cover", position: "center" })
        .webp({ quality: 82, effort: 5 })
        .toBuffer();

      await fs.writeFile(outPath, outputBuffer);

      // Also create fallback PNG for backwards compatibility
      const pngPath = outPath.replace(/\.webp$/, ".png");
      const pngBuffer = await sharp(inputBuffer)
        .resize(spec.width, spec.height, { fit: "cover", position: "center" })
        .png({ compressionLevel: 8 })
        .toBuffer();
      await fs.writeFile(pngPath, pngBuffer);

      count++;
      const kb = (outputBuffer.length / 1024).toFixed(1);
      console.log(
        `  ✓ [${count}/${ASSET_SPECS.length}] Created: images/${spec.folder}/${spec.filename} (${kb} KB)`,
      );
    } catch (err) {
      console.error(`  ❌ Failed to generate ${spec.filename}:`, err);
    }
  }

  console.log(
    `\n🎉 [Asset Generator] Successfully generated ${count} optimized multi-format assets!`,
  );
}

run().catch(console.error);
