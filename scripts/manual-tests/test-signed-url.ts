// @ts-nocheck
import "dotenv/config";
import { Storage } from "@google-cloud/storage";
import path from "path";

// Initialize storage
const keyFilePath = path.resolve(process.cwd(), "gcs-service-account-key.json");
const storage = new Storage({
  keyFilename: keyFilePath,
  projectId: "run-apparel-prod",
});
const bucketName = "run-media";

async function testSignedUrl() {
  try {
    const bucket = storage.bucket(bucketName);
    // Use the known file path from previous logs
    const filePath = "public/media/models/2025/11/1763704643449-leather-jacket-colorway-1.gltf";
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    const response = await fetch(url, {
      headers: {
        Origin: "http://localhost:5001",
      },
    });

    if (!response.ok) {
      const text = await response.text();
    } else {
    }
    const headResponse = await fetch(url, {
      method: "HEAD",
      headers: {
        Origin: "http://localhost:5001",
      },
    });
    const rangeResponse = await fetch(url, {
      headers: {
        Origin: "http://localhost:5001",
        Range: "bytes=0-100",
      },
    });
    if (!rangeResponse.ok) {
      const text = await rangeResponse.text();
    }
  } catch (error) {}
}

testSignedUrl();
