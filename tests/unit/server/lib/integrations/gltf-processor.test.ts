import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getGLTFProcessor,
  isGLTFFile,
} from "../../../../../server/lib/integrations/gltf-processor";

vi.mock("../../../../../server/monitoring/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn((...args) => console.log("WARN:", ...args)),
    error: vi.fn(),
  },
  serializeError: vi.fn((e) => e?.message || "Error"),
}));

// Mock fetch for embedding tests
global.fetch = vi.fn();

// Create a mock document for NodeIO to return
class MockDocument {
  private textures: any[] = [];
  private buffers: any[] = [];

  constructor(textures: any[] = [], buffers: any[] = []) {
    this.textures = textures;
    this.buffers = buffers;
  }

  getRoot() {
    return {
      listTextures: () => this.textures,
      listBuffers: () => this.buffers,
    };
  }

  transform() {
    return Promise.resolve(this);
  }
}

const mockReadBinary = vi.fn().mockResolvedValue(new MockDocument());
const mockReadJSON = vi.fn().mockResolvedValue(new MockDocument());
const mockWriteBinary = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));

vi.mock("@gltf-transform/core", async () => {
  const actual = await vi.importActual("@gltf-transform/core");

  return {
    ...(actual as any),
    NodeIO: class {
      registerExtensions() {
        return this;
      }
      readBinary = mockReadBinary;
      readJSON = mockReadJSON;
      writeBinary = mockWriteBinary;
    },
  };
});

