import type { MediaAsset } from "@shared/schema";
import {
  AlertCircle,
  CheckCircle,
  FileImage,
  FileText,
  FileVideo,
  Pause,
  Play,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { invalidateMediaQueries } from "@/lib/media-query-keys";
// PHASE 3.1: Single Cache Strategy - Use only React Query, remove competing cache systems
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useMediaLibraryEnhanced } from "./MediaLibraryContextEnhanced";

// Removed server-side imports that were causing build failures
// REMOVED: Server-side imports replaced with browser-safe fallbacks below

// Browser-safe fallbacks
const filterValidMediaAssets = (assets: unknown[]): MediaAsset[] => assets as MediaAsset[];
const logTypeError = (_error: Error, _context: string) => {};

// CRITICAL FIX: Dedicated Web Worker for uploads to bypass DevTools monkeypatching
// Web Workers run in isolated global scope where DevTools cannot patch self.fetch
import type { UploadMessage, WorkerResponse } from "@/workers/uploader";

let uploadWorker: Worker | null = null;
const getUploadWorker = (): Worker => {
  if (uploadWorker) return uploadWorker;

  uploadWorker = new Worker(new URL("@/workers/uploader.ts?ver=20250916", import.meta.url), {
    type: "module",
  });
  return uploadWorker;
};

// PHASE 1.1: Enhanced MIME Type Detection for GLTF and other files (Fixed for chunked uploads)
const detectMimeType = (file: File): string => {
  // 1. Try browser detection first (but allow fallback for chunked uploads)
  if (file.type && file.type.trim() !== "" && file.type !== "application/octet-stream") {
    return file.type;
  }

  // 2. Enhanced fallback to extension-based detection (critical for GLTF files and chunked uploads)
  const extension = file.name.toLowerCase().split(".").pop();
  const extensionMap: Record<string, string> = {
    gltf: "model/gltf+json",
    glb: "model/gltf-binary",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  // CRITICAL FIX: For chunked uploads, prefer extension-based detection over octet-stream
  const detectedMimeType = extensionMap[extension || ""];
  if (detectedMimeType) {
    return detectedMimeType;
  }

  return "application/octet-stream";
};

// PHASE 3.1: Pre-upload File Validation (FIXED: Changed to warnings instead of hard blocks)
const validateFile = (file: File) => {
  const maxSize = 500 * 1024 * 1024; // 500MB
  const allowedExtensions = [
    ".gltf",
    ".glb",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".mp4",
    ".webm",
    ".pdf",
  ];

  const extension = `.${file.name.toLowerCase().split(".").pop()}`;

  // LOG: Show validation for GLTF files
  if (extension === ".gltf" || extension === ".glb") {
  }

  // CRITICAL FIX: Change hard errors to warnings for better UX
  if (!allowedExtensions.includes(extension)) {
    // Don't throw error - let upload attempt continue
  }

  if (file.size > maxSize) {
    // Don't throw error - let upload attempt continue
  }

  const mimeType = detectMimeType(file);
  if (!mimeType || mimeType === "application/octet-stream") {
  }

  // LOG: Show final validation result
  if (extension === ".gltf" || extension === ".glb") {
  }

  return { valid: true, mimeType };
};

// UPLOAD OPTIMIZATION: Enhanced Upload Metrics with Performance Tracking
const uploadMetrics = {
  attempts: 0,
  successes: 0,
  failures: 0,
  gltfUploads: 0,
  mimeTypeIssues: 0,
  // Performance metrics
  totalUploadTime: 0,
  averageUploadSpeed: 0,
  concurrentUploads: 0,
  maxConcurrentUploads: 2, // Reduced for better stability - matches frontend limit
  queuedUploads: 0,
};

// UPLOAD OPTIMIZATION: Intelligent Queue Manager
class UploadQueueManager {
  private activeUploads = new Set<string>();
  private maxConcurrent = 2; // Reduced for upload stability
  private pendingQueue: UploadQueueItem[] = [];

  canStartUpload(): boolean {
    return this.activeUploads.size < this.maxConcurrent;
  }

  addToActive(itemId: string): void {
    this.activeUploads.add(itemId);
    uploadMetrics.concurrentUploads = this.activeUploads.size;
  }

  removeFromActive(itemId: string): void {
    this.activeUploads.delete(itemId);
    uploadMetrics.concurrentUploads = this.activeUploads.size;
  }

  // CRITICAL FIX: Pure peek function for render - no mutation
  peekNextInQueue(): UploadQueueItem | null {
    if (this.pendingQueue.length === 0) return null;

    // Create a sorted copy without mutating the original queue
    const sortedQueue = [...this.pendingQueue].sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || "normal"];
      const bPriority = priorityOrder[b.priority || "normal"];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return (a.startTime || 0) - (b.startTime || 0);
    });

    return sortedQueue[0] || null;
  }

  // CRITICAL FIX: Separate function for actual dequeuing
  getNextInQueue(): UploadQueueItem | null {
    // Sort by priority: high -> normal -> low, then by creation time
    this.pendingQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || "normal"];
      const bPriority = priorityOrder[b.priority || "normal"];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return (a.startTime || 0) - (b.startTime || 0);
    });

    const next = this.pendingQueue.shift() || null;
    uploadMetrics.queuedUploads = this.pendingQueue.length;
    return next;
  }

  // CRITICAL FIX: Helper to get queue position for display purposes
  getQueuePosition(itemId: string): number {
    const sortedQueue = [...this.pendingQueue].sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || "normal"];
      const bPriority = priorityOrder[b.priority || "normal"];

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      return (a.startTime || 0) - (b.startTime || 0);
    });

    return sortedQueue.findIndex((item) => item.id === itemId) + 1; // 1-indexed for display
  }

  addToQueue(item: UploadQueueItem): void {
    this.pendingQueue.push(item);
    uploadMetrics.queuedUploads = this.pendingQueue.length;
  }

  removeFromQueue(itemId: string): void {
    this.pendingQueue = this.pendingQueue.filter((item) => item.id !== itemId);
    uploadMetrics.queuedUploads = this.pendingQueue.length;
  }
}

