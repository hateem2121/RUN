import type { Request, Response } from "express";
import { logger } from "../../lib/monitoring/logger.js";

export interface DrainOptions {
  baseDelayMs?: number;
  jitterMs?: number;
}

/**
 * SSE-02: Server-Sent Events (SSE) Hub
 *
 * Centralized registry for managing long-lived SSE connections across the RUN APPAREL platform.
 * Supports client registration, broadcasting, socket heartbeats, and graceful server draining
 * with randomized backoff jitter to eliminate thundering herd reconnection storms on deploys.
 */
export class SSEHub {
  private static instance: SSEHub | null = null;
  private readonly clients: Set<Response> = new Set<Response>();
  private readonly clientMetadata: Map<Response, Record<string, unknown>> = new Map();

  public static getInstance(): SSEHub {
    if (!SSEHub.instance) {
      SSEHub.instance = new SSEHub();
    }
    return SSEHub.instance;
  }

  /**
   * Resets the singleton instance (primarily for test isolation).
   */
  public static resetInstance(): void {
    if (SSEHub.instance) {
      SSEHub.instance.clients.clear();
      SSEHub.instance.clientMetadata.clear();
      SSEHub.instance = null;
    }
  }

  /**
   * Registers a client SSE response stream.
   * Sets proper SSE headers, flushes the initial connection comment, and binds cleanup listeners.
   *
   * @param req - Express Request
   * @param res - Express Response
   * @param metadata - Optional metadata (e.g. clientId, stream type)
   * @returns Unregister cleanup function
   */
  public registerClient(
    req: Request,
    res: Response,
    metadata?: Record<string, unknown>,
  ): () => void {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
      }
    }

    try {
      res.write(": connected\n\n");
      if (typeof (res as { flush?: () => void }).flush === "function") {
        (res as { flush: () => void }).flush();
      }
    } catch (error) {
      logger.warn("[SSEHub] Failed to flush initial connection comment", error);
    }

    this.clients.add(res);
    if (metadata) {
      this.clientMetadata.set(res, metadata);
    }

    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      this.clients.delete(res);
      this.clientMetadata.delete(res);
    };

    req.on("close", cleanup);
    res.once?.("close", cleanup);

    return () => {
      req.off?.("close", cleanup);
      res.off?.("close", cleanup);
      cleanup();
    };
  }

  /**
   * Serializes data and writes an event frame to all active clients.
   *
   * @param event - SSE event name
   * @param data - Payload to serialize
   */
  public broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(payload);
        if (typeof (client as { flush?: () => void }).flush === "function") {
          (client as { flush: () => void }).flush();
        }
      } catch {
        this.clients.delete(client);
        this.clientMetadata.delete(client);
      }
    }
  }

  /**
   * Sends an SSE comment heartbeat (: ping\n\n) to all connected clients to keep sockets alive.
   */
  public sendHeartbeat(): void {
    const payload = ": ping\n\n";
    for (const client of this.clients) {
      try {
        client.write(payload);
        if (typeof (client as { flush?: () => void }).flush === "function") {
          (client as { flush: () => void }).flush();
        }
      } catch {
        this.clients.delete(client);
        this.clientMetadata.delete(client);
      }
    }
  }

  /**
   * SSE-02: Server Drain Event on Shutdown with Randomized Jitter.
   * Dispatches `event: drain` to every client individually with a randomized backoff delay:
   * `reconnectAfterMs = (baseDelayMs ?? 2000) + Math.floor(Math.random() * (jitterMs ?? 3000))`
   * Flushes and terminates each response stream, then clears all active client references.
   *
   * @param options - Custom base delay and jitter window in milliseconds
   */
  public async drainAll(options?: DrainOptions): Promise<void> {
    const baseDelay = options?.baseDelayMs ?? 2000;
    const jitter = options?.jitterMs ?? 3000;

    for (const client of this.clients) {
      try {
        const reconnectAfterMs = baseDelay + Math.floor(Math.random() * jitter);
        const payload = `event: drain\ndata: {"reconnectAfterMs": ${reconnectAfterMs}}\n\n`;
        client.write(payload);
        if (typeof (client as { flush?: () => void }).flush === "function") {
          (client as { flush: () => void }).flush();
        }
        client.end();
      } catch {
        // Ignore errors if client already closed or stream destroyed
      }
    }

    this.clients.clear();
    this.clientMetadata.clear();
  }

  /**
   * Returns the count of currently connected active SSE clients.
   */
  public getActiveCount(): number {
    return this.clients.size;
  }

  /**
   * Returns metadata for a registered client if available.
   */
  public getClientMetadata(res: Response): Record<string, unknown> | undefined {
    return this.clientMetadata.get(res);
  }
}

export const sseHub = SSEHub.getInstance();
