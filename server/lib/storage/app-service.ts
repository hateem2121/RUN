/**
 * GOOGLE CLOUD STORAGE SERVICE
 * Replaces Object Storage for Cloud Run deployment
 *
 * Uses @google-cloud/storage SDK
 */

import { Storage } from "@google-cloud/storage";
import { logger, serializeError } from "../monitoring/logger.js";

class AppStorageService {
  private storage: Storage;
  private bucketName: string;

  // FORENSIC INVESTIGATION - Phase 3: GCS timeout and retry configuration
  private readonly DEFAULT_TIMEOUT_MS = 10000; // 10 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

  constructor() {
    this.storage = new Storage();
    this.bucketName = process.env.GCS_BUCKET_NAME || "";

    if (!this.bucketName) {
      logger.warn(
        "[Storage] GCS_BUCKET_NAME environment variable is not set. Storage operations will fail.",
      );
    } else {
      logger.info(`[Storage] Initialized Google Cloud Storage with bucket: ${this.bucketName}`);
    }
  }

  /**
   * FORENSIC INVESTIGATION - Phase 3: Wrap GCS operations with timeout and retry logic
   */
  private async withTimeoutAndRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    timeoutMs: number = this.DEFAULT_TIMEOUT_MS,
  ): Promise<T> {
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`GCS operation timeout after ${timeoutMs}ms`)),
            timeoutMs,
          );
        });

        // Race between operation and timeout
        const result = await Promise.race([operation(), timeoutPromise]);

        const duration = Date.now() - startTime;
        if (attempt > 0) {
          logger.info(
            `✅ GCS ${operationName} succeeded on attempt ${attempt + 1} (${duration}ms)`,
          );
        }

        return result;
      } catch (error: unknown) {
        const isLastAttempt = attempt === this.MAX_RETRIES;
        const duration = Date.now() - startTime;
        const err = error as Error & { code?: string | number };

        // Only retry on timeout or transient errors
        const isRetryable =
          err.message?.includes("timeout") ||
          err.code === "ECONNRESET" ||
          err.code === "ETIMEDOUT" ||
          err.code === 503;

        if (!isRetryable || isLastAttempt) {
          logger.error(
            `❌ GCS ${operationName} failed after ${attempt + 1} attempts (${duration}ms):`,
            {
              error: err.message,
              code: err.code,
            },
          );
          throw error;
        }

        const retryDelay = this.RETRY_DELAYS[attempt];
        logger.warn(
          `⚠️ GCS ${operationName} attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error(`GCS ${operationName} failed after ${this.MAX_RETRIES + 1} attempts`);
  }

  /**
   * Get metadata for an asset
   */
  async getAssetMetadata(
    key: string,
  ): Promise<{ size: number; contentType?: string | undefined; updated?: string | undefined }> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);
      const [metadata] = await file.getMetadata();
      return {
        size: metadata.size ? parseInt(String(metadata.size), 10) : 0,
        contentType: metadata.contentType,
        updated: metadata.updated,
      };
    } catch (error) {
      logger.error(`❌ Failed to get metadata for ${key}:`, serializeError(error));
      return { size: 0 };
    }
  }

  /**
   * Upload an asset to GCS
   */
  async uploadAsset(
    key: string,
    data: Buffer | Uint8Array | string,
    metadata?: { contentType?: string | undefined; isPublic?: boolean },
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      const options = {
        metadata: {
          ...(metadata?.contentType ? { contentType: metadata.contentType } : {}),
        },
        resumable: false,
      };

      await file.save(data as Buffer, options);
      logger.info(`✅ Uploaded asset to GCS: ${key}`);
      return `https://storage.googleapis.com/${this.bucketName}/${key}`;
    } catch (error) {
      logger.error(`❌ Upload failed for ${key}:`, serializeError(error));
      throw new Error(`Failed to upload asset: ${(error as Error).message}`);
    }
  }

  /**
   * Download an asset from GCS
   */
  async downloadAsset(key: string): Promise<Buffer> {
    return this.withTimeoutAndRetry(async () => {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);
      const [content] = await file.download();
      return content;
    }, `download:${key}`);
  }

  /**
   * Delete an asset from GCS
   */
  async deleteAsset(key: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      await file.delete();
      logger.info(`✅ Deleted asset from GCS: ${key}`);
      return true;
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 404) {
        return true;
      }
      logger.error(`❌ Delete failed for ${key}:`, serializeError(error));
      return false;
    }
  }

  /**
   * List assets in GCS
   */
  async listAssets(prefix?: string): Promise<string[]> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles(prefix ? { prefix } : undefined);

      const keys = files.map((file) => file.name);
      logger.info(`✅ Listed ${keys.length} assets with prefix: ${prefix || "none"}`);
      return keys;
    } catch (error) {
      logger.error(`❌ List failed for prefix ${prefix}:`, serializeError(error));
      throw new Error(`Failed to list assets: ${(error as Error).message}`);
    }
  }

  /**
   * List assets with size metadata
   */
  async listAssetsWithMetadata(
    prefix?: string,
  ): Promise<Array<{ name: string; size: number; updated?: string | undefined }>> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles(prefix ? { prefix } : undefined);

      return files.map((file) => ({
        name: file.name,
        size: file.metadata.size ? parseInt(String(file.metadata.size), 10) : 0,
        updated: file.metadata.updated,
      }));
    } catch (error) {
      logger.error(`❌ List with metadata failed for prefix ${prefix}:`, serializeError(error));
      return [];
    }
  }

  /**
   * Check if asset exists in GCS
   */
  async assetExists(key: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);
      const [exists] = await file.exists();
      return exists;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Batch upload multiple assets
   */
  async batchUpload(
    assets: Array<{
      key: string;
      data: Buffer | Uint8Array | string;
      metadata?: { contentType?: string | undefined; isPublic?: boolean };
    }>,
  ): Promise<string[]> {
    const uploadPromises = assets.map((asset) =>
      this.uploadAsset(asset.key, asset.data, asset.metadata),
    );

    try {
      const urls = await Promise.all(uploadPromises);
      logger.info(`✅ Batch uploaded ${assets.length} assets`);
      return urls;
    } catch (error) {
      logger.error(`❌ Batch upload failed:`, serializeError(error));
      throw new Error(`Failed to batch upload assets: ${(error as Error).message}`);
    }
  }

  /**
   * Get storage stats
   */
  async getStorageStats(): Promise<{
    totalAssets: number;
    publicAssets: number;
    privateAssets: number;
  }> {
    try {
      const allAssets = await this.listAssets();
      const publicAssets = allAssets.filter((k) => k.startsWith("public/"));
      const privateAssets = allAssets.filter((k) => k.startsWith("private/"));

      return {
        totalAssets: allAssets.length,
        publicAssets: publicAssets.length,
        privateAssets: privateAssets.length,
      };
    } catch (error) {
      logger.error(`❌ Stats retrieval failed:`, serializeError(error));
      throw new Error(`Failed to get storage stats: ${(error as Error).message}`);
    }
  }

  /**
   * Get the configured bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Generate a signed URL for direct CDN access
   */
  async generateSignedUrl(
    key: string,
    ttlSeconds: number = 300,
    method: "GET" | "PUT" | "DELETE" | "HEAD" = "GET",
  ): Promise<string> {
    return this.withTimeoutAndRetry(
      async () => {
        try {
          const bucket = this.storage.bucket(this.bucketName);
          const file = bucket.file(key);

          const [url] = await file.getSignedUrl({
            version: "v4",
            action: method === "GET" ? "read" : method === "PUT" ? "write" : "delete",
            expires: Date.now() + ttlSeconds * 1000,
          });

          return url;
        } catch (error) {
          const errorMessage = (error as Error).message || "";
          if (
            errorMessage.includes("Cannot sign data") ||
            errorMessage.includes("Could not load the default credentials") ||
            errorMessage.includes("Service account") ||
            !this.bucketName
          ) {
            if (process.env.NODE_ENV !== "production") {
              const fs = await import("node:fs/promises");
              const path = await import("node:path");
              const publicPath = path.join(process.cwd(), "public", key);

              try {
                await fs.access(publicPath);
                return `/${key}`;
              } catch (_fsError) {
                // Not in public/ either
              }
            }

            const fallbackUrl = `https://storage.googleapis.com/${this.bucketName || "run-dev-assets"}/${key}`;
            return fallbackUrl;
          }
          throw error;
        }
      },
      `signedUrl:${key}`,
      5000,
    );
  }

  /**
   * Get circuit breaker status (Mock implementation for GCS)
   */
  getCircuitStatus() {
    return {
      state: "CLOSED",
      failureCount: 0,
      successCount: 100,
      totalFailures: 0,
      totalSuccesses: 100,
      stateChanges: [],
      lastStateChange: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const appStorageService = new AppStorageService();