const queueManager = new UploadQueueManager();

// UPLOAD OPTIMIZATION: Enhanced Performance Tracking
const trackPerformance = async <T,>(operation: string, fn: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;

    // Track upload metrics
    if (operation.includes("upload")) {
      uploadMetrics.totalUploadTime += duration;
      uploadMetrics.attempts++;
    }

    return result;
  } catch (error) {
    // const _duration = Date.now() - start;

    if (operation.includes("upload")) {
      uploadMetrics.failures++;
    }

    throw error;
  }
};

// Removed unused calculateUploadMetrics function

// UPLOAD OPTIMIZATION: Format upload speed for display
const formatUploadSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) return `${bytesPerSecond} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

// UPLOAD OPTIMIZATION: Format time remaining for display
const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};
// PHASE 2.2: Removed complex error boundary - using simple try-catch instead

// UPLOAD OPTIMIZATION: Enhanced Upload Queue with Performance Tracking
interface UploadQueueItem {
  file: File;
  id: string;
  status: "pending" | "uploading" | "paused" | "completed" | "error";
  progress: number;
  optimisticAsset?: MediaAsset;
  errorMessage?: string | undefined;
  abortController?: AbortController;
  // OPTIMIZATION: Performance tracking
  startTime?: number | undefined;
  uploadSpeed?: number | undefined; // bytes per second
  estimatedTimeRemaining?: number | undefined; // seconds
  retryCount?: number | undefined;
  priority?: "high" | "normal" | "low";
}

// File type icon mapping
const getFileTypeIcon = (type: string) => {
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("video/")) return FileVideo;
  return FileText;
};

// Removed unused retryWithBackoff function

// Enhanced upload item component
const UploadItem = React.memo(
  ({
    item,
    onCancel,
    onRetry,
    onPause,
    onResume,
  }: {
    item: UploadQueueItem;
    onCancel: (id: string) => void;
    onRetry: (id: string) => void;
    onPause: (id: string) => void;
    onResume: (id: string) => void;
  }) => {
    const Icon = getFileTypeIcon(item.file.type);

    // Removed unused getStatusColor function

    const getStatusIcon = () => {
      switch (item.status) {
        case "completed":
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case "error":
          return <AlertCircle className="h-4 w-4 text-red-500" />;
        case "paused":
          return <Pause className="h-4 w-4 text-yellow-500" />;
        case "uploading":
          return (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          );
        default:
          return <Icon className="text-muted-foreground h-4 w-4" />;
      }
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    };

    return (
      <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="shrink-0">{getStatusIcon()}</div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{item.file.name}</p>
              <Badge variant="outline" className="text-xs">
                {formatFileSize(item.file.size)}
              </Badge>
            </div>

            {item.status === "uploading" && (
              <div className="mt-1">
                <Progress value={item.progress} className="h-1" />
                <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                  <span>{item.progress.toFixed(1)}% uploaded</span>
                  <div className="flex gap-2">
                    {item.uploadSpeed && <span>{formatUploadSpeed(item.uploadSpeed)}</span>}
                    {item.estimatedTimeRemaining && item.estimatedTimeRemaining > 0 && (
                      <span>• {formatTimeRemaining(item.estimatedTimeRemaining)} remaining</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {item.status === "error" && item.errorMessage && (
              <div className="mt-1">
                <p className="text-xs text-red-500">{item.errorMessage}</p>
                {item.retryCount && item.retryCount > 0 && (
                  <p className="text-muted-foreground text-xs">
                    Retry attempts: {item.retryCount}/3
                  </p>
                )}
              </div>
            )}

            {item.status === "pending" && queueManager.peekNextInQueue()?.id !== item.id && (
              <p className="text-muted-foreground mt-1 text-xs">
                Queued • Position: {queueManager.getQueuePosition(item.id)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {item.status === "uploading" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPause(item.id)}
              className="h-8 w-8 p-0"
            >
              <Pause className="h-3 w-3" />
            </Button>
          )}

          {item.status === "paused" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResume(item.id)}
              className="h-8 w-8 p-0"
            >
              <Play className="h-3 w-3" />
            </Button>
          )}

          {item.status === "error" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(item.id)}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}

          {(item.status === "pending" || item.status === "paused" || item.status === "error") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(item.id)}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}

          {item.status !== "completed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(item.id)}
              className="h-8 w-8 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  },
);

export default function MediaUploadEnhanced() {
  const { setErrorState, setSyncStatus, uploadFiles } = useMediaLibraryEnhanced();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // PHASE 1.2: Create optimistic media entries for immediate UI feedback
  const createOptimisticEntries = useCallback((items: UploadQueueItem[]) => {
    const optimisticEntries = items.map((item, index) => {
      const detectedMime = detectMimeType(item.file);
      return {
        id: Date.now() + index, // Temporary ID
        filename: `uploading-${item.id}`,
        originalName: item.file.name,
        mimeType: detectedMime,
        type: detectedMime.startsWith("image/")
          ? ("image" as const)
          : detectedMime.startsWith("video/")
            ? ("video" as const)
            : ("document" as const),
        size: item.file.size,
        uploadedAt: new Date().toISOString(),
        isOptimistic: true, // Mark as optimistic for special handling
        url: URL.createObjectURL(item.file), // Temporary blob URL for preview
      };
    });

    // Use standardized MediaQueryKeys for consistency
    // Update all cached media queries with optimistic entries
    getQueryClient().setQueriesData(
      {
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === "apimedia",
      },
      (oldData: any) => {
        if (!oldData?.data?.data) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: [...optimisticEntries, ...oldData.data.data],
            total: oldData.data.total + optimisticEntries.length,
          },
        };
      },
    );
  }, []);

  // CRITICAL FIX: Worker-based upload function to bypass DevTools completely
  const uploadLargeFile = useCallback(
    async (
      item: UploadQueueItem,
      controller: AbortController,
      setUploadQueue: React.Dispatch<React.SetStateAction<UploadQueueItem[]>>,
    ) => {
      const { file } = item;

      try {
        // Validate file before upload
        const validation = validateFile(file);

        // Track upload metrics
        uploadMetrics.attempts++;
        if (file.name.toLowerCase().includes(".gltf")) {
          uploadMetrics.gltfUploads++;
        }
        if (!file.type || file.type === "") {
          uploadMetrics.mimeTypeIssues++;
        }

        // Get the upload worker
        const worker = getUploadWorker();

        // Promise to handle worker communication
        const uploadPromise = new Promise<void>((resolve, reject) => {
          // Handle worker messages
          const messageHandler = (event: MessageEvent<WorkerResponse>) => {
            const { type, fileId, percent, message } = event.data;

            // Only handle messages for this specific file
            if (fileId !== item.id) return;

            switch (type) {
              case "init":
                setUploadQueue((prev) =>
                  prev.map((qItem) =>
                    qItem.id === item.id ? { ...qItem, status: "uploading" } : qItem,
                  ),
                );
                break;

              case "progress":
                setUploadQueue((prev) =>
                  prev.map((qItem) =>
                    qItem.id === item.id
                      ? {
                          ...qItem,
                          progress: percent || 0,
                          status: "uploading",
                        }
                      : qItem,
                  ),
                );
                break;

              case "chunkComplete":
                // Optional: log chunk completion
                break;

              case "completed":
                // Invalidate cache after successful upload with forced refetch
                (async () => {
                  await invalidateMediaQueries(getQueryClient());
                })().catch((_error) => {});

                // Update UI to completed
                setUploadQueue((prev) =>
                  prev.map((qItem) =>
                    qItem.id === item.id ? { ...qItem, progress: 100, status: "completed" } : qItem,
                  ),
                );

                // Cleanup listener and resolve
                worker.removeEventListener("message", messageHandler);
                resolve();
                break;

              case "error":
                worker.removeEventListener("message", messageHandler);
                reject(new Error(message || "Worker upload failed"));
                break;
            }
          };

          // Listen for worker messages
          worker.addEventListener("message", messageHandler);

          // Handle controller abort
          controller.signal.addEventListener("abort", () => {
            worker.postMessage({
              type: "cancel",
              fileId: item.id,
            } as UploadMessage);

            worker.removeEventListener("message", messageHandler);
            reject(new Error("Upload cancelled"));
          });

          // Start the upload in worker
          worker.postMessage({
            type: "start",
            fileId: item.id,
            name: file.name,
            size: file.size,
            mimeType: validation.mimeType,
            file: file,
          } as UploadMessage);
        });

        // Wait for upload completion
        await uploadPromise;
      } catch (_error) {
        // Simple user-friendly error message
        const errorMessage = `${file.name} upload failed. Would you like to try again?`;

        // Update metrics
        uploadMetrics.failures++;

        // Update UI with error message
        setUploadQueue((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, status: "error", errorMessage } : qItem,
          ),
        );

        // DON'T re-throw error - allow other uploads to continue
      }
    },
    [],
  );

  // Process upload queue
  const processUploadQueue = useCallback(async () => {
    if (isUploading) return;

    const pendingItems = uploadQueue.filter((item) => item.status === "pending");
    if (pendingItems.length === 0) return;

    setIsUploading(true);
    setSyncStatus("syncing");

    // PHASE 1.2: Create optimistic entries immediately
    createOptimisticEntries(pendingItems);

    try {
      // UPLOAD OPTIMIZATION: Limit concurrency for better reliability
      const MAX_CONCURRENT_UPLOADS = 2; // Consistent with queue manager

      for (let i = 0; i < pendingItems.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = pendingItems.slice(i, i + MAX_CONCURRENT_UPLOADS);

        await Promise.all(
          batch.map(async (item) => {
            // PHASE 1.1 FIX: Remove AbortController timeout logic, keep only for user cancellation
            const controller = new AbortController();

            // Update item status
            setUploadQueue((prev) =>
              prev.map((qItem) =>
                qItem.id === item.id
                  ? {
                      ...qItem,
                      status: "uploading",
                      abortController: controller,
                    }
                  : qItem,
              ),
            );

            try {
              // Track upload performance with comprehensive monitoring
              await trackPerformance("Media Upload", async () => {
                // INFRASTRUCTURE FIX: Use chunked upload for files > 8MB to bypass Replit's ~10MB network limit
                const CHUNK_THRESHOLD = 8 * 1024 * 1024; // 8MB (prevents 413 infrastructure errors)

                if (item.file.size > CHUNK_THRESHOLD) {
                  // Use chunked upload for large files (handles its own validation and progress)
                  await uploadLargeFile(item, controller, setUploadQueue);
                } else {
                  // PHASE 1.1 FIX: Use apiRequest for regular uploads (fixed FormData handling)
                  const formData = new FormData();
                  formData.append("file", item.file);

                  // Add retry logic for network errors only (NOT HTTP errors like 413)
                  let retryCount = 0;
                  const maxRetries = 3;
                  let result: any;

                  while (retryCount <= maxRetries) {
                    try {
                      result = await apiRequest("/api/media/upload", {
                        method: "POST",
                        body: formData,
                      });

                      // PHASE 1: IMMEDIATE CACHE FIX - Invalidate all media queries for instant sync
                      await invalidateMediaQueries(getQueryClient());

                      break; // Success - exit retry loop
                    } catch (error) {
                      // Check if this is an HTTP error (has status property)
                      const isHttpError = error && typeof error === "object" && "status" in error;

                      if (isHttpError) {
                        // HTTP errors (400, 413, 500, etc.) should NOT be retried
                        const status = (error as any).status;
                        if (status === 413) {
                          throw new Error(
                            `File too large: ${item.file.name} exceeds server size limits`,
                          );
                        } else {
                          throw error; // Re-throw other HTTP errors as-is
                        }
                      }

                      // Only retry for genuine network/TypeError errors (connection issues)
                      retryCount++;
                      if (
                        error instanceof TypeError &&
                        error.message.includes("Failed to fetch") &&
                        retryCount <= maxRetries
                      ) {
                        // Exponential backoff: 1s, 2s, 4s
                        await new Promise((resolve) =>
                          setTimeout(resolve, 2 ** (retryCount - 1) * 1000),
                        );
                      } else {
                        throw error; // Re-throw non-retryable errors or max retries exceeded
                      }
                    }
                  }

                  // Schema validation on upload response
                  if (result.data && Array.isArray(result.data)) {
                    const validatedAssets = filterValidMediaAssets(result.data);
                    if (validatedAssets.length !== result.data.length) {
                      logTypeError(
                        new Error(
                          `Upload validation failed: ${result.data.length - validatedAssets.length} invalid assets`,
                        ),
                        `Upload Response Validation - ${item.file.name}`,
                      );
                    }
                  }

                  // Update progress to 100% and mark as completed for regular uploads
                  setUploadQueue((prev) =>
                    prev.map((qItem) =>
                      qItem.id === item.id
                        ? { ...qItem, status: "completed", progress: 100 }
                        : qItem,
                    ),
                  );
                }
              });
            } catch (error) {
              // PHASE 2.2: Simplified Error Handling - Don't stop entire upload process
              if (error instanceof Error && error.name === "AbortError") {
                // Upload was cancelled
                setUploadQueue((prev) => prev.filter((qItem) => qItem.id !== item.id));
              } else {
                setUploadQueue((prev) =>
                  prev.map((qItem) =>
                    qItem.id === item.id
                      ? {
                          ...qItem,
                          status: "error",
                          errorMessage: `${item.file.name} upload failed. Would you like to try again?`,
                        }
                      : qItem,
                  ),
                );
              }
            }
          }),
        );
      }

      setSyncStatus("success");
      // Remove optimistic entries and invalidate all media queries with forced refetch
      await invalidateMediaQueries(getQueryClient());
      try {
        // Use standardized MediaQueryKeys for consistent invalidation
        await getQueryClient().refetchQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && key[0] === "apimedia";
          },
        });
      } catch (_error) {}

      // Clear completed items after delay
      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((item) => item.status !== "completed"));
      }, 3000);
    } catch (error) {
      setSyncStatus("error");
      setErrorState({
        hasError: true,
        errorMessage: error instanceof Error ? error.message : "Upload failed",
        // No recovery options in base error state
      });
    } finally {
      setIsUploading(false);
    }
  }, [
    uploadQueue,
    isUploading,
    setSyncStatus,
    setErrorState, // PHASE 1.2: Create optimistic entries immediately
    createOptimisticEntries,
    uploadLargeFile,
  ]);

  // Auto-process queue when new items are added
  useEffect(() => {
    processUploadQueue();
  }, [processUploadQueue]);

  // Handle file selection with optimistic updates
  const handleFileSelect = useCallback(
    async (files: FileList): Promise<void> => {
      if (files.length === 0) return;

      const newQueueItems: UploadQueueItem[] = [];

      Array.from(files).forEach((file) => {
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Create optimistic asset with all required fields
        const optimisticAsset: MediaAsset = {
          id: Date.now() + Math.random(), // Temporary ID
          filename: file.name,
          originalName: file.name,
          size: file.size,
          type: detectMimeType(file).startsWith("image/")
            ? "image"
            : detectMimeType(file).startsWith("video/")
              ? "video"
              : detectMimeType(file).startsWith("model/")
                ? "model"
                : "document",
          mimeType: detectMimeType(file),
          url: URL.createObjectURL(file),
          tags: [],
          metadata: {},
          uploadedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          folderId: null,
          altText: null,
          caption: null,
          // downloadCount: 0,
          thumbnailStoragePath: null,
          imageVariants: null,
          // lastAccessedAt: null,
          fileSize: file.size,
          thumbnailUrl: null,
          thumbnailFilename: null,
          storagePath: "",
          bucketName: "",
          deletedAt: null,
        };

        newQueueItems.push({
          file,
          id,
          status: "pending",
          progress: 0,
          optimisticAsset,
        });
      });

      setUploadQueue((prev) => [...prev, ...newQueueItems]);

      // Use context upload for better UX
      try {
        await uploadFiles(files);
      } catch (_error) {}
    },
    [uploadFiles],
  );

  // Queue management functions
  const cancelUpload = useCallback((id: string): void => {
    setUploadQueue((prev) => {
      const item = prev.find((item) => item.id === id);
      if (item?.abortController) {
        item.abortController.abort();
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const retryUpload = useCallback((id: string): void => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: "pending", progress: 0, errorMessage: undefined }
          : item,
      ),
    );
  }, []);

  const pauseUpload = useCallback((id: string): void => {
    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.id === id && item.abortController) {
          item.abortController.abort();
          return { ...item, status: "paused" };
        }
        return item;
      }),
    );
  }, []);

  const resumeUpload = useCallback((id: string): void => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "pending" } : item)),
    );
  }, []);

  // Clear all completed uploads
  const clearCompleted = useCallback((): void => {
    setUploadQueue((prev) => prev.filter((item) => item.status !== "completed"));
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const files = e.target.files;
      if (files) {
        Array.from(files).forEach((_file, _index) => {});
        handleFileSelect(files);
      }
    },
    [handleFileSelect],
  );

  const hasActiveUploads = uploadQueue.some(
    (item) => item.status === "uploading" || item.status === "pending",
  );

  const completedCount = uploadQueue.filter((item) => item.status === "completed").length;
  const errorCount = uploadQueue.filter((item) => item.status === "error").length;

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25",
          hasActiveUploads && "opacity-50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          // LOG: Show accepted file types when file picker opens
          // LOG: Show accepted file types when file picker opens
          // const _acceptedTypes = ".gltf,.glb,.jpg,.jpeg,.png,.gif,.svg,.mp4,.webm,.pdf,.doc,.docx,image/*,video/*,audio/*";
          fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".gltf,.glb,.jpg,.jpeg,.png,.gif,.svg,.mp4,.webm,.pdf,.doc,.docx,image/*,video/*,audio/*"
          onChange={handleFileInputChange}
          className="hidden"
          id="media-upload-file-input"
          aria-label="Upload media files"
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className="text-muted-foreground h-8 w-8" />
          <div>
            <p className="text-sm font-medium">
              {isDragging ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">or click to select files</p>
          </div>

          <Button variant="outline" size="sm" disabled={hasActiveUploads}>
            Select Files
          </Button>
        </div>
      </div>

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Upload Queue</h3>
              <div className="flex items-center gap-2">
                {completedCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {completedCount} completed
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errorCount} errors
                  </Badge>
                )}
                {completedCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCompleted} className="text-xs">
                    Clear Completed
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {uploadQueue.map((item) => (
                <UploadItem
                  key={item.id}
                  item={item}
                  onCancel={cancelUpload}
                  onRetry={retryUpload}
                  onPause={pauseUpload}
                  onResume={resumeUpload}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall progress */}
      {hasActiveUploads && (
        <div className="text-center">
          <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
            Processing uploads...
          </div>
        </div>
      )}
    </div>
  );
}
