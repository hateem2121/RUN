import { EventEmitter } from "node:events";
import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SSEHub, sseHub } from "../../../services/realtime/sse-hub.js";

/**
 * Lightweight mock Request emitting events like a real Express / Node HTTP request.
 */
class MockRequest extends EventEmitter {
  public destroyed = false;
  public query: Record<string, string> = {};
  public ip = "127.0.0.1";
}

/**
 * Lightweight mock Response implementing Express / Node HTTP response methods.
 */
class MockResponse extends EventEmitter {
  public headers: Record<string, string> = {};
  public writtenChunks: string[] = [];
  public headersSent = false;
  public finished = false;
  public writableEnded = false;
  public flushCalled = false;
  public flushHeadersCalled = false;

  public setHeader(name: string, value: string): this {
    this.headers[name.toLowerCase()] = value;
    return this;
  }

  public getHeader(name: string): string | undefined {
    return this.headers[name.toLowerCase()];
  }

  public write(chunk: string): boolean {
    this.headersSent = true;
    this.writtenChunks.push(chunk);
    return true;
  }

  public flush(): void {
    this.flushCalled = true;
  }

  public flushHeaders(): void {
    this.flushHeadersCalled = true;
    this.headersSent = true;
  }

  public end(): this {
    this.finished = true;
    this.writableEnded = true;
    this.emit("finish");
    this.emit("close");
    return this;
  }
}

