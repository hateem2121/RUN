import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

// Configure WebSocket for Node.js
neonConfig.webSocketConstructor = ws;

const DATABASE_URL =
  "postgresql://neondb_owner:npg_ifse9Lj4CwBp@ep-cold-unit-ad2tlicp-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

async function main() {
  console.log("🚀 Starting COMPREHENSIVE test database stabilization (Neon Serverless)...");
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // 1. Fabrics
    console.log("Updating fabrics...");
    await pool.query("ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS sport text;");
    await pool.query("ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS market_segment text;");
    await pool.query("ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS seasonality text;");

    // 2. Manufacturing
    console.log("Updating manufacturing_*...");
    await pool.query(
      "ALTER TABLE manufacturing_hero ADD COLUMN IF NOT EXISTS headline varchar(255);",
    );
    await pool.query("ALTER TABLE manufacturing_hero ADD COLUMN IF NOT EXISTS subheadline text;");
    await pool.query(
      "ALTER TABLE manufacturing_processes ADD COLUMN IF NOT EXISTS title varchar(255);",
    );
    await pool.query(
      "ALTER TABLE manufacturing_capabilities ADD COLUMN IF NOT EXISTS title varchar(255);",
    );
    await pool.query(
      "ALTER TABLE manufacturing_qualities ADD COLUMN IF NOT EXISTS title varchar(255);",
    );

    // 3. Sustainability
    console.log("Updating sustainability_*...");
    await pool.query(
      "ALTER TABLE sustainability_initiatives ADD COLUMN IF NOT EXISTS icon_name varchar(50);",
    );
    await pool.query(
      "ALTER TABLE sustainability_initiatives ADD COLUMN IF NOT EXISTS category varchar(100);",
    );
    await pool.query(
      "ALTER TABLE sustainability_initiatives ADD COLUMN IF NOT EXISTS highlighted_features jsonb;",
    );
    await pool.query(
      "ALTER TABLE sustainability_goals ADD COLUMN IF NOT EXISTS current_value decimal(10, 2);",
    );
    await pool.query(
      "ALTER TABLE sustainability_goals ADD COLUMN IF NOT EXISTS target_value decimal(10, 2);",
    );
    await pool.query(
      "ALTER TABLE sustainability_goals ADD COLUMN IF NOT EXISTS target_year integer;",
    );
    await pool.query("ALTER TABLE sustainability_goals ADD COLUMN IF NOT EXISTS unit varchar(50);");

    // 4. Audit Logs (CRITICAL FIX)
    console.log("Updating audit_logs...");
    await pool.query("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email varchar(255);");
    await pool.query(
      "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email_index varchar(255);",
    );
    await pool.query("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role varchar(50);");
    await pool.query("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address varchar(255);");
    await pool.query("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent text;");
    await pool.query("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS session_id varchar(255);");

    // FIX for string truncation error (code: 22001)
    console.log("Fixing column lengths in audit_logs...");
    await pool.query("ALTER TABLE audit_logs ALTER COLUMN ip_address TYPE varchar(255);");
    await pool.query("ALTER TABLE audit_logs ALTER COLUMN user_agent TYPE text;");

    // 5. Media Assets
    console.log("Updating media_assets...");
    await pool.query(
      "ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS original_name varchar(255);",
    );
    await pool.query("ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS file_size integer;");
    await pool.query("ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS size integer;");
    await pool.query("ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS mime_type varchar(100);");
    await pool.query(
      "ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS thumbnail_filename varchar(255);",
    );
    await pool.query(
      "ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS thumbnail_storage_path text;",
    );
    await pool.query("ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS image_variants jsonb;");
    await pool.query("ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS alt_text text;");
    await pool.query(
      "ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS uploaded_at timestamp(3) DEFAULT now();",
    );

    // 6. Catalog (Certificates, etc.)
    console.log("Updating catalog entities...");
    await pool.query(
      "ALTER TABLE certificates ADD COLUMN IF NOT EXISTS type varchar(100) DEFAULT 'sustainability';",
    );
    await pool.query(
      "ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issuing_body varchar(255);",
    );
    await pool.query(
      "ALTER TABLE certificates ADD COLUMN IF NOT EXISTS document_url varchar(500);",
    );
    await pool.query("ALTER TABLE certificates ADD COLUMN IF NOT EXISTS image_url varchar(500);");
    await pool.query(
      "ALTER TABLE certificates ADD COLUMN IF NOT EXISTS show_on_sustainability_page boolean DEFAULT false;",
    );
    await pool.query("ALTER TABLE size_charts ADD COLUMN IF NOT EXISTS type varchar(100);");
    await pool.query("ALTER TABLE accessories ADD COLUMN IF NOT EXISTS type varchar(100);");

    // 7. System & Performance
    console.log("Updating system entities...");
    await pool.query(
      "ALTER TABLE performance_metrics ADD COLUMN IF NOT EXISTS component varchar(255);",
    );
    await pool.query(
      "ALTER TABLE logo_animation_settings ADD COLUMN IF NOT EXISTS motion_enabled boolean DEFAULT true;",
    );
    await pool.query(
      "ALTER TABLE logo_animation_settings ADD COLUMN IF NOT EXISTS motion_speed decimal(3, 2);",
    );
    await pool.query(
      "ALTER TABLE logo_animation_settings ADD COLUMN IF NOT EXISTS motion_elements jsonb;",
    );
    await pool.query(
      "ALTER TABLE logo_animation_settings ADD COLUMN IF NOT EXISTS animation_duration_multiplier decimal(3, 2) DEFAULT 1.0;",
    );
    await pool.query(
      "ALTER TABLE logo_animation_settings ADD COLUMN IF NOT EXISTS draw_stagger decimal(4, 2);",
    );
    await pool.query(
      "ALTER TABLE logo_animation_settings ADD COLUMN IF NOT EXISTS draw_easing varchar(100);",
    );
    await pool.query(
      "ALTER TABLE logo_animation_settings ADD COLUMN IF NOT EXISTS skip_button_enabled boolean DEFAULT false;",
    );
    await pool.query(
      "ALTER TABLE logo_animation_settings ADD COLUMN IF NOT EXISTS show_frequency boolean DEFAULT false;",
    );
    await pool.query(
      "ALTER TABLE logo_animation_settings ADD COLUMN IF NOT EXISTS custom_css_class varchar(255);",
    );
    await pool.query(
      "ALTER TABLE logo_animation_settings ADD COLUMN IF NOT EXISTS debug_mode boolean DEFAULT false;",
    );

    // 8. New Tables Creation
    console.log("Creating missing tables...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_configuration (
        id serial PRIMARY KEY,
        enabled boolean DEFAULT true,
        track_all_tables boolean DEFAULT false,
        tracked_tables jsonb,
        default_retention_days integer DEFAULT 2555,
        high_compliance_retention_days integer DEFAULT 3650,
        critical_compliance_retention_days integer DEFAULT 7300,
        batch_size integer DEFAULT 100,
        async_processing boolean DEFAULT true,
        exclude_sensitive_fields jsonb,
        encrypt_payloads boolean DEFAULT false,
        alert_on_critical_changes boolean DEFAULT true,
        alert_threshold integer DEFAULT 100,
        is_active boolean DEFAULT true,
        created_at timestamp(3) DEFAULT now(),
        updated_at timestamp(3) DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS storage_analysis_results (
        id serial PRIMARY KEY,
        timestamp varchar(50) NOT NULL,
        total_files integer NOT NULL,
        total_size integer NOT NULL,
        referenced_files integer NOT NULL,
        orphaned_count integer NOT NULL,
        duplicate_groups integer NOT NULL,
        compression_candidates integer NOT NULL,
        potential_savings jsonb,
        analysis_time integer NOT NULL,
        version varchar(50) NOT NULL,
        created_at timestamp(3) DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS storage_change_logs (
        id serial PRIMARY KEY,
        timestamp varchar(50) NOT NULL,
        action varchar(20) NOT NULL,
        media_id integer NOT NULL,
        filename varchar(255) NOT NULL,
        size integer,
        created_at timestamp(3) DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id serial PRIMARY KEY,
        metric_type varchar(100) NOT NULL,
        component_name varchar(255) NOT NULL,
        component varchar(255),
        value decimal(12, 4) NOT NULL,
        unit varchar(20) NOT NULL,
        metadata jsonb,
        timestamp timestamp(3) DEFAULT now(),
        created_at timestamp(3) DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS animation_errors (
        id serial PRIMARY KEY,
        error_type varchar(100) NOT NULL,
        message text NOT NULL,
        stack_trace text,
        component_name varchar(255),
        url varchar(500),
        user_agent varchar(500),
        retry_count integer DEFAULT 0,
        resolved boolean DEFAULT false,
        resolved_at timestamp(3),
        created_at timestamp(3) DEFAULT now()
      );
    `);

    console.log("✅ Comprehensive test database stabilization complete!");
  } catch (error) {
    console.error("❌ Error stabilizing database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
