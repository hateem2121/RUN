// CRITICAL FIX: Dedicated Web Worker for chunk uploads to bypass DevTools network patching
// DevTools (eruda.js) patch window-level fetch/XMLHttpRequest but not WorkerGlobalScope.self.fetch

interface UploadMessage {
  type: "start" | "pause" | "resume" | "cancel";
  fileId: string;
  name?: string;
  size?: number;
  mimeType?: string;
  file?: File;
}

interface WorkerResponse {
  type: "init" | "progress" | "chunkComplete" | "completed" | "error";
  fileId: string;
  uploadId?: string;
  totalChunks?: number;
  percent?: number;
  bytesSent?: number;
  chunkIndex?: number;
  serverResponse?: unknown;
  message?: string;
  error?: string;
}

interface UploadSession {
  fileId: string;
  uploadId: string;
  file: File;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number;
  abortController: AbortController;
  isPaused: boolean;
}

// Active upload sessions
const uploadSessions = new Map<string, UploadSession>();

// PRISTINE FETCH: Use worker's unpatched self.fetch (bypasses DevTools) with upload timeout
const pristineFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // UPLOAD OPTIMIZATION: 5-minute timeout for upload operations to match main thread
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    5 * 60 * 1000,
  ); // 5 minutes to match apiRequest

  try {
    // Combine any existing signal with our timeout signal
    const combinedSignal = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal;

    const response = await self.fetch(url, {
      ...options,
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Worker upload timeout: Request took longer than 5 minutes`);
    }
    throw error;
  }
};

// Compute SHA-256 hash for chunk integrity
const computeHash = async (data: ArrayBuffer): Promise<string> => {
  const hashBuffer = await self.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
};

// Initialize chunked upload session
const initializeUpload = async (
  _fileId: string,
  filename: string,
  size: number,
  mimeType: string,
): Promise<{ uploadId: string; chunkSize: number; totalChunks: number }> => {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for better performance

  const response = await pristineFetch("/api/media/upload/init", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename,
      fileSize: size,
      mimeType,
      chunkSize: CHUNK_SIZE,
    }),
  });

  if (!response.ok) {
    throw new Error(`Init failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Upload initialization failed");
  }

  return result.data;
};

// Upload single chunk with pristine fetch
const uploadChunk = async (
  uploadId: string,
  chunkIndex: number,
  chunkData: ArrayBuffer,
  totalChunks: number,
  abortController: AbortController,
): Promise<void> => {
  const chunkHash = await computeHash(chunkData);
  const targetUrl = "/api/media/upload/chunk-raw";
  const headers = {
    "Content-Type": "application/octet-stream",
    "X-Upload-ID": uploadId,
    "X-Chunk-Index": chunkIndex.toString(),
    "X-Chunk-Size": chunkData.byteLength.toString(),
    "X-Chunk-Hash": chunkHash,
    "X-Total-Chunks": totalChunks.toString(),
  };

  const response = await pristineFetch(targetUrl, {
    method: "POST",
    headers,
    body: chunkData,
    signal: abortController.signal,
  });

  if (!response.ok) {
    // Enhanced error logging - capture full response for debugging
    let responseBody: string;
    try {
      responseBody = await response.text();
    } catch (_e) {
      responseBody = "Unable to read response body";
    }
    throw new Error(
      `Chunk ${chunkIndex} failed: ${response.status} ${response.statusText} - ${responseBody}`,
    );
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || `Chunk ${chunkIndex} upload failed`);
  }
};

