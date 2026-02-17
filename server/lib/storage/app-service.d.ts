/**
 * GOOGLE CLOUD STORAGE SERVICE
 * Replaces Object Storage for Cloud Run deployment
 *
 * Uses @google-cloud/storage SDK
 */
export declare class AppStorageService {
  private storage;
  private bucketName;
  private readonly DEFAULT_TIMEOUT_MS;
  private readonly MAX_RETRIES;
  private readonly RETRY_DELAYS;
  constructor();
  /**
   * FORENSIC INVESTIGATION - Phase 3: Wrap GCS operations with timeout and retry logic
   */
  private withTimeoutAndRetry;
  /**
   * Upload an asset to GCS
   */
  uploadAsset(
    key: string,
    data: Buffer | Uint8Array | string,
    metadata?: {
      contentType?: string | undefined;
      isPublic?: boolean;
    },
  ): Promise<string>;
  /**
   * Download an asset from GCS
   */
  downloadAsset(key: string): Promise<Buffer>;
  /**
   * Delete an asset from GCS
   */
  deleteAsset(key: string): Promise<boolean>;
  /**
   * List assets in GCS
   */
  listAssets(prefix?: string): Promise<string[]>;
  /**
   * Check if asset exists in GCS
   */
  assetExists(key: string): Promise<boolean>;
  /**
   * Batch upload multiple assets
   */
  batchUpload(
    assets: Array<{
      key: string;
      data: Buffer | Uint8Array | string;
      metadata?: {
        contentType?: string | undefined;
        isPublic?: boolean;
      };
    }>,
  ): Promise<string[]>;
  /**
   * Get storage stats
   */
  getStorageStats(): Promise<{
    totalAssets: number;
    publicAssets: number;
    privateAssets: number;
  }>;
  /**
   * Get the configured bucket name
   */
  getBucketName(): string;
  /**
   * Generate a signed URL for direct CDN access
   */
  generateSignedUrl(
    key: string,
    ttlSeconds?: number,
    method?: "GET" | "PUT" | "DELETE" | "HEAD",
  ): Promise<string>;
  /**
   * Get circuit breaker status (Mock implementation for GCS)
   * GCS SDK handles retries internally, so we don't need a complex circuit breaker here anymore.
   * Returning a healthy status to satisfy AlertManager.
   */
  getCircuitStatus(): {
    state: string;
    failureCount: number;
    successCount: number;
    totalFailures: number;
    totalSuccesses: number;
    stateChanges: never[];
    lastStateChange: string;
  };
}
export declare const appStorageService: AppStorageService;
//# sourceMappingURL=app-service.d.ts.map
