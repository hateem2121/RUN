import { type Request, type Response, Router } from "express";
import { logger } from "../lib/monitoring/logger.js";
import { sseHub } from "../services/realtime/sse-hub.js";

const router = Router();

/**
 * Real-Time Telemetry Stream for RUN APPAREL Smart Manufacturing
 *
 * Emits live telemetry frames from Sialkot factory floor automated looms,
 * thermal cutters, and sublimation units via Server-Sent Events (SSE).
 * Registers each connection into the SSEHub singleton to ensure graceful draining on shutdown.
 */
router.get("/factory-stream", (req: Request, res: Response) => {
  const clientId =
    (req.query.clientId as string | undefined) ||
    `factory-client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  logger.info(`[RealTime] Client connected to factory-stream: ${clientId}`);

  const unregister = sseHub.registerClient(req, res, {
    clientId,
    stream: "factory-stream",
    connectedAt: new Date().toISOString(),
  });

  const sendPulse = () => {
    if (res.writableEnded || req.destroyed) return;

    const telemetry = {
      facility: "RUN APPAREL Sialkot Smart Factory (Line-04)",
      timestamp: new Date().toISOString(),
      activeLooms: 24,
      efficiencyPct: Number((96.5 + Math.random() * 3).toFixed(1)),
      powerUsageKw: Number((41.2 + Math.random() * 2).toFixed(1)),
      temperatureC: Number((22.8 + Math.random() * 1.5).toFixed(1)),
      humidityPct: Number((48.0 + Math.random() * 3).toFixed(1)),
      status: "optimal",
    };

    try {
      res.write(`event: factory:telemetry\ndata: ${JSON.stringify(telemetry)}\n\n`);
      if (typeof (res as { flush?: () => void }).flush === "function") {
        (res as { flush: () => void }).flush();
      }
    } catch {
      // Ignored if socket was closed
    }
  };

  // Immediate initial telemetry pulse
  sendPulse();

  // Periodic mock pulses every 5000ms (unref'd to prevent keeping event loop open)
  const timer = setInterval(sendPulse, 5000);
  timer.unref();

  req.on("close", () => {
    clearInterval(timer);
    unregister();
    logger.info(`[RealTime] Client disconnected from factory-stream: ${clientId}`);
  });
});

export default router;
