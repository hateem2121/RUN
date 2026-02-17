import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { logger } from "../lib/monitoring/logger.js";

// Algorithm: AES-256-GCM (Authenticated Encryption)
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Derives a 32-byte key from the environment variable.
 */
function getDerivedKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("ENCRYPTION_KEY is not defined");
  }
  // Use SHA-256 to ensure we always have exactly 32 bytes
  return createHash("sha256").update(rawKey).digest();
}

/**
 * Encrypts a string using AES-256-GCM
 * @param text The plain text to encrypt
 * @returns format: iv:authTag:encryptedText (hex encoded)
 */
export function encrypt(text: string): string {
  try {
    const key = getDerivedKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    logger.error("Encryption failed:", error);
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypts a string using AES-256-GCM
 * @param encryptedText format: iv:authTag:encryptedText (hex encoded)
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getDerivedKey();
    const parts = encryptedText.split(":");

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format");
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error("Invalid encrypted text components");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("Decryption failed:", error);
    throw new Error("Decryption failed");
  }
}

/**
 * Generates a Blind Index (searchable hash) for a piece of data.
 * Uses HMAC-SHA256 with the derived key.
 * Canonicalizes data (lowercase, trimmed) to ensure consistent searching.
 */
export function getBlindIndex(text: string): string {
  try {
    const key = getDerivedKey();
    const canonicalText = text.toLowerCase().trim();
    return createHmac("sha256", key).update(canonicalText).digest("hex");
  } catch (error) {
    logger.error("Blind index generation failed:", error);
    throw new Error("Blind index generation failed");
  }
}
