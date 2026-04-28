import type { MediaAsset } from "@shared/index";
import { FileImage, FileText, FileVideo } from "lucide-react";

// ─── Upload Queue Item Interface ───────────────────────────────────────────────

export interface UploadQueueItem {
  file: File;
  id: string;
  status: "pending" | "uploading" | "paused" | "completed" | "error";
  progress: number;
  optimisticAsset?: MediaAsset;
  errorMessage?: string | undefined;
  abortController?: AbortController;
  // Performance tracking
  startTime?: number | undefined;
  uploadSpeed?: number | undefined; // bytes per second
  estimatedTimeRemaining?: number | undefined; // seconds
  retryCount?: number | undefined;
  priority?: "high" | "normal" | "low";
  // Metadata for early entry & persistence
  altText?: string;
  caption?: string;
  tags?: string[];
  title?: string;
}

// ─── MIME Type Detection ───────────────────────────────────────────────────────

export const detectMimeType = (file: File): string => {
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

// ─── File Validation ───────────────────────────────────────────────────────────

export const validateFile = (file: File): { valid: boolean; mimeType: string } => {
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

  // CRITICAL FIX: Change hard errors to warnings for better UX
  if (!allowedExtensions.includes(extension)) {
    // Don't throw error - let upload attempt continue
  }

  if (file.size > maxSize) {
    // Don't throw error - let upload attempt continue
  }

  const mimeType = detectMimeType(file);

  return { valid: true, mimeType };
};

// ─── Upload Metrics ────────────────────────────────────────────────────────────

export const uploadMetrics = {
  attempts: 0,
  successes: 0,
  failures: 0,
  gltfUploads: 0,
  mimeTypeIssues: 0,
  // Performance metrics
  totalUploadTime: 0,
  averageUploadSpeed: 0,
  concurrentUploads: 0,
  maxConcurrentUploads: 2,
  queuedUploads: 0,
};

// ─── Upload Queue Manager ──────────────────────────────────────────────────────

export class UploadQueueManager {
  private activeUploads = new Set<string>();
  private maxConcurrent = 2;
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

  // Pure peek function for render - no mutation
  peekNextInQueue(): UploadQueueItem | null {
    if (this.pendingQueue.length === 0) {
      return null;
    }

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

  // Separate function for actual dequeuing
  getNextInQueue(): UploadQueueItem | null {
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

    return sortedQueue.findIndex((item) => item.id === itemId) + 1;
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

export const queueManager = new UploadQueueManager();

// ─── Performance Tracking ──────────────────────────────────────────────────────

export const trackPerformance = async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;

    if (operation.includes("upload")) {
      uploadMetrics.totalUploadTime += duration;
      uploadMetrics.attempts++;
    }

    return result;
  } catch (error) {
    if (operation.includes("upload")) {
      uploadMetrics.failures++;
    }

    throw error;
  }
};

// ─── Formatting Utilities ──────────────────────────────────────────────────────

export const formatUploadSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond} B/s`;
  }
  if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

export const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

// ─── File Type Icon Mapping ────────────────────────────────────────────────────

export const getFileTypeIcon = (type: string): typeof FileImage => {
  if (type.startsWith("image/")) {
    return FileImage;
  }
  if (type.startsWith("video/")) {
    return FileVideo;
  }
  return FileText;
};
