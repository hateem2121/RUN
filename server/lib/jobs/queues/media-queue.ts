/**
 * Media Processing Queue
 * Cloud Tasks integration for async media processing
 *
 * This module provides queue functionality for deferring heavy media operations
 * like image optimization, thumbnail generation, and 3D model processing.
 */

import { CloudTasksClient, type protos } from "@google-cloud/tasks";
import type { MediaOperation, MediaProcessingJobData } from "@run-remix/shared";
import { logger } from "../../monitoring/logger.js";

// Environment configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
const LOCATION = process.env.CLOUD_TASKS_LOCATION || "us-central1";
const QUEUE_NAME = process.env.MEDIA_QUEUE_NAME || "media-processing";
const SERVICE_URL = process.env.CLOUD_RUN_SERVICE_URL || "https://run-remix-us-central1.a.run.app";

// Initialize client (lazy)
let tasksClient: CloudTasksClient | null = null;

function getClient(): CloudTasksClient {
  if (!tasksClient) {
    tasksClient = new CloudTasksClient();
  }
  return tasksClient;
}
// Types are now imported from @run-remix/shared

/**
 * Task result for tracking
 */
interface QueueResult {
  success: boolean;
  taskName?: string | undefined;
  error?: string | undefined;
  scheduledTime?: Date | undefined;
}

/**
 * Queue a media processing task
 *
 * @example
 * ```typescript
 * const result = await queueMediaProcessing({
 *   mediaId: "123",
 *   operation: "optimize",
 *   options: { width: 1920, quality: 85 }
 * });
 * ```
 */
export async function queueMediaProcessing(
  payload: MediaProcessingJobData,
  delaySeconds = 0,
): Promise<QueueResult> {
  // Skip queue in development/test - process inline
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    logger.info("[MediaQueue] Development mode - skipping Cloud Tasks queue", {
      mediaId: payload.mediaId,
      operation: payload.operation,
    });
    return {
      success: true,
      taskName: `dev-task-${Date.now()}`,
      scheduledTime: new Date(),
    };
  }

  // Validate required environment
  if (!PROJECT_ID) {
    logger.error("[MediaQueue] Missing GOOGLE_CLOUD_PROJECT environment variable");
    return {
      success: false,
      error: "Cloud Tasks not configured: missing project ID",
    };
  }

  try {
    const client = getClient();
    const parent = client.queuePath(PROJECT_ID, LOCATION, QUEUE_NAME);

    const task: protos.google.cloud.tasks.v2.ITask = {
      httpRequest: {
        httpMethod: "POST",
        url: `${SERVICE_URL}/api/worker/process-media`,
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(JSON.stringify(payload)).toString("base64"),
        oidcToken: {
          serviceAccountEmail: `${PROJECT_ID}@appspot.gserviceaccount.com`,
        },
      },
    };

    // Add delay if specified
    if (delaySeconds > 0) {
      const scheduleTime = new Date();
      scheduleTime.setSeconds(scheduleTime.getSeconds() + delaySeconds);
      task.scheduleTime = {
        seconds: Math.floor(scheduleTime.getTime() / 1000),
      };
    }

    const [response] = await client.createTask({ parent, task });

    logger.info("[MediaQueue] Task queued successfully", {
      mediaId: payload.mediaId,
      operation: payload.operation,
      taskName: response.name,
    });

    return {
      success: true,
      taskName: response.name || undefined,
      scheduledTime: task.scheduleTime
        ? new Date((task.scheduleTime.seconds as number) * 1000)
        : new Date(),
    };
  } catch (error) {
    logger.error("[MediaQueue] Failed to queue task", {
      mediaId: payload.mediaId,
      operation: payload.operation,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Queue multiple operations for a single media item
 */
/** @public */ export async function queueMediaOperations(
  mediaId: string,
  operations: MediaOperation[],
): Promise<QueueResult[]> {
  const results: QueueResult[] = [];

  for (const operation of operations) {
    const result = await queueMediaProcessing({ mediaId, operation });
    results.push(result);
  }

  return results;
}

/**
 * Get queue statistics (for monitoring)
 */
/** @public */ export async function getQueueStats(): Promise<{
  name: string;
  state: string;
  tasksCount?: number;
} | null> {
  if (!PROJECT_ID) {
    return null;
  }

  try {
    const client = getClient();
    const queuePath = client.queuePath(PROJECT_ID, LOCATION, QUEUE_NAME);
    const [queue] = await client.getQueue({ name: queuePath });

    return {
      name: queue.name || QUEUE_NAME,
      state: queue.state?.toString() || "UNKNOWN",
    };
  } catch (error) {
    logger.warn("[MediaQueue] Failed to get queue stats", { error });
    return null;
  }
}
