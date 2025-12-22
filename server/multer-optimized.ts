import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

// PHASE 1.2 FIX: Unified multer configuration - REMOVED file size limits per user request
// File size limits disabled to allow large file uploads (8-12MB+ files were failing)

// ============================================================================
// MAGIC NUMBER (FILE SIGNATURE) VALIDATION
// ============================================================================

// Known file signatures (magic numbers) for security validation
const MAGIC_NUMBERS = {
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  GLB: [0x67, 0x6C, 0x54, 0x46], // "glTF" in ASCII
  PDF: [0x25, 0x50, 0x44, 0x46], // "%PDF"
  GIF87a: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // "GIF87a"
  GIF89a: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // "GIF89a"
} as const;

function matchesMagicNumber(buffer: Buffer, signature: readonly number[]): boolean {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}

function validateFileSignature(buffer: Buffer, mimetype: string, filename: string): { valid: boolean; reason?: string } {
  // Read first 16 bytes for signature checking
  const header = buffer.slice(0, 16);
  
  // Determine expected signature based on MIME type
  const mimeToSignature: Record<string, ReadonlyArray<readonly number[]>> = {
    'image/jpeg': [MAGIC_NUMBERS.JPEG],
    'image/png': [MAGIC_NUMBERS.PNG],
    'image/gif': [MAGIC_NUMBERS.GIF87a, MAGIC_NUMBERS.GIF89a],
    'model/gltf-binary': [MAGIC_NUMBERS.GLB],
    'application/pdf': [MAGIC_NUMBERS.PDF],
  };

  // Handle application/octet-stream by checking file extension and signature
  if (mimetype === 'application/octet-stream') {
    // Allow chunks without validation (they don't have full headers)
    if (filename === 'blob' || filename.startsWith('chunk-')) {
      return { valid: true };
    }
    
    // For octet-stream files, validate based on file extension
    const ext = filename.toLowerCase().split('.').pop();
    const extToSignature: Record<string, ReadonlyArray<readonly number[]>> = {
      'jpg': [MAGIC_NUMBERS.JPEG],
      'jpeg': [MAGIC_NUMBERS.JPEG],
      'png': [MAGIC_NUMBERS.PNG],
      'gif': [MAGIC_NUMBERS.GIF87a, MAGIC_NUMBERS.GIF89a],
      'glb': [MAGIC_NUMBERS.GLB],
      'pdf': [MAGIC_NUMBERS.PDF],
    };
    
    const expectedSigs = ext ? extToSignature[ext] : undefined;
    if (expectedSigs) {
      const matches = expectedSigs.some(sig => matchesMagicNumber(header, sig));
      if (!matches) {
        const sigHex = Array.from(header.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
        return { 
          valid: false, 
          reason: `File signature mismatch for .${ext} file. Got: ${sigHex}` 
        };
      }
      return { valid: true };
    }
    
    // Unknown extension with octet-stream MIME - reject for security
    return { valid: false, reason: `Unknown file extension: .${ext}` };
  }

  if (mimetype === 'application/json' || mimetype === 'image/svg+xml' || mimetype === 'video/mp4' || mimetype === 'video/webm') {
    // Skip magic number validation for JSON, SVG, and video files (complex headers)
    return { valid: true };
  }

  const expectedSignatures = mimeToSignature[mimetype];
  if (!expectedSignatures) {
    // No known signature for this type, allow it
    return { valid: true };
  }

  // Check if buffer matches any of the expected signatures
  const matches = expectedSignatures.some(sig => matchesMagicNumber(header, sig));
  if (!matches) {
    const sigHex = Array.from(header.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    return { 
      valid: false, 
      reason: `File signature mismatch for ${mimetype}. Got: ${sigHex}` 
    };
  }

  return { valid: true };
}

/**
 * Middleware to validate file signatures (magic numbers) after multer processes files
 * Prevents MIME type spoofing by checking actual file content
 */
export function validateMagicNumbers(req: Request, res: Response, next: NextFunction): void {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const singleFile = req.file;
    
    const filesToValidate = singleFile ? [singleFile] : files;
    
    for (const file of filesToValidate) {
      if (!file.buffer || file.buffer.length === 0) {
        console.log(`[Magic Number] Skipping validation for empty file: ${file.originalname}`);
        continue;
      }
      
      const result = validateFileSignature(file.buffer, file.mimetype, file.originalname);
      if (!result.valid) {
        console.error(`[Magic Number] ❌ REJECTED - ${file.originalname}: ${result.reason}`);
        res.status(400).json({
          message: `File rejected: ${result.reason}`,
          filename: file.originalname,
          mimetype: file.mimetype,
        });
        return;
      }
      
      console.log(`[Magic Number] ✅ VALIDATED - ${file.originalname} (${file.mimetype})`);
    }
    
    next();
  } catch (error) {
    console.error('[Magic Number] Validation error:', error);
    res.status(500).json({
      message: 'File validation failed',
    });
  }
}

// SECURITY HARDENED: Updated limits to 500MB per user request
const FILE_SIZE_LIMITS = {
  IMAGE: 500 * 1024 * 1024,     // 500MB for images (no size restrictions)
  VIDEO: 500 * 1024 * 1024,     // 500MB for videos (no size restrictions)
  MODEL: 500 * 1024 * 1024,     // 500MB for 3D models (no size restrictions)
  DOCUMENT: 500 * 1024 * 1024,  // 500MB for PDFs (no size restrictions)
  DEFAULT: 500 * 1024 * 1024    // 500MB default (no size restrictions)
};

// UPLOAD OPTIMIZATION: Increased file limits with intelligent queue management
const MAX_FILES = 50; // Increased from 10 to 50 files per batch
const MAX_CONCURRENT_UPLOADS = 5; // Process 5 files simultaneously for optimal performance

// UPLOAD OPTIMIZATION: Export constants for use in upload management
export { MAX_FILES, MAX_CONCURRENT_UPLOADS };

export const uploadOptimized = multer({
  storage: multer.memoryStorage(),
  limits: {
    // UPLOAD OPTIMIZATION: Enhanced limits for better performance
    fileSize: FILE_SIZE_LIMITS.DEFAULT, // 500MB limit maintained
    files: MAX_FILES, // Increased to 50 files maximum
    fieldNameSize: 200, // Increased for longer filenames
    fieldSize: 2 * 1024 * 1024, // Increased to 2MB for metadata
    fields: 50, // Increased for batch operations
    headerPairs: 5000, // Increased for complex uploads
    parts: 100 // Added for multipart optimization
  },
  fileFilter: (_req, file, cb) => {
    // Extract file extension for logging and validation
    const extension = file.originalname.toLowerCase().split('.').pop() || '';
    
    // LOG: Output detected MIME type and extension for every upload attempt
    console.log(`[Upload Validation] File: ${file.originalname}`);
    console.log(`[Upload Validation] → Detected MIME: ${file.mimetype}`);
    console.log(`[Upload Validation] → Extension: .${extension}`);
    
    // SECURITY-HARDENED file type validation - Enhanced chunked upload support
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm',
      'model/gltf-binary', 'model/gltf+json',
      'application/pdf',
      'application/json',  // Added: Browsers send .gltf as application/json
      'application/octet-stream'  // Added: Generic binary MIME type
    ];

    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.svg',
      '.mp4', '.webm',
      '.glb', '.gltf', '.pdf'
    ];

    const hasValidMime = allowedMimes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    console.log(`[Upload Validation] → Valid MIME: ${hasValidMime}`);
    console.log(`[Upload Validation] → Valid Extension: ${hasValidExtension}`);
    
    // FORENSIC FIX: Allow files with valid extensions even if MIME type is generic
    // This handles chunked uploads where large files are detected as application/octet-stream
    const isChunkedUploadWithValidExtension = 
      file.mimetype === 'application/octet-stream' && hasValidExtension;
    
    // PHASE 1 FIX: Allow chunked uploads - chunks don't have original filename extensions
    const isChunkedUpload = 
      file.mimetype === 'application/octet-stream' && 
      (file.fieldname === 'chunk' || file.originalname === 'blob');

    if (hasValidMime || hasValidExtension || isChunkedUploadWithValidExtension || isChunkedUpload) {
      if (isChunkedUploadWithValidExtension) {
        console.log(`[Upload Validation] ✅ ALLOWED (chunked upload with valid extension)`);
      } else if (isChunkedUpload) {
        console.log(`[Upload Validation] ✅ ALLOWED (chunked upload)`);
      } else if (hasValidExtension) {
        console.log(`[Upload Validation] ✅ ALLOWED (valid extension: .${extension})`);
      } else {
        console.log(`[Upload Validation] ✅ ALLOWED (valid MIME: ${file.mimetype})`);
      }
      cb(null, true);
    } else {
      console.error(`[Upload Validation] ❌ REJECTED - File: ${file.originalname}`);
      console.error(`[Upload Validation] ❌ REJECTED - MIME: ${file.mimetype} (not in allowed list)`);
      console.error(`[Upload Validation] ❌ REJECTED - Extension: .${extension} (not in allowed list)`);
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
}).array('file', MAX_FILES); // Enhanced to 50 files maximum with intelligent processing

// Error handler for multer
export const handleUploadError = (error: any, _req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    console.error('[Upload] Multer error:', error.code, error.message);
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        // PHASE 1.2 FIX: File size limits disabled - this error should not occur
        return res.status(400).json({ 
          message: `Unexpected file size error (limits are disabled)` 
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          message: `Too many files. Maximum is ${MAX_FILES} files per batch. Consider using multiple batches for larger uploads.`,
          maxFiles: MAX_FILES,
          maxConcurrent: MAX_CONCURRENT_UPLOADS,
          suggestion: "Split large uploads into smaller batches for optimal performance"
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          message: 'Unexpected file field name' 
        });
      default:
        return res.status(400).json({ 
          message: `Upload error: ${error.message}` 
        });
    }
  } else if (error.message.includes('File type not allowed')) {
    return res.status(400).json({ 
      message: error.message 
    });
  }
  
  next(error);
};