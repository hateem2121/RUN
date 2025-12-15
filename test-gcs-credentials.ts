#!/usr/bin/env node
/**
 * Quick test script to verify GCS credentials are working
 */

import { config } from 'dotenv';
import { Storage } from '@google-cloud/storage';

// Load environment variables
config();

async function testGCSCredentials() {
    console.log('🔍 Testing GCS Credentials Setup...\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`  GCS_BUCKET_NAME: ${process.env.GCS_BUCKET_NAME || '❌ NOT SET'}`);
    console.log(`  GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || '❌ NOT SET'}\n`);

    try {
        // Initialize storage
        const storage = new Storage();
        const bucketName = process.env.GCS_BUCKET_NAME;

        if (!bucketName) {
            throw new Error('GCS_BUCKET_NAME is not set');
        }

        const bucket = storage.bucket(bucketName);

        // Test 1: Check bucket access
        console.log('✅ Test 1: Checking bucket access...');
        const [exists] = await bucket.exists();
        console.log(`  Bucket "${bucketName}" exists: ${exists ? '✅ YES' : '❌ NO'}\n`);

        if (!exists) {
            throw new Error(`Bucket "${bucketName}" does not exist or is not accessible`);
        }

        // Test 2: Try to generate a signed URL
        console.log('✅ Test 2: Testing signed URL generation...');
        const testFile = bucket.file('test/dummy-path.jpg');

        try {
            const [url] = await testFile.getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 3600 * 1000, // 1 hour
            });

            console.log(`  ✅ Signed URL generation SUCCESSFUL`);
            console.log(`  Sample URL (first 100 chars): ${url.substring(0, 100)}...\n`);
        } catch (signError) {
            console.error(`  ❌ Signed URL generation FAILED:`, signError.message);
            throw signError;
        }

        console.log('🎉 All tests passed! GCS credentials are properly configured.\n');

    } catch (error) {
        console.error('\n❌ GCS Credentials Test FAILED:');
        console.error(`  Error: ${error.message}\n`);
        process.exit(1);
    }
}

testGCSCredentials();
