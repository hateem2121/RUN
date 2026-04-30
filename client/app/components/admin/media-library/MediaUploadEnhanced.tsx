import type { MediaAsset } from "@shared/index";
import { Upload } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { invalidateMediaQueries } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useMediaLibraryEnhanced } from "./MediaLibraryContextEnhanced";

// Import extracted modules
import { UploadItem } from "./upload/UploadItem";
import {
  detectMimeType,
  trackPerformance,
  type UploadQueueItem,
  uploadMetrics,
  validateFile,
} from "./upload/upload-utilities";

// Browser-safe fallbacks
const filterValidMediaAssets = (assets: unknown[]): MediaAsset[] => assets as MediaAsset[];
const logTypeError = (_error: Error, _context: string) => {};

// CRITICAL FIX: Dedicated Web Worker for uploads to bypass DevTools monkeypatching
import type { UploadMessage, WorkerResponse } from "@/workers/uploader";

let uploadWorker: Worker | null = null;
const getUploadWorker = (): Worker => {
  if (uploadWorker) {
    return uploadWorker;
  }

  uploadWorker = new Worker(new URL("@/workers/uploader.ts?ver=20250916", import.meta.url), {
    type: "module",
  });
  return uploadWorker;
};

export function MediaUploadEnhanced() {
  const { setErrorState, setSyncStatus, uploadFiles } = useMediaLibraryEnhanced();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // SEC-006: Restore upload queue from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("run_remix_upload_queue");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        interface RestoredUploadItem {
          id: string;
          status: string;
          progress: number;
          filename?: string;
          fileType?: string;
          fileSize?: number;
        }

        // Map back to UploadQueueItem, files will be empty blobs (placeholder)
        const restored = parsed.map((item: RestoredUploadItem) => ({
          ...item,
          file: new File([], item.filename || "restored-file"),
          status: item.status === "completed" ? "completed" : "error",
          errorMessage:
            item.status === "completed"
              ? undefined
              : "Session restored. Please re-select file to resume.",
        }));
        setUploadQueue(restored);
      } catch (_e) {
        localStorage.removeItem("run_remix_upload_queue");
      }
    }
  }, []);

  // SEC-006: Persist upload queue to localStorage (exclude File and AbortController)
  useEffect(() => {
    const toSave = uploadQueue
      .filter((item) => item.status !== "completed")
      .map(({ file, abortController, optimisticAsset, ...rest }) => ({
        ...rest,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
      }));

    if (toSave.length > 0) {
      localStorage.setItem("run_remix_upload_queue", JSON.stringify(toSave));
    } else {
      localStorage.removeItem("run_remix_upload_queue");
    }
  }, [uploadQueue]);

  // Create optimistic media entries for immediate UI feedback
  const createOptimisticEntries = useCallback((items: UploadQueueItem[]) => {
    const optimisticEntries = items.map((item, index) => {
      const detectedMime = detectMimeType(item.file);
      return {
        id: Date.now() + index,
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
        isOptimistic: true,
        url: URL.createObjectURL(item.file),
      };
    });

    getQueryClient().setQueriesData(
      {
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === "apimedia",
      },
      (oldData: unknown) => {
        const currentData = (oldData as { data?: { data?: unknown[]; total: number } }) || {
          data: { data: [], total: 0 },
        };
        if (!currentData?.data?.data) {
          return oldData;
        }

        return {
          ...currentData,
          data: {
            ...currentData.data,
            data: [...optimisticEntries, ...currentData.data.data],
            total: (currentData.data.total || 0) + optimisticEntries.length,
          },
        };
      },
    );
  }, []);

  // Worker-based upload function for large files
  const uploadLargeFile = useCallback(
    async (
      item: UploadQueueItem,
      controller: AbortController,
      setQueue: React.Dispatch<React.SetStateAction<UploadQueueItem[]>>,
    ) => {
      const { file } = item;

      try {
        const validation = validateFile(file);

        uploadMetrics.attempts++;
        if (file.name.toLowerCase().includes(".gltf")) {
          uploadMetrics.gltfUploads++;
        }
        if (!file.type || file.type === "") {
          uploadMetrics.mimeTypeIssues++;
        }

        const worker = getUploadWorker();

        const uploadPromise = new Promise<void>((resolve, reject) => {
          const messageHandler = (event: MessageEvent<WorkerResponse>) => {
            const { type, fileId, percent, message } = event.data;

            if (fileId !== item.id) {
              return;
            }

            switch (type) {
              case "init":
                setQueue((prev) =>
                  prev.map((qItem) =>
                    qItem.id === item.id ? { ...qItem, status: "uploading" } : qItem,
                  ),
                );
                break;

              case "progress":
                setQueue((prev) =>
                  prev.map((qItem) =>
                    qItem.id === item.id
                      ? { ...qItem, progress: percent || 0, status: "uploading" }
                      : qItem,
                  ),
                );
                break;

              case "chunkComplete":
                break;

              case "completed":
                (async () => {
                  await invalidateMediaQueries(getQueryClient());
                })().catch((_error) => {});

                setQueue((prev) =>
                  prev.map((qItem) =>
                    qItem.id === item.id ? { ...qItem, progress: 100, status: "completed" } : qItem,
                  ),
                );

                worker.removeEventListener("message", messageHandler);
                resolve();
                break;

              case "error":
                worker.removeEventListener("message", messageHandler);
                reject(new Error(message || "Worker upload failed"));
                break;
            }
          };

          worker.addEventListener("message", messageHandler);

          controller.signal.addEventListener("abort", () => {
            worker.postMessage({ type: "cancel", fileId: item.id } as UploadMessage);
            worker.removeEventListener("message", messageHandler);
            reject(new Error("Upload cancelled"));
          });

          worker.postMessage({
            type: "start",
            fileId: item.id,
            name: file.name,
            size: file.size,
            mimeType: validation.mimeType,
            file: file,
          } as UploadMessage);
        });

        await uploadPromise;
      } catch (_error) {
        const errorMessage = `${file.name} upload failed. Would you like to try again?`;
        uploadMetrics.failures++;

        setQueue((prev) =>
          prev.map((qItem) =>
            qItem.id === item.id ? { ...qItem, status: "error", errorMessage } : qItem,
          ),
        );
      }
    },
    [],
  );

  // Process upload queue
  const processUploadQueue = useCallback(async () => {
    if (isUploading) {
      return;
    }

    const pendingItems = uploadQueue.filter((item) => item.status === "pending");
    if (pendingItems.length === 0) {
      return;
    }

    setIsUploading(true);
    setSyncStatus("syncing");
    createOptimisticEntries(pendingItems);

    try {
      const MAX_CONCURRENT_UPLOADS = 2;

      for (let i = 0; i < pendingItems.length; i += MAX_CONCURRENT_UPLOADS) {
        const batch = pendingItems.slice(i, i + MAX_CONCURRENT_UPLOADS);

        await Promise.all(
          batch.map(async (item) => {
            const controller = new AbortController();

            setUploadQueue((prev) =>
              prev.map((qItem) =>
                qItem.id === item.id
                  ? { ...qItem, status: "uploading", abortController: controller }
                  : qItem,
              ),
            );

            try {
              await trackPerformance("Media Upload", async () => {
                const CHUNK_THRESHOLD = 8 * 1024 * 1024;

                if (item.file.size > CHUNK_THRESHOLD) {
                  await uploadLargeFile(item, controller, setUploadQueue);
                } else {
                  const formData = new FormData();
                  formData.append("file", item.file);

                  let retryCount = 0;
                  const maxRetries = 3;
                  let result: { data?: MediaAsset[] } | unknown;

                  while (retryCount <= maxRetries) {
                    try {
                      result = await apiRequest("/api/media/upload", {
                        method: "POST",
                        body: formData,
                      });

                      await invalidateMediaQueries(getQueryClient());
                      break;
                    } catch (error) {
                      const isHttpError = error && typeof error === "object" && "status" in error;

                      if (isHttpError) {
                        const status = (error as { status?: number }).status;
                        if (status === 413) {
                          throw new Error(
                            `File too large: ${item.file.name} exceeds server size limits`,
                          );
                        } else {
                          throw error;
                        }
                      }

                      retryCount++;
                      if (
                        error instanceof TypeError &&
                        error.message.includes("Failed to fetch") &&
                        retryCount <= maxRetries
                      ) {
                        await new Promise((resolve) =>
                          setTimeout(resolve, 2 ** (retryCount - 1) * 1000),
                        );
                      } else {
                        throw error;
                      }
                    }
                  }

                  const uploadResult = result as { data?: MediaAsset[] };
                  if (uploadResult.data && Array.isArray(uploadResult.data)) {
                    const validatedAssets = filterValidMediaAssets(uploadResult.data);
                    if (validatedAssets.length !== uploadResult.data.length) {
                      logTypeError(
                        new Error(
                          `Upload validation failed: ${uploadResult.data.length - validatedAssets.length} invalid assets`,
                        ),
                        `Upload Response Validation - ${item.file.name}`,
                      );
                    }
                  }

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
              if (error instanceof Error && error.name === "AbortError") {
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
      await invalidateMediaQueries(getQueryClient());
      try {
        await getQueryClient().refetchQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && key[0] === "apimedia";
          },
        });
      } catch (_error) {}

      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((item) => item.status !== "completed"));
      }, 3000);
    } catch (error) {
      setSyncStatus("error");
      setErrorState({
        hasError: true,
        errorMessage: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setIsUploading(false);
    }
  }, [
    uploadQueue,
    isUploading,
    setSyncStatus,
    setErrorState,
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
      if (files.length === 0) {
        return;
      }

      const newQueueItems: UploadQueueItem[] = [];

      Array.from(files).forEach((file) => {
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        const optimisticAsset: MediaAsset = {
          id: Date.now() + Math.random(),
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
          thumbnailStoragePath: null,
          imageVariants: null,
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

      try {
        await uploadFiles(files);
      } catch (_error) {}
    },
    [uploadFiles],
  );

  const updateMetadata = useCallback((id: string, metadata: Partial<UploadQueueItem>): void => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...metadata } : item)),
    );
  }, []);

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
          "cursor-pointer rounded-xl border border-dashed p-10 flex flex-col items-center justify-center transition-all bg-white/[0.02]",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-white/10 hover:border-white/20 hover:bg-white/[0.04]",
          hasActiveUploads && "opacity-50 pointer-events-none",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
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

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-white/[0.05] flex items-center justify-center mb-2">
            <Upload className="text-[#68869A] h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-medium text-[#E3DFD6]">
              {isDragging ? "Drop files here" : "Drag & drop files or click to browse"}
            </p>
            <p className="text-[#68869A] mt-1 text-sm">Supports GLB, PNG, JPG, MP4 up to 50MB</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={hasActiveUploads}
            className="mt-2 border-white/10 bg-white/5 text-[#E3DFD6] hover:bg-white/10 hover:text-white transition-colors"
          >
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
                  onUpdateMetadata={updateMetadata}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall progress */}
      {hasActiveUploads && (
        <div className="text-center">
          <div className="text-[#68869A] inline-flex items-center gap-2 text-sm">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
            Processing uploads...
          </div>
        </div>
      )}
    </div>
  );
}