describe("SSEHub (SSE-02: Server Drain Event with Randomized Jitter)", () => {
  let hub: SSEHub;

  beforeEach(() => {
    SSEHub.resetInstance();
    hub = new SSEHub();
  });

  afterEach(async () => {
    await hub.drainAll();
    SSEHub.resetInstance();
  });

  describe("Singleton Pattern", () => {
    it("provides a stable singleton instance via sseHub and getInstance()", () => {
      const instance1 = SSEHub.getInstance();
      const instance2 = SSEHub.getInstance();
      expect(instance1).toBe(instance2);
      expect(sseHub).toBeInstanceOf(SSEHub);
    });

    it("clears clients when resetInstance() is called", () => {
      const req = new MockRequest() as unknown as Request;
      const res = new MockResponse() as unknown as Response;
      const instance = SSEHub.getInstance();
      instance.registerClient(req, res);
      expect(instance.getActiveCount()).toBe(1);

      SSEHub.resetInstance();
      const freshInstance = SSEHub.getInstance();
      expect(freshInstance.getActiveCount()).toBe(0);
    });
  });

  describe("Client Registration & Headers", () => {
    it("sets correct SSE headers and flushes initial connected comment", () => {
      const req = new MockRequest() as unknown as Request;
      const res = new MockResponse() as unknown as Response;

      hub.registerClient(req, res, { clientId: "loom-01", line: 4 });

      const mockRes = res as unknown as MockResponse;
      expect(mockRes.getHeader("content-type")).toBe("text/event-stream");
      expect(mockRes.getHeader("cache-control")).toBe("no-cache, no-transform");
      expect(mockRes.getHeader("connection")).toBe("keep-alive");
      expect(mockRes.getHeader("x-accel-buffering")).toBe("no");
      expect(mockRes.flushHeadersCalled).toBe(true);

      // Initial flush comment
      expect(mockRes.writtenChunks[0]).toBe(": connected\n\n");
      expect(mockRes.flushCalled).toBe(true);

      // Active count and metadata
      expect(hub.getActiveCount()).toBe(1);
      expect(hub.getClientMetadata(res)).toEqual({ clientId: "loom-01", line: 4 });
    });

    it("does not overwrite headers if headers were already sent", () => {
      const req = new MockRequest() as unknown as Request;
      const res = new MockResponse() as unknown as Response;
      const mockRes = res as unknown as MockResponse;
      mockRes.headersSent = true;

      hub.registerClient(req, res);

      expect(mockRes.getHeader("content-type")).toBeUndefined();
      expect(hub.getActiveCount()).toBe(1);
    });

    it("cleans up client when req emits close event", () => {
      const req = new MockRequest() as unknown as Request;
      const res = new MockResponse() as unknown as Response;

      hub.registerClient(req, res);
      expect(hub.getActiveCount()).toBe(1);

      // Simulate client disconnect
      (req as unknown as MockRequest).emit("close");

      expect(hub.getActiveCount()).toBe(0);
      expect(hub.getClientMetadata(res)).toBeUndefined();
    });

    it("cleans up client when unregister cleanup function is called", () => {
      const req = new MockRequest() as unknown as Request;
      const res = new MockResponse() as unknown as Response;

      const unregister = hub.registerClient(req, res);
      expect(hub.getActiveCount()).toBe(1);

      unregister();
      expect(hub.getActiveCount()).toBe(0);

      // Idempotent unregister call
      expect(() => unregister()).not.toThrow();
      expect(hub.getActiveCount()).toBe(0);
    });

    it("cleans up client when res emits close event", () => {
      const req = new MockRequest() as unknown as Request;
      const res = new MockResponse() as unknown as Response;

      hub.registerClient(req, res);
      expect(hub.getActiveCount()).toBe(1);

      (res as unknown as MockResponse).emit("close");

      expect(hub.getActiveCount()).toBe(0);
    });
  });

  describe("Broadcasting & Heartbeats", () => {
    it("broadcasts event and JSON serialized data to all connected clients", () => {
      const clients = Array.from({ length: 3 }, () => ({
        req: new MockRequest() as unknown as Request,
        res: new MockResponse() as unknown as Response,
      }));

      for (const c of clients) {
        hub.registerClient(c.req, c.res);
      }
      expect(hub.getActiveCount()).toBe(3);

      const payload = {
        loomId: "loom-alpha-09",
        speedRpm: 1200,
        status: "weaving",
      };

      hub.broadcast("loom:status", payload);

      const expectedFrame = `event: loom:status\ndata: ${JSON.stringify(payload)}\n\n`;

      for (const c of clients) {
        const mockRes = c.res as unknown as MockResponse;
        expect(mockRes.writtenChunks).toContain(expectedFrame);
      }
    });

    it("prunes clients that fail during broadcast write", () => {
      const healthyReq = new MockRequest() as unknown as Request;
      const healthyRes = new MockResponse() as unknown as Response;

      const brokenReq = new MockRequest() as unknown as Request;
      const brokenRes = new MockResponse() as unknown as Response;
      (brokenRes as unknown as MockResponse).write = () => {
        throw new Error("EPIPE: broken pipe");
      };

      hub.registerClient(healthyReq, healthyRes);
      hub.registerClient(brokenReq, brokenRes);
      expect(hub.getActiveCount()).toBe(2);

      hub.broadcast("test", { msg: "hello" });

      expect(hub.getActiveCount()).toBe(1);
      expect(hub.getClientMetadata(healthyRes)).toBeUndefined();
    });

    it("sends SSE comment heartbeat to all connected clients", () => {
      const clients = Array.from({ length: 2 }, () => ({
        req: new MockRequest() as unknown as Request,
        res: new MockResponse() as unknown as Response,
      }));

      for (const c of clients) {
        hub.registerClient(c.req, c.res);
      }

      hub.sendHeartbeat();

      for (const c of clients) {
        const mockRes = c.res as unknown as MockResponse;
        expect(mockRes.writtenChunks).toContain(": ping\n\n");
      }
    });
  });

  describe("drainAll (SSE-02 Graceful Shutdown with Jitter)", () => {
    it("dispatches event: drain with default randomized backoff jitter [2000ms, 5000ms)", async () => {
      const clientCount = 5;
      const clients = Array.from({ length: clientCount }, () => ({
        req: new MockRequest() as unknown as Request,
        res: new MockResponse() as unknown as Response,
      }));

      for (const c of clients) {
        hub.registerClient(c.req, c.res);
      }
      expect(hub.getActiveCount()).toBe(clientCount);

      await hub.drainAll();

      // All clients must be ended and active count must be 0
      expect(hub.getActiveCount()).toBe(0);

      const reconnectDelays: number[] = [];

      for (const c of clients) {
        const mockRes = c.res as unknown as MockResponse;
        expect(mockRes.writableEnded).toBe(true);
        expect(mockRes.finished).toBe(true);

        const drainChunk = mockRes.writtenChunks.find((chunk) =>
          chunk.startsWith("event: drain\n"),
        );
        expect(drainChunk).toBeDefined();

        // Extract and parse the reconnectAfterMs from the drain payload
        const match = drainChunk?.match(/data:\s*(\{"reconnectAfterMs":\s*\d+\})/);
        expect(match).not.toBeNull();
        const parsed = JSON.parse(match![1]);

        expect(parsed.reconnectAfterMs).toBeGreaterThanOrEqual(2000);
        expect(parsed.reconnectAfterMs).toBeLessThan(5000);
        reconnectDelays.push(parsed.reconnectAfterMs);
      }

      // Assert that delay values are generated per-client (not all identical)
      const uniqueDelays = new Set(reconnectDelays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it("respects custom baseDelayMs and jitterMs bounds", async () => {
      const clients = Array.from({ length: 4 }, () => ({
        req: new MockRequest() as unknown as Request,
        res: new MockResponse() as unknown as Response,
      }));

      for (const c of clients) {
        hub.registerClient(c.req, c.res);
      }

      await hub.drainAll({ baseDelayMs: 10000, jitterMs: 500 });

      expect(hub.getActiveCount()).toBe(0);

      for (const c of clients) {
        const mockRes = c.res as unknown as MockResponse;
        const drainChunk = mockRes.writtenChunks.find((chunk) =>
          chunk.startsWith("event: drain\n"),
        );
        const match = drainChunk?.match(/data:\s*(\{"reconnectAfterMs":\s*\d+\})/);
        const parsed = JSON.parse(match![1]);

        expect(parsed.reconnectAfterMs).toBeGreaterThanOrEqual(10000);
        expect(parsed.reconnectAfterMs).toBeLessThan(10500);
      }
    });

    it("safely handles clients that throw or are closed during drain", async () => {
      const normalRes = new MockResponse() as unknown as Response;
      const normalReq = new MockRequest() as unknown as Request;

      const failingRes = new MockResponse() as unknown as Response;
      const failingReq = new MockRequest() as unknown as Request;
      (failingRes as unknown as MockResponse).write = () => {
        throw new Error("Socket already closed");
      };

      hub.registerClient(normalReq, normalRes);
      hub.registerClient(failingReq, failingRes);

      await expect(hub.drainAll()).resolves.not.toThrow();
      expect(hub.getActiveCount()).toBe(0);
      expect((normalRes as unknown as MockResponse).finished).toBe(true);
    });
  });

  describe("Realtime Factory Stream Endpoint Integration", () => {
    it("registers client with sseHub and streams initial factory telemetry", async () => {
      const { default: express } = await import("express");
      const http = await import("node:http");
      const { default: realtimeRouter } = await import("../../../routes/realtime.js");

      const app = express();
      app.use("/api/realtime", realtimeRouter);

      const server = http.createServer(app);
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;

      const receivedChunks: string[] = [];

      await new Promise<void>((resolve, reject) => {
        const req = http.get(
          `http://127.0.0.1:${port}/api/realtime/factory-stream?clientId=test-loom-stream`,
          (res) => {
            expect(res.headers["content-type"]).toBe("text/event-stream");
            expect(res.headers["cache-control"]).toBe("no-cache, no-transform");
            expect(res.headers.connection).toBe("keep-alive");
            expect(res.headers["x-accel-buffering"]).toBe("no");
            expect(sseHub.getActiveCount()).toBe(1);

            res.on("data", (chunk: Buffer) => {
              receivedChunks.push(chunk.toString());
              const combined = receivedChunks.join("");
              if (
                combined.includes(": connected") &&
                combined.includes("event: factory:telemetry")
              ) {
                req.destroy();
              }
            });

            res.on("close", () => {
              setTimeout(() => {
                expect(sseHub.getActiveCount()).toBe(0);
                server.close(() => resolve());
              }, 50);
            });
          },
        );

        req.on("error", (err: unknown) => {
          if ((err as { code?: string }).code === "ECONNRESET" || req.destroyed) {
            return;
          }
          reject(err);
        });
      });

      const streamOutput = receivedChunks.join("");
      expect(streamOutput).toContain(": connected\n\n");
      expect(streamOutput).toContain("event: factory:telemetry\n");
      expect(streamOutput).toContain("RUN APPAREL Sialkot Smart Factory (Line-04)");
      expect(streamOutput).toContain('"activeLooms":24');
    });
  });
});
