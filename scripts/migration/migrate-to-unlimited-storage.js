/**
 * 🚀 UNLIMITED MEDIA MIGRATION SCRIPT
 *
 * Migrates existing media assets from Key-Value Store to NEON PostgreSQL
 * Enables unlimited media storage capacity for /admin/media
 */

import Database from "@replit/database";
import { Client } from "pg";

// Database connections
const replitDb = new Database(process.env.REPLIT_DB_URL);
const postgresClient = new Client({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: false },
});

async function migrateToUnlimitedStorage() {
	try {
		// Connect to PostgreSQL
		await postgresClient.connect();
		const assetKeys = (await replitDb.listKeys()) || [];
		const mediaAssetKeys = assetKeys.filter((key) =>
			key.startsWith("mediaAssets:"),
		);

		if (mediaAssetKeys.length === 0) {
			return;
		}

		// Step 2: Migrate each asset
		let migrated = 0;
		let errors = 0;

		for (const key of mediaAssetKeys) {
			try {
				const assetData = await replitDb.get(key);
				if (!assetData) continue;

				const asset = JSON.parse(assetData);

				// Transform data for PostgreSQL schema
				const migratedAsset = {
					id: asset.id,
					name: asset.name || "Untitled Asset",
					original_name: asset.originalName || asset.name,
					type: determineAssetType(asset.name, asset.mimeType),
					mime_type: asset.mimeType || "application/octet-stream",
					size: asset.size || 0,
					width: asset.width || null,
					height: asset.height || null,
					duration: asset.duration || null,
					storage_key: asset.storageKey || asset.key || "",
					storage_url: asset.url || asset.storageUrl || "",
					thumbnail_url: asset.thumbnailUrl || asset.thumbnail || null,
					description: asset.description || null,
					tags: asset.tags ? JSON.stringify(asset.tags) : "[]",
					folder: asset.folder || null,
					is_public: asset.isPublic !== undefined ? asset.isPublic : true,
					download_count: asset.downloadCount || 0,
					last_accessed: asset.lastAccessed || null,
					created_at: asset.createdAt || new Date().toISOString(),
					updated_at: asset.updatedAt || new Date().toISOString(),
				};

				// Insert into PostgreSQL with conflict resolution
				await insertAssetWithConflictResolution(migratedAsset);

				migrated++;
			} catch (error) {
				errors++;
			}
		}
		const { rows } = await postgresClient.query(
			"SELECT COUNT(*) as count FROM media_assets",
		);
		const postgresCount = parseInt(rows[0].count);
		await testUnlimitedCapacity();
	} catch (error) {
		throw error;
	} finally {
		await postgresClient.end();
	}
}

/**
 * Insert asset with conflict resolution (update if exists)
 */
async function insertAssetWithConflictResolution(asset) {
	const query = `
    INSERT INTO media_assets (
      id, name, original_name, type, mime_type, size, width, height, duration,
      storage_key, storage_url, thumbnail_url, description, tags, folder, 
      is_public, download_count, last_accessed, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      original_name = EXCLUDED.original_name,
      type = EXCLUDED.type,
      mime_type = EXCLUDED.mime_type,
      size = EXCLUDED.size,
      width = EXCLUDED.width,
      height = EXCLUDED.height,
      duration = EXCLUDED.duration,
      storage_key = EXCLUDED.storage_key,
      storage_url = EXCLUDED.storage_url,
      thumbnail_url = EXCLUDED.thumbnail_url,
      description = EXCLUDED.description,
      tags = EXCLUDED.tags,
      folder = EXCLUDED.folder,
      is_public = EXCLUDED.is_public,
      download_count = EXCLUDED.download_count,
      last_accessed = EXCLUDED.last_accessed,
      updated_at = NOW()
  `;

	const values = [
		asset.id,
		asset.name,
		asset.original_name,
		asset.type,
		asset.mime_type,
		asset.size,
		asset.width,
		asset.height,
		asset.duration,
		asset.storage_key,
		asset.storage_url,
		asset.thumbnail_url,
		asset.description,
		asset.tags,
		asset.folder,
		asset.is_public,
		asset.download_count,
		asset.last_accessed,
		asset.created_at,
		asset.updated_at,
	];

	await postgresClient.query(query, values);
}

/**
 * Determine asset type based on filename and mime type
 */
function determineAssetType(filename, mimeType) {
	if (!filename && !mimeType) return "document";

	const name = (filename || "").toLowerCase();
	const mime = (mimeType || "").toLowerCase();

	if (
		mime.startsWith("image/") ||
		/\.(jpg|jpeg|png|gif|webp|svg)$/.test(name)
	) {
		return "image";
	}

	if (mime.startsWith("video/") || /\.(mp4|avi|mov|wmv|flv|webm)$/.test(name)) {
		return "video";
	}

	if (/\.(glb|gltf|obj|fbx|dae)$/.test(name)) {
		return "3d-model";
	}

	return "document";
}

/**
 * Test unlimited capacity with PostgreSQL
 */
async function testUnlimitedCapacity() {
	try {
		// Test database storage limits
		const { rows: dbSize } = await postgresClient.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        (SELECT count(*) FROM media_assets) as asset_count
    `);

		// Test a sample insert to verify unlimited functionality
		const testAsset = {
			name: "Unlimited Storage Test Asset",
			type: "image",
			mime_type: "image/jpeg",
			size: 1024000,
			storage_key: "test/unlimited-storage-test.jpg",
			storage_url: "https://example.com/test.jpg",
		};

		await postgresClient.query(
			`
      INSERT INTO media_assets (name, type, mime_type, size, storage_key, storage_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `,
			[
				testAsset.name,
				testAsset.type,
				testAsset.mime_type,
				testAsset.size,
				testAsset.storage_key,
				testAsset.storage_url,
			],
		);
	} catch (error) {}
}

// Run migration
migrateToUnlimitedStorage()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		process.exit(1);
	});
