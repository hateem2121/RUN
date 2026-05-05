import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decrypt, encrypt, getBlindIndex } from "../../../lib/encryption";

vi.mock("../../../lib/monitoring/logger.js", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("Encryption Utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, ENCRYPTION_KEY: "test-secret-key-123" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("encrypt and decrypt", () => {
    it("should encrypt and then decrypt back to original text", () => {
      const text = "Hello RUN Remix";
      const encrypted = encrypt(text);
      expect(encrypted).toContain(":");
      expect(encrypted.split(":").length).toBe(3);

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(text);
    });

    it("should produce different IVs for same input", () => {
      const text = "Consistent Text";
      const enc1 = encrypt(text);
      const enc2 = encrypt(text);

      const iv1 = enc1.split(":")[0];
      const iv2 = enc2.split(":")[0];

      expect(iv1).not.toBe(iv2);
    });

    it("should throw error for invalid encrypted format", () => {
      expect(() => decrypt("invalid-format")).toThrow("Decryption failed");
    });
  });

  describe("getBlindIndex", () => {
    it("should generate a consistent hex hash", () => {
      const text = "User@Example.com ";
      const hash1 = getBlindIndex(text);
      const hash2 = getBlindIndex("user@example.com");

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should throw error if ENCRYPTION_KEY is missing", () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => getBlindIndex("test")).toThrow("Blind index generation failed");
    });
  });
});
