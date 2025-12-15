
import { Storage } from "@google-cloud/storage";
import path from "path";
import fs from "fs";

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

        console.log("Generating signed URL for:", filePath);

        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        });

        console.log("\nSigned URL:", url);

        console.log("\nTesting fetch with Origin header...");
        const response = await fetch(url, {
            headers: {
                "Origin": "http://localhost:5001"
            }
        });

        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);

        if (!response.ok) {
            const text = await response.text();
            console.log("Error Body:", text);
        } else {
            console.log("Success! Headers:", response.headers);
        }

        console.log("\nTesting HEAD request...");
        const headResponse = await fetch(url, {
            method: "HEAD",
            headers: {
                "Origin": "http://localhost:5001"
            }
        });
        console.log("HEAD Status:", headResponse.status);

        console.log("\nTesting Range request (bytes=0-100)...");
        const rangeResponse = await fetch(url, {
            headers: {
                "Origin": "http://localhost:5001",
                "Range": "bytes=0-100"
            }
        });
        console.log("Range Status:", rangeResponse.status);
        if (!rangeResponse.ok) {
            const text = await rangeResponse.text();
            console.log("Range Error Body:", text);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

testSignedUrl();
