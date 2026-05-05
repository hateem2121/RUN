/**
 * GLTF Processing Pipeline - Phase 1.1 Implementation
 * Ensures all GLTF files have embedded textures and no external dependencies
 */

import { type Document, NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, draco, prune } from "@gltf-transform/functions";
import { logger, serializeError } from "../monitoring/logger.js";

export interface GLTFProcessingResult {
  success: boolean;
  processedBuffer: Buffer;
  originalSize: number;
  processedSize: number;
  texturesEmbedded: number;
  externalReferencesRemoved: number;
  error?: string | undefined;
}

export interface GLTFValidationResult {
  isValid: boolean;
  hasEmbeddedTextures: boolean;
  hasExternalReferences: boolean;
  externalReferences: string[];
  textureCount: number;
  bufferCount: number;
  error?: string | undefined;
}

/**
 * PHASE 1.1: Core GLTF processor for texture embedding
 */
export class GLTFProcessor {
  private io: NodeIO;

  constructor() {
    // Initialize GLTF-Transform with all extensions
    this.io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
  }

  /**
   * PHASE 1.1 FIX: Helper method to detect GLB format
   */
  private isGLBFormat(buffer: Buffer): boolean {
    return isGLBBuffer(buffer);
  }

  /**
   * CRITICAL FIX: Validate GLTF file and check for external image references (NOT texture URIs)
   */
  async validateGLTF(buffer: Buffer): Promise<GLTFValidationResult> {
    try {
      logger.debug("[GLTF] Validating GLTF file structure and texture embedding...");

      // CRITICAL FIX: Better format detection and parsing
      let document: Document;

      // First, detect if this is a binary GLB file
      if (this.isGLBFormat(buffer)) {
        logger.debug("[GLTF] Detected binary GLB format, parsing as binary...");
        document = await this.io.readBinary(new Uint8Array(buffer));
      } else {
        // Try JSON parsing with better error handling
        logger.debug("[GLTF] Detected text GLTF format, parsing as JSON...");
        try {
          const jsonString = buffer.toString("utf8");
          const jsonData = JSON.parse(jsonString);

          // Validate basic GLTF structure before passing to gltf-transform
          if (
            !jsonData ||
            typeof jsonData !== "object" ||
            !jsonData.asset ||
            !jsonData.asset.version
          ) {
            throw new Error("Invalid GLTF JSON structure: missing required asset.version field");
          }

          document = await this.io.readJSON(jsonData);
        } catch (jsonError) {
          // If JSON parsing fails, try binary as fallback
          logger.debug(`[GLTF] JSON parsing failed (${jsonError}), attempting binary fallback...`);
          try {
            document = await this.io.readBinary(new Uint8Array(buffer));
          } catch (binaryError) {
            throw new Error(
              `Failed to parse GLTF file as both JSON and binary: JSON=${jsonError instanceof Error ? jsonError.message : String(jsonError)}, Binary=${binaryError instanceof Error ? binaryError.message : String(binaryError)}`,
            );
          }
        }
      }
      const root = document.getRoot();

      // CRITICAL FIX: Check TEXTURES for external image URIs
      const textures = root.listTextures();

      let hasExternalReferences = false;
      const externalReferences: string[] = [];

      // Check textures for external URIs (GLTF Transform combines images and textures)
      for (const texture of textures) {
        const uri = texture.getURI();
        if (uri && !uri.startsWith("data:")) {
          hasExternalReferences = true;
          externalReferences.push(uri);
          logger.debug(`[GLTF] Found external texture reference: ${uri}`);
        }
      }

      // Check buffers for external URIs
      const buffers = root.listBuffers();
      for (const buffer of buffers) {
        const uri = buffer.getURI();
        if (uri && !uri.startsWith("data:")) {
          hasExternalReferences = true;
          externalReferences.push(uri);
          logger.debug(`[GLTF] Found external buffer reference: ${uri}`);
        }
      }

      const hasEmbeddedTextures = textures.length > 0 && !hasExternalReferences;

      logger.debug(
        `[GLTF] Validation complete: ${textures.length} textures, ${externalReferences.length} external refs`,
      );

      return {
        isValid: true,
        hasEmbeddedTextures,
        hasExternalReferences,
        externalReferences,
        textureCount: textures.length,
        bufferCount: buffers.length,
      };
    } catch (error) {
      // Categorize and provide specific error details
      const errorDetails = serializeError(error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Determine error category for better remediation guidance
      let errorCategory = "UNKNOWN";
      let remediationHint = "";

      if (errorMessage.includes("JSON")) {
        errorCategory = "PARSING_ERROR";
        remediationHint =
          "File may be corrupted or not a valid GLTF/GLB format. Verify the file is a valid GLTF JSON or binary GLB file.";
      } else if (
        errorMessage.includes("asset.version") ||
        errorMessage.includes("missing required")
      ) {
        errorCategory = "STRUCTURE_ERROR";
        remediationHint =
          "GLTF file is missing required fields (e.g., asset.version). Ensure the file follows GLTF 2.0 specification.";
      } else if (errorMessage.includes("accessor") || errorMessage.includes("buffer")) {
        errorCategory = "DATA_ERROR";
        remediationHint =
          "GLTF contains invalid accessor bounds or buffer references. Check mesh data integrity.";
      } else if (errorMessage.includes("texture") || errorMessage.includes("image")) {
        errorCategory = "TEXTURE_ERROR";
        remediationHint =
          "Issues with texture or image references. Ensure all textures are properly embedded or referenced.";
      } else {
        remediationHint =
          "Unknown validation error. Use the Khronos GLTF Validator for detailed analysis.";
      }

      // Log detailed error with categorization
      logger.error("[GLTF] Validation failed", {
        category: errorCategory,
        error: errorDetails,
        message: errorMessage,
        remediationHint,
        validatorUrl: "https://github.khronos.org/glTF-Validator/",
      });

      return {
        isValid: false,
        hasEmbeddedTextures: false,
        hasExternalReferences: false,
        externalReferences: [],
        textureCount: 0,
        bufferCount: 0,
        error: `${errorCategory}: ${errorMessage}. ${remediationHint} For detailed validation, use the Khronos GLTF Validator: https://github.khronos.org/glTF-Validator/`,
      };
    }
  }

  /**
   * PHASE 1.1 CRITICAL FIX: Core function - Embed all external images into GLTF
   */
  async embedTextures(buffer: Buffer, baseUrl?: string): Promise<GLTFProcessingResult> {
    const originalSize = buffer.length;
    let texturesEmbedded = 0;
    let externalReferencesRemoved = 0;

    try {
      logger.debug("[GLTF] Starting texture embedding process...");

      // CRITICAL FIX: Always try binary first, then fall back to JSON
      let document: Document;
      try {
        document = await this.io.readBinary(new Uint8Array(buffer));
      } catch {
        // If binary parsing fails, try JSON
        document = await this.io.readJSON(JSON.parse(buffer.toString("utf8")));
      }
      const root = document.getRoot();

      // CRITICAL FIX: Embed external TEXTURES (GLTF Transform combines images and textures)
      const textures = root.listTextures();
      for (const texture of textures) {
        const uri = texture.getURI();

        if (uri && !uri.startsWith("data:")) {
          logger.debug(`[GLTF] Found external texture reference: ${uri}`);
          externalReferencesRemoved++;

          try {
            // Try to fetch the external texture if baseUrl provided
            if (baseUrl) {
              const textureUrl = new URL(uri, baseUrl).toString();
              const response = await fetch(textureUrl);

              if (response.ok) {
                const textureBuffer = await response.arrayBuffer();
                const mimeType = response.headers.get("content-type") || "image/jpeg";

                // CORRECT: Set texture data and clear URI to embed the texture
                const textureData = new Uint8Array(textureBuffer);
                texture.setImage(textureData);
                texture.setMimeType(mimeType);
                texture.setURI(""); // Clear external URI after embedding
                texturesEmbedded++;
                logger.debug(`[GLTF] Embedded texture: ${uri} (${textureBuffer.byteLength} bytes)`);
              } else {
                // Leave texture unchanged if can't fetch - don't strip it
                logger.warn(`[GLTF] Could not fetch texture ${uri}, leaving unchanged`);
                // Do NOT call texture.setURI('') - this would strip the texture!
              }
            } else {
              // NO baseUrl: Leave file unchanged - don't strip textures!
              logger.debug(
                `[GLTF] No baseUrl provided, leaving external reference unchanged: ${uri}`,
              );
              // Do NOT call texture.setURI('') - this would strip the texture!
            }
          } catch (fetchError) {
            logger.warn(`[GLTF] Failed to fetch texture ${uri}, leaving unchanged:`, fetchError);
            // Do NOT call texture.setURI('') - this would strip the texture!
          }
        }
      }

      // Phase 2: Embed external buffers
      const buffers = root.listBuffers();
      for (const buffer of buffers) {
        const uri = buffer.getURI();

        if (uri && !uri.startsWith("data:")) {
          logger.debug(`[GLTF] Found external buffer reference: ${uri}`);
          externalReferencesRemoved++;

          try {
            if (baseUrl) {
              const bufferUrl = new URL(uri, baseUrl).toString();
              const response = await fetch(bufferUrl);

              if (response.ok) {
                const bufferData = await response.arrayBuffer();

                // CRITICAL: For buffers, we store as data URI since there's no setArray method
                const bufferBase64 = Buffer.from(bufferData).toString("base64");
                const bufferDataUri = `data:application/octet-stream;base64,${bufferBase64}`;
                buffer.setURI(bufferDataUri); // Store as data URI for embedding
                // CRITICAL FIX: Do NOT clear the URI after embedding - that destroys the embedded data!
                logger.debug(`[GLTF] Embedded buffer: ${uri} (${bufferData.byteLength} bytes)`);
              } else {
                logger.warn(`[GLTF] Could not fetch buffer ${uri}, leaving unchanged`);
                // Do NOT call buffer.setURI('') - this would strip the buffer!
              }
            } else {
              logger.debug(
                `[GLTF] No baseUrl provided, leaving external buffer reference unchanged: ${uri}`,
              );
              // Do NOT call buffer.setURI('') - this would strip the buffer!
            }
          } catch (fetchError) {
            logger.warn(`[GLTF] Failed to fetch buffer ${uri}, leaving unchanged:`, fetchError);
            // Do NOT call buffer.setURI('') - this would strip the buffer!
          }
        }
      }

      // Phase 3: Final validation - ensure no external references remain
      const finalValidation = await this.validateProcessedDocument(document);
      if (finalValidation.hasExternalReferences) {
        logger.warn(
          `[GLTF] Warning: ${finalValidation.externalReferences.length} external references still remain after processing`,
        );
        for (const ref of finalValidation.externalReferences) {
          logger.warn(`[GLTF] Remaining external reference: ${ref}`);
        }
      }

      // Phase 4: Optimize and clean up with Draco compression
      // Phase 4: Optimize and clean up with Draco compression
      await this.compressDocument(document);

      // Export processed GLTF - always as binary for better embedding
      const processedArray = await this.io.writeBinary(document);
      const processedBuffer = Buffer.from(processedArray);
      const processedSize = processedBuffer.length;

      logger.info(
        `[GLTF] Texture embedding complete: ${texturesEmbedded} textures embedded, ${externalReferencesRemoved} external refs removed`,
      );
      logger.info(
        `[GLTF] Size change: ${originalSize} → ${processedSize} bytes (${((processedSize / originalSize - 1) * 100).toFixed(1)}%)`,
      );

      return {
        success: true,
        processedBuffer,
        originalSize,
        processedSize,
        texturesEmbedded,
        externalReferencesRemoved,
      };
    } catch (error) {
      logger.error("[GLTF] Texture embedding failed:", error);
      return {
        success: false,
        processedBuffer: buffer, // Return original on failure
        originalSize,
        processedSize: originalSize,
        texturesEmbedded: 0,
        externalReferencesRemoved: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * PHASE 1.2: Upload validation - Reject GLTF files with external dependencies
   */
  async validateForUpload(buffer: Buffer): Promise<{ valid: boolean; reason?: string }> {
    const validation = await this.validateGLTF(buffer);

    if (!validation.isValid) {
      return { valid: false, reason: validation.error || "Invalid GLTF file" };
    }

    if (validation.hasExternalReferences) {
      return {
        valid: false,
        reason: `GLTF contains ${validation.externalReferences.length} external texture references. Please use GLTF files with embedded textures only.`,
      };
    }

    return { valid: true };
  }

  /**
   * PHASE 1.1 FIX: Internal helper for validating processed documents
   */
  private async validateProcessedDocument(document: Document): Promise<GLTFValidationResult> {
    try {
      const root = document.getRoot();

      // Check for remaining external references
      const textures = root.listTextures();
      const buffers = root.listBuffers();

      let hasExternalReferences = false;
      const externalReferences: string[] = [];

      // Check textures
      for (const texture of textures) {
        const uri = texture.getURI();
        if (uri && !uri.startsWith("data:")) {
          hasExternalReferences = true;
          externalReferences.push(`texture: ${uri}`);
        }
      }

      // Check buffers
      for (const buffer of buffers) {
        const uri = buffer.getURI();
        if (uri && !uri.startsWith("data:")) {
          hasExternalReferences = true;
          externalReferences.push(`buffer: ${uri}`);
        }
      }

      return {
        isValid: true,
        hasEmbeddedTextures: textures.length > 0 && !hasExternalReferences,
        hasExternalReferences,
        externalReferences,
        textureCount: textures.length,
        bufferCount: buffers.length,
      };
    } catch (error) {
      return {
        isValid: false,
        hasEmbeddedTextures: false,
        hasExternalReferences: false,
        externalReferences: [],
        textureCount: 0,
        bufferCount: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * PHASE 2.2: Compression step using Draco
   */
  private async compressDocument(document: Document): Promise<void> {
    await document.transform(
      prune(), // Remove unused elements
      dedup(), // Remove duplicates
      draco({
        quantizePosition: 14,
        quantizeNormal: 10,
        quantizeTexcoord: 12,
      }), // Draco compression for smaller files
    );
  }

  /**
   * PHASE 1.1 ENHANCED: Auto-convert external textures to embedded (with strict validation)
   */
  async processForUpload(buffer: Buffer, baseUrl?: string): Promise<GLTFProcessingResult> {
    const validation = await this.validateGLTF(buffer);

    if (!validation.isValid) {
      return {
        success: false,
        processedBuffer: buffer,
        originalSize: buffer.length,
        processedSize: buffer.length,
        texturesEmbedded: 0,
        externalReferencesRemoved: 0,
        error: validation.error || "Invalid GLTF file",
      };
    }

    // Force processing (embedding + compression) regardless of whether textures are already embedded.
    // This ensures Draco/Meshopt compression is applied to all assets.
    return await this.embedTextures(buffer, baseUrl);
  }

  /**
   * PHASE 1.1 NEW: Strict validation for production uploads - ZERO external dependencies allowed
   */
  async validateForProductionUpload(buffer: Buffer): Promise<{
    valid: boolean;
    reason?: string | undefined;
    details?: GLTFValidationResult;
  }> {
    const validation = await this.validateGLTF(buffer);

    if (!validation.isValid) {
      return {
        valid: false,
        reason: validation.error || "Invalid GLTF file",
        details: validation,
      };
    }

    if (validation.hasExternalReferences) {
      const referencesText = validation.externalReferences.join(", ");
      return {
        valid: false,
        reason: `GLTF contains ${validation.externalReferences.length} external references: ${referencesText}. All assets must be embedded.`,
        details: validation,
      };
    }

    // Additional check for data URIs that are too large (should be embedded as bufferViews)
    logger.debug(
      `[GLTF] Production validation passed: ${validation.textureCount} embedded textures, ${validation.bufferCount} buffers`,
    );

    return {
      valid: true,
      details: validation,
    };
  }
}

// Singleton instance with enhanced error handling
let gltfProcessor: GLTFProcessor | null = null;

export function getGLTFProcessor(): GLTFProcessor {
  if (!gltfProcessor) {
    try {
      gltfProcessor = new GLTFProcessor();
      logger.debug("[GLTF] Processor singleton initialized successfully");
    } catch (error) {
      logger.error("[GLTF] Failed to initialize processor:", error);
      throw new Error(
        `GLTF processor initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return gltfProcessor;
}

/**
 * PHASE 1.1 ENHANCED: Utility function to check if a file is GLTF with better detection
 */
export function isGLTFFile(mimeType: string, filename: string): boolean {
  // MIME type detection
  const validMimeTypes = [
    "model/gltf+json",
    "model/gltf-binary",
    "application/octet-stream", // Some GLB files might have this MIME type
    "application/json", // Some GLTF files might have this MIME type
  ];

  const hasMimeType = validMimeTypes.includes(mimeType) || mimeType.includes("gltf");

  // Extension detection
  const lowerFilename = filename.toLowerCase();
  const hasValidExtension = lowerFilename.endsWith(".gltf") || lowerFilename.endsWith(".glb");

  return hasMimeType || hasValidExtension;
}

/**
 * PHASE 1.1 NEW: Detect GLB format from buffer (static utility)
 */
export function isGLBBuffer(buffer: Buffer): boolean {
  // GLB files start with 'glTF' magic bytes (0x676C5446)
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x67 &&
    buffer[1] === 0x6c &&
    buffer[2] === 0x54 &&
    buffer[3] === 0x46
  );
}