// Finalize upload
const finalizeUpload = async (uploadId: string): Promise<unknown> => {
  const response = await pristineFetch("/api/media/upload/finalize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uploadId }),
  });

  if (!response.ok) {
    throw new Error(`Finalize failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Upload finalization failed");
  }

  return result.data;
};

// Process file upload with chunking and retry logic
const processFileUpload = async (session: UploadSession): Promise<void> => {
  const { fileId, uploadId, file, chunkSize, totalChunks, abortController } = session;
  let uploadedBytes = 0;
  const PARALLEL_UPLOADS = 3; // Upload 3 chunks in parallel for speed

  try {
    // Upload chunks in parallel batches for better performance
    for (let batchStart = 0; batchStart < totalChunks; batchStart += PARALLEL_UPLOADS) {
      const batchEnd = Math.min(batchStart + PARALLEL_UPLOADS, totalChunks);
      const batchPromises = [];

      for (let chunkIndex = batchStart; chunkIndex < batchEnd; chunkIndex++) {
        // Check if upload is paused
        while (session.isPaused && !abortController.signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (abortController.signal.aborted) {
          throw new Error("Upload cancelled");
        }

        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunkBlob = file.slice(start, end);

        // Create upload promise for this chunk
        const uploadPromise = (async () => {
          const chunkBuffer = await chunkBlob.arrayBuffer();

          // Retry logic for network failures
          let retries = 0;
          const maxRetries = 3;

          while (retries <= maxRetries) {
            try {
              await uploadChunk(uploadId, chunkIndex, chunkBuffer, totalChunks, abortController);

              // Success - update progress
              uploadedBytes += chunkBuffer.byteLength;
              session.uploadedChunks = chunkIndex + 1;

              const percent = Math.round((uploadedBytes / file.size) * 100);

              self.postMessage({
                type: "progress",
                fileId,
                percent,
                bytesSent: uploadedBytes,
                chunkIndex,
              } as WorkerResponse);

              self.postMessage({
                type: "chunkComplete",
                fileId,
                chunkIndex,
              } as WorkerResponse);

              break; // Success, exit retry loop
            } catch (error) {
              retries++;
              if (retries > maxRetries) {
                throw new Error(`Chunk ${chunkIndex} failed after ${maxRetries} retries: ${error}`);
              }

              // Exponential backoff
              const delay = Math.min(1000 * 2 ** (retries - 1), 5000);
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        })();

        batchPromises.push(uploadPromise);
      }

      // Wait for all chunks in this batch to complete
      await Promise.all(batchPromises);
    }

    // Finalize upload
    const finalResult = await finalizeUpload(uploadId);

    self.postMessage({
      type: "completed",
      fileId,
      serverResponse: finalResult,
    } as WorkerResponse);
  } catch (error) {
    self.postMessage({
      type: "error",
      fileId,
      message: error instanceof Error ? error.message : "Upload failed",
    } as WorkerResponse);
  } finally {
    // Cleanup session
    uploadSessions.delete(fileId);
  }
};

// Worker message handler
self.onmessage = async (event: MessageEvent<UploadMessage>) => {
  const { type, fileId, name, size, mimeType, file } = event.data;

  try {
    switch (type) {
      case "start": {
        if (!name || !size || !mimeType || !file) {
          throw new Error("Missing required upload parameters");
        }

        // Initialize upload session
        const { uploadId, chunkSize, totalChunks } = await initializeUpload(
          fileId,
          name,
          size,
          mimeType,
        );

        const abortController = new AbortController();
        const session: UploadSession = {
          fileId,
          uploadId,
          file,
          chunkSize,
          totalChunks,
          uploadedChunks: 0,
          abortController,
          isPaused: false,
        };

        uploadSessions.set(fileId, session);

        self.postMessage({
          type: "init",
          fileId,
          uploadId,
          totalChunks,
        } as WorkerResponse);

        // Start uploading
        processFileUpload(session);
        break;
      }

      case "pause": {
        const pauseSession = uploadSessions.get(fileId);
        if (pauseSession) {
          pauseSession.isPaused = true;
        }
        break;
      }

      case "resume": {
        const resumeSession = uploadSessions.get(fileId);
        if (resumeSession) {
          resumeSession.isPaused = false;
        }
        break;
      }

      case "cancel": {
        const cancelSession = uploadSessions.get(fileId);
        if (cancelSession) {
          cancelSession.abortController.abort();
          uploadSessions.delete(fileId);
        }
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      fileId,
      message: error instanceof Error ? error.message : "Worker operation failed",
    } as WorkerResponse);
  }
};

// Export types for TypeScript (not actually used in worker)
export type { UploadMessage, WorkerResponse };
