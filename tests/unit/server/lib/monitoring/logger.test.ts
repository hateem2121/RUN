import { describe, it, expect, vi, beforeEach } from "vitest";
import pino from "pino";
import { logger, serializeError } from "../../../../../server/lib/monitoring/logger";

vi.mock("pino", () => {
  const pinoInstance = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };
  return {
    default: vi.fn(() => pinoInstance),
    stdSerializers: {
      err: vi.fn(),
      req: vi.fn(),
      res: vi.fn(),
    }
  };
});

describe("logger", () => {
  const pinoMock = vi.mocked(pino).mock.results[0]?.value;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SmartLogger", () => {
    it("logs info messages with metadata", () => {
      logger.info("Test message", { key: "value" });
      expect(pinoMock?.info).toHaveBeenCalled();
    });

    it("logs error messages with Error objects", () => {
      const error = new Error("Test error");
      logger.error("Something failed", { context: "test" }, error);
      expect(pinoMock?.error).toHaveBeenCalled();
    });

    it("logs debug messages", () => {
      logger.debug("Debug msg");
      expect(pinoMock?.debug).toHaveBeenCalled();
    });
    
    it("logs warn messages", () => {
      logger.warn("Warn msg");
      expect(pinoMock?.warn).toHaveBeenCalled();
    });
  });

  describe("serializeError", () => {
    it("extracts details from Error objects", () => {
      const error = new Error("Test error");
      const serialized = serializeError(error);
      expect(serialized).toHaveProperty("name", "Error");
      expect(serialized).toHaveProperty("message", "Test error");
      expect(serialized).toHaveProperty("stack");
    });

    it("handles string errors", () => {
      const serialized = serializeError("String error");
      expect(serialized).toEqual({ error: "String error" });
    });

    it("handles cyclic objects safely", () => {
      const obj: any = {};
      obj.self = obj;
      const serialized = serializeError(obj);
      expect(serialized.error).toBeDefined();
    });
  });
});
