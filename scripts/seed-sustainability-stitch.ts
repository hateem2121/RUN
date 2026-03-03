/**
 * Sustainability 100/100 Stitch Fidelity Seed Script
 * Uses the project's own Pool-based database connection.
 * Run: npx tsx scripts/seed-sustainability-stitch.ts
 */
import { pool, closeDatabaseConnection } from "../server/db.js";

async function seed() {
  console.log("🌱 Seeding sustainability data for 100/100 Stitch fidelity...\n");

  // 1. Update unified_sustainability hero record
  console.log("1️⃣  Updating hero headline & CTA...");
  await pool.query(`
    UPDATE unified_sustainability SET
      headline = 'Sustainability Woven Into Every Thread',
      subheadline = 'Pioneering the future of eco-conscious sportswear manufacturing with zero-waste processes and 100% renewable energy.',
      call_to_action_title = 'Join Our Sustainable Journey',
      call_to_action_description = 'Partner with a manufacturer that prioritizes the planet as much as performance. Let''s build the future of sportswear together.',
      call_to_action_button_text = 'Start a Project',
      call_to_action_button_link = '/contact',
      metrics_title = 'Engineered for Impact',
      metrics_description = 'Measuring our commitment to environmental sustainability through real metrics and achievements.',
      certifications_title = 'Trusted Standards',
      certifications_description = 'We''re proud to hold industry-leading certifications that validate our commitment to sustainable and ethical manufacturing practices.',
      initiatives_title = 'Pioneering Our Future',
      initiatives_description = 'Discover our comprehensive sustainability programs and initiatives driving positive environmental impact.',
      goals_title = '2030 Sustainability Roadmap',
      goals_description = 'Track our progress toward achieving ambitious sustainability targets and environmental commitments.',
      features_title = 'Engineered for Impact',
      features_description = 'Our commitment to sustainability is built into every fiber, every process, and every product.',
      fabric_portfolio_title = 'Sustainable Material Library',
      fabric_portfolio_description = 'Explore our curated collection of eco-conscious fabrics, each engineered for performance and sustainability.',
      updated_at = NOW()
    WHERE id = 2
  `);

  // 2. Replace metrics
  console.log("2️⃣  Replacing metrics...");
  await pool.query(`DELETE FROM sustainability_metrics`);
  await pool.query(`
    INSERT INTO sustainability_metrics (name, value, unit, description, category, icon_name, is_active, sort_order) VALUES
      ('Water Saved', '2500000', 'Liters', 'Total water saved through closed-loop manufacturing processes', 'environment', 'Droplets', true, 1),
      ('CO₂ Reduced', '450', 'Tons', 'Annual carbon emissions reduced through renewable energy and process optimization', 'emissions', 'Wind', true, 2),
      ('Materials Recycled', '85', '%', 'Of our raw materials come from recycled or sustainable sources', 'materials', 'Recycle', true, 3),
      ('Renewable Energy', '100', '%', 'Of factory operations powered by solar and wind energy', 'energy', 'TreePine', true, 4)
  `);

  // 3. Replace goals
  console.log("3️⃣  Replacing goals...");
  await pool.query(`DELETE FROM sustainability_goals`);
  await pool.query(`
    INSERT INTO sustainability_goals (title, description, target, current_progress, current_value, target_value, target_year, unit, category, priority, is_active, sort_order) VALUES
      ('Net Zero Operations', 'Achieve carbon-neutral manufacturing across all facilities with 100% renewable energy.', '100% Carbon Neutral', 85.00, 85.00, 100.00, 2025, '%', 'emissions', 'high', true, 1),
      ('Full Material Audit', 'Complete lifecycle assessment of every material in our supply chain for transparency.', '100% Materials Audited', 60.00, 60.00, 100.00, 2028, '%', 'materials', 'high', true, 2),
      ('Net Neutral Impact', 'Reach net-neutral environmental impact through offsets, innovation, and circularity.', 'Net Zero Environmental Impact', 25.00, 25.00, 100.00, 2030, '%', 'sustainability', 'high', true, 3)
  `);

  // 4. Insert certificates
  console.log("4️⃣  Inserting certificates...");
  const certData = [
    { name: "BCI", body: "Better Cotton Initiative", desc: "Certified sustainable cotton sourcing through the Better Cotton Initiative standard." },
    { name: "GRS", body: "Global Recycled Standard", desc: "Verified recycled content and responsible production practices." },
    { name: "OEKO-TEX", body: "OEKO-TEX Association", desc: "Tested for harmful substances, ensuring product safety for consumers." },
    { name: "GOTS", body: "Global Organic Textile Standard", desc: "Certified organic fiber processing with strict environmental and social criteria." },
    { name: "ISO 14001", body: "International Organization for Standardization", desc: "Environmental management system certification." },
    { name: "bluesign", body: "bluesign Technologies", desc: "System partner certification for sustainable textile production." },
  ];

  for (let i = 0; i < certData.length; i++) {
    const c = certData[i];
    const existing = await pool.query(`SELECT id FROM certificates WHERE name = $1`, [c.name]);
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO certificates (name, issuing_body, description, is_active, show_on_sustainability_page) VALUES ($1, $2, $3, true, true)`,
        [c.name, c.body, c.desc]
      );
    } else {
      await pool.query(
        `UPDATE certificates SET show_on_sustainability_page = true, is_active = true WHERE name = $1`,
        [c.name]
      );
    }
  }

  // 5. Link certs
  console.log("5️⃣  Linking certificates...");
  const certIds = await pool.query(
    `SELECT id FROM certificates WHERE show_on_sustainability_page = true AND is_active = true ORDER BY id`
  );
  const idArray = certIds.rows.map((r: any) => r.id);
  await pool.query(
    `UPDATE unified_sustainability SET certification_ids = $1::jsonb WHERE id = 2`,
    [JSON.stringify(idArray)]
  );

  // 6. Insert features
  console.log("6️⃣  Replacing features...");
  await pool.query(`DELETE FROM sustainability_features`);
  await pool.query(`
    INSERT INTO sustainability_features (title, description, category, impact, is_active, sort_order) VALUES
      ('Zero Waste Manufacturing', 'Our closed-loop production system recycles 99.7% of manufacturing waste, turning off-cuts into new raw materials.', 'manufacturing', 'Reduces landfill waste by 450 tons annually', true, 1),
      ('Carbon Neutral Shipping', 'Every shipment is offset through verified carbon credits and optimized logistics routes.', 'logistics', 'Net-zero emissions on all outbound freight', true, 2),
      ('Water Stewardship', 'Advanced waterless dyeing technology and closed-loop water treatment reduce consumption by 85%.', 'water', 'Saves 2.5 million liters of water per year', true, 3)
  `);

  // 7. Update initiatives
  console.log("7️⃣  Updating initiatives...");
  const initiatives = await pool.query(`SELECT id FROM sustainability_initiatives ORDER BY sort_order, id`);
  if (initiatives.rows.length >= 1) {
    await pool.query(`
      UPDATE sustainability_initiatives SET
        title = 'Reclaiming Our Oceans',
        description = 'Partnering with global ocean cleanup initiatives to transform recovered ocean plastic into high-performance sportswear fibers.',
        category = 'Ocean Conservation',
        impact = 'Environmental Impact',
        updated_at = NOW()
      WHERE id = $1
    `, [initiatives.rows[0].id]);
  }
  if (initiatives.rows.length >= 2) {
    await pool.query(`
      UPDATE sustainability_initiatives SET
        title = 'Powering The Future',
        description = 'Our state-of-the-art solar farm generates 100% of our manufacturing energy needs, making every garment powered by the sun.',
        category = 'Renewable Energy',
        impact = 'Clean Energy',
        updated_at = NOW()
      WHERE id = $1
    `, [initiatives.rows[1].id]);
  }

  console.log("\n✅ Sustainability data seeded successfully for 100/100 Stitch fidelity!");
  console.log("   Refresh /sustainability to see changes.\n");

  await closeDatabaseConnection();
}

seed().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await closeDatabaseConnection();
  process.exit(1);
});
