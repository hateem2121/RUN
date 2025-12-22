/**
 * 🚀 App Storage Service - Replit Native Cloud Storage
 *
 * Handles media assets with CDN-ready architecture:
 * - Images, videos, models, documents
 * - Public partition (public/*): CDN-cacheable assets
 * - Private partition (private/*): Access-controlled assets
 *
 * ============================================================================
 * CDN INTEGRATION ROADMAP (File Structure Ready, Functionality Pending)
 * ============================================================================
 *
 * CURRENT STATE:
 * - Storage partitioned: public/* (CDN-ready) vs private/* (secure)
 * - All uploads use organized paths: {partition}/media/{type}/{yyyy}/{mm}/{timestamp}-{filename}
 * - Temp uploads isolated: private/temp/uploads/* (auto-cleanup after 24h)
 *
 * FUTURE CDN INTEGRATION (when ready to add):
 *
 * 1. CDN URL Generation:
 *    - Add getCdnUrl(key: string): string method
 *    - For public/* assets: https://cdn.example.com/{key}
 *    - For private/* assets: Generate signed URLs with expiry
 *
 * 2. Cache Headers (in downloadAsset method):
 *    - Public assets: Cache-Control: public, max-age=31536000, immutable
 *    - Private assets: Cache-Control: private, max-age=3600
 *    - Thumbnails: Cache-Control: public, max-age=31536000
 *
 * 3. Signed URL Generation (for private assets):
 *    - generateSignedUrl(key: string, expirySeconds: number): string
 *    - Use cloud provider's native signing (GCS, S3, etc.)
 *    - Add expiry validation and refresh logic
 *
 * 4. CDN Invalidation:
 *    - Add invalidateCdn(key: string | string[]): Promise<void>
 *    - Purge cache on asset update/delete
 *    - Batch invalidation for efficiency
 *
 * 5. Thumbnail Cache Warm-up (if analytics show need):
 *    - On upload: Generate thumbnail → store at public/media/thumbnails/{yyyy}/{mm}/{assetId}.jpg
 *    - Enable cdn.thumbnails.cacheEnabled in environment config
 *    - Update thumbnail URLs to point to cached paths
 *
 * IMPLEMENTATION CHECKLIST (when adding CDN):
 * □ Configure CDN provider (CloudFlare, Fastly, GCS CDN, etc.)
 * □ Point CDN to Replit Object Storage bucket
 * □ Configure CDN rules: Cache public/*, exclude private/*
 * □ Add CDN domain to environment: OBJECT_STORAGE_CDN_DOMAIN
 * □ Implement getCdnUrl() method above
 * □ Update MediaUrlResolver to use CDN URLs
 * □ Add signed URL generation for private assets
 * □ Configure cache headers in response headers
 * □ Test cache hit rates and monitor CDN metrics
 *
 * ============================================================================
 */
declare enum CircuitState {
    CLOSED = "CLOSED",// Normal operation
    OPEN = "OPEN",// Blocking requests
    HALF_OPEN = "HALF_OPEN"
}
export declare class AppStorageService {
    private client;
    private bucketName;
    private readonly MAX_RETRIES;
    private readonly INITIAL_RETRY_DELAY;
    private circuitState;
    private failureCount;
    private successCount;
    private lastFailureTime;
    private readonly FAILURE_THRESHOLD;
    private readonly SUCCESS_THRESHOLD;
    private readonly TIMEOUT_DURATION;
    private readonly HALF_OPEN_MAX_REQUESTS;
    private halfOpenRequestCount;
    private metrics;
    constructor();
    /**
     * Retry utility with exponential backoff and circuit breaker
     * Retries transient errors (network issues, timeouts, 503s)
     */
    private retryWithBackoff;
    /**
     * Check if error is a client error (4xx) - should NOT trigger circuit breaker
     */
    private isClientError;
    /**
     * Check if error is transient and should be retried
     */
    private isTransientError;
    /**
     * Sleep utility for delays
     */
    private sleep;
    /**
     * Check if circuit breaker allows request
     */
    private canProceedWithRequest;
    /**
     * Record successful operation
     */
    private recordSuccess;
    /**
     * Record failed operation
     */
    private recordFailure;
    /**
     * Track retry attempts for metrics
     */
    private trackRetries;
    /**
     * Track operation timing and metrics
     */
    private trackOperation;
    /**
     * Get circuit breaker status with telemetry
     */
    getCircuitStatus(): {
        state: CircuitState;
        failureCount: number;
        successCount: number;
        stateChanges: number;
        lastStateChange: Date;
        totalFailures: number;
        totalSuccesses: number;
    };
    /**
     * Get performance metrics
     */
    getMetrics(): {
        uploads: {
            avgDuration: number;
            count: number;
            totalDuration: number;
            retries: number;
            failures: number;
        };
        downloads: {
            avgDuration: number;
            count: number;
            totalDuration: number;
            retries: number;
            failures: number;
        };
        deletes: {
            avgDuration: number;
            count: number;
            totalDuration: number;
            retries: number;
            failures: number;
        };
        circuitBreaker: {
            currentState: CircuitState;
            stateChanges: number;
            lastStateChange: Date | null;
            totalFailures: number;
            totalSuccesses: number;
        };
    };
    /**
     * Validate storage path to prevent double prefix bugs and path traversal
     * @throws Error if path is invalid
     */
    private validateStoragePath;
    /**
     * Upload media asset to App Storage
     */
    uploadAsset(key: string, data: Buffer | Uint8Array | string, metadata?: {
        contentType?: string;
        isPublic?: boolean;
    }): Promise<string>;
    private isUint8Array;
    /**
     * Download media asset from App Storage with streaming support for large files
     * Uses streaming for files >50MB to reduce memory usage
     */
    downloadAsset(key: string, fileSize?: number): Promise<Buffer>;
    /**
     * Download large asset using streaming to reduce memory usage
     * Converts stream to Buffer for compatibility with existing code
     */
    private downloadAssetStreaming;
    /**
     * Get bucket identifier (note: actual bucket managed by Replit internally)
     */
    getBucketName(): string;
    /**
     * Check if file exists before attempting operations
     */
    fileExists(key: string): Promise<boolean>;
    /**
     * Delete asset from App Storage
     */
    deleteAsset(key: string): Promise<void>;
    /**
     * List assets in a directory/prefix
     */
    listAssets(prefix?: string): Promise<string[]>;
    /**
     * Check if asset exists
     */
    assetExists(key: string): Promise<boolean>;
    /**
     * Batch upload multiple assets
     */
    batchUpload(assets: Array<{
        key: string;
        data: Buffer | Uint8Array | string;
        metadata?: {
            contentType?: string;
            isPublic?: boolean;
        };
    }>): Promise<string[]>;
    /**
     * Get storage stats
     */
    getStorageStats(): Promise<{
        totalAssets: number;
        publicAssets: number;
        privateAssets: number;
    }>;
}
export declare const appStorageService: AppStorageService;