describe("GLTFProcessor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadBinary.mockResolvedValue(new MockDocument());
    mockReadJSON.mockResolvedValue(new MockDocument());
    mockWriteBinary.mockResolvedValue(new Uint8Array([1, 2, 3]));
  });

  describe("isGLTFFile", () => {
    it("should correctly identify valid MIME types", () => {
      expect(isGLTFFile("model/gltf+json", "test.gltf")).toBe(true);
      expect(isGLTFFile("model/gltf-binary", "test.glb")).toBe(true);
      expect(isGLTFFile("application/octet-stream", "test.glb")).toBe(true);
      expect(isGLTFFile("application/json", "test.gltf")).toBe(true);
    });

    it("should correctly identify valid file extensions", () => {
      expect(isGLTFFile("text/plain", "test.gltf")).toBe(true);
      expect(isGLTFFile("text/plain", "TEST.GLB")).toBe(true);
    });

    it("should reject invalid files", () => {
      expect(isGLTFFile("image/jpeg", "test.jpg")).toBe(false);
      expect(isGLTFFile("text/plain", "test.txt")).toBe(false);
    });
  });

  describe("getGLTFProcessor", () => {
    it("should return a singleton instance", () => {
      const processor1 = getGLTFProcessor();
      const processor2 = getGLTFProcessor();
      expect(processor1).toBe(processor2);
    });
  });

  describe("validateGLTF", () => {
    it("should handle GLB binary format", async () => {
      const processor = getGLTFProcessor();

      // Magic bytes for GLB: glTF
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46, 0x00, 0x00, 0x00, 0x00]);

      const result = await processor.validateGLTF(buffer);

      expect(mockReadBinary).toHaveBeenCalled();
      expect(result.isValid).toBe(true);
      expect(result.hasExternalReferences).toBe(false);
    });

    it("should handle JSON format", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from(JSON.stringify({ asset: { version: "2.0" } }));

      const result = await processor.validateGLTF(buffer);

      expect(mockReadJSON).toHaveBeenCalled();
      expect(result.isValid).toBe(true);
    });

    it("should fail on invalid JSON", async () => {
      const processor = getGLTFProcessor();
      // Valid JSON but missing asset.version
      const buffer = Buffer.from(JSON.stringify({ asset: {} }));

      mockReadBinary.mockRejectedValueOnce(new Error("binary parse error"));

      const result = await processor.validateGLTF(buffer);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("missing required asset.version field");
    });

    it("should fall back to binary if JSON parsing fails", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from("not valid json");

      mockReadBinary.mockResolvedValueOnce(new MockDocument() as any);

      const result = await processor.validateGLTF(buffer);
      expect(result.isValid).toBe(true);
    });

    it("should detect external texture references", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46]); // GLB format

      mockReadBinary.mockResolvedValueOnce(
        new MockDocument([
          { getURI: () => "https://external.com/texture.jpg" },
          { getURI: () => "data:image/png;base64,123" },
        ]) as any,
      );

      const result = await processor.validateGLTF(buffer);

      expect(result.isValid).toBe(true);
      expect(result.hasExternalReferences).toBe(true);
      expect(result.externalReferences).toContain("https://external.com/texture.jpg");
    });

    it("should detect external buffer references", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46]);

      mockReadBinary.mockResolvedValueOnce(
        new MockDocument([], [{ getURI: () => "external.bin" }]) as any,
      );

      const result = await processor.validateGLTF(buffer);

      expect(result.isValid).toBe(true);
      expect(result.hasExternalReferences).toBe(true);
      expect(result.externalReferences).toContain("external.bin");
    });
  });

  describe("validateForUpload", () => {
    it("should return valid if no external references", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46]);

      const result = await processor.validateForUpload(buffer);
      expect(result.valid).toBe(true);
    });

    it("should return invalid if validation fails entirely", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from("invalid data that is neither json nor glb");

      mockReadBinary.mockRejectedValueOnce(new Error("binary parse error"));

      const result = await processor.validateForUpload(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("binary parse error");
    });

    it("should return invalid if has external references", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46]);

      mockReadBinary.mockResolvedValueOnce(
        new MockDocument([{ getURI: () => "https://external.com/tex.jpg" }]) as any,
      );

      const result = await processor.validateForUpload(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("external texture references");
    });
  });

  describe("validateForProductionUpload", () => {
    it("should return valid if no external references", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46]);

      const result = await processor.validateForProductionUpload(buffer);
      expect(result.valid).toBe(true);
    });

    it("should return invalid if has external references", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46]);

      mockReadBinary.mockResolvedValueOnce(
        new MockDocument([{ getURI: () => "https://external.com/tex.jpg" }]) as any,
      );

      const result = await processor.validateForProductionUpload(buffer);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("external references");
    });
  });

  describe("embedTextures", () => {
    it("should embed external textures if fetch succeeds", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46]);

      const mockTexture = {
        getURI: () => "texture.jpg",
        setImage: vi.fn(),
        setMimeType: vi.fn(),
        setURI: vi.fn(),
      };

      mockReadBinary.mockResolvedValueOnce(new MockDocument([mockTexture]) as any);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
        headers: { get: vi.fn().mockReturnValue("image/jpeg") },
      } as any);

      const result = await processor.embedTextures(buffer, "https://example.com");

      expect(result.success).toBe(true);
      expect(result.texturesEmbedded).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith("https://example.com/texture.jpg");
      expect(mockTexture.setImage).toHaveBeenCalled();
      expect(mockTexture.setURI).toHaveBeenCalledWith("");
    });

    it("should not strip textures if fetch fails", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46]);

      const mockTexture = {
        getURI: () => "texture.jpg",
        setImage: vi.fn(),
        setMimeType: vi.fn(),
        setURI: vi.fn(),
      };

      mockReadBinary.mockResolvedValueOnce(new MockDocument([mockTexture]) as any);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
      } as any);

      const result = await processor.embedTextures(buffer, "https://example.com");

      expect(result.success).toBe(true);
      expect(result.texturesEmbedded).toBe(0);
      expect(mockTexture.setImage).not.toHaveBeenCalled();
      expect(mockTexture.setURI).not.toHaveBeenCalled(); // Important: doesn't strip
    });

    it("should handle buffer fetch success", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46]);

      const mockBuffer = {
        getURI: () => "data.bin",
        setURI: vi.fn(),
      };

      mockReadBinary.mockResolvedValueOnce(new MockDocument([], [mockBuffer]) as any);

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(4),
      } as any);

      await processor.embedTextures(buffer, "https://example.com");

      expect(mockBuffer.setURI).toHaveBeenCalledWith(
        expect.stringContaining("data:application/octet-stream;base64,"),
      );
    });

    it("should fallback to JSON if binary parsing fails during embed", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from(JSON.stringify({ asset: { version: "2.0" } }));

      mockReadBinary.mockRejectedValueOnce(new Error("fail"));
      mockReadJSON.mockResolvedValueOnce(new MockDocument() as any);

      const result = await processor.embedTextures(buffer);
      expect(result.success).toBe(true);
    });

    it("should handle complete failure and return original buffer", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from("invalid");

      mockReadBinary.mockRejectedValueOnce(new Error("fail 1"));
      mockReadJSON.mockRejectedValueOnce(new Error("fail 2"));

      const result = await processor.embedTextures(buffer);
      expect(result.success).toBe(false);
      expect(result.processedBuffer).toBe(buffer);
    });
  });

  describe("processForUpload", () => {
    it("should reject invalid files immediately", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from("completely invalid");

      mockReadBinary.mockRejectedValueOnce(new Error("fail 1"));
      mockReadJSON.mockRejectedValueOnce(new Error("fail 2"));

      const result = await processor.processForUpload(buffer);
      expect(result.success).toBe(false);
    });

    it("should process valid files", async () => {
      const processor = getGLTFProcessor();
      const buffer = Buffer.from([0x67, 0x6c, 0x54, 0x46]);

      const result = await processor.processForUpload(buffer);
      expect(result.success).toBe(true);
    });
  });
});
