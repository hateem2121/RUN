#!/usr/bin/env node

/**
 * Quick test script to verify GCS credentials are working
 */

import { Storage } from "@google-cloud/storage";
// @ts-nocheck
import { config } from "dotenv";

// Load environment variables
config();

async function testGCSCredentials() {
	try {
		// Initialize storage
		const storage = new Storage();
		const bucketName = process.env.GCS_BUCKET_NAME;

		if (!bucketName) {
			throw new Error("GCS_BUCKET_NAME is not set");
		}

		const bucket = storage.bucket(bucketName);
		const [exists] = await bucket.exists();

		if (!exists) {
			throw new Error(
				`Bucket "${bucketName}" does not exist or is not accessible`,
			);
		}
		const testFile = bucket.file("test/dummy-path.jpg");

		try {
			const [url] = await testFile.getSignedUrl({
				version: "v4",
				action: "read",
				expires: Date.now() + 3600 * 1000, // 1 hour
			});
		} catch (signError) {
			throw signError;
		}
	} catch (error) {
		process.exit(1);
	}
}

testGCSCredentials();
