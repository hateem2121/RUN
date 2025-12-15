/**
 * Media validation API route for admin products
 */
import { Router } from 'express';
import multer from 'multer';
// import { z } from 'zod';
import { logger } from '../../lib/smart-logger.js';

const router = Router();

// In-memory storage for validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB - no size restrictions per user request
    files: 10 // Max 10 files per upload
  }
});

// Malicious file signature detection
const MALICIOUS_SIGNATURES = [
  { signature: [0x50, 0x4B, 0x03, 0x04], name: 'ZIP-based malware' },
  { signature: [0x7F, 0x45, 0x4C, 0x46], name: 'Linux executable' },
  { signature: [0x4D, 0x5A], name: 'Windows executable' },
  { signature: [0xCA, 0xFE, 0xBA, 0xBE], name: 'Java class file' },
  { signature: [0xFE, 0xED, 0xFA, 0xCE], name: 'Mach-O executable' },
  { signature: [0xFE, 0xED, 0xFA, 0xCF], name: 'Mach-O 64-bit executable' }
];

function checkMaliciousSignature(buffer: Buffer): { isMalicious: boolean; threat?: string } {
  for (const { signature, name } of MALICIOUS_SIGNATURES) {
    if (buffer.subarray(0, signature.length).equals(Buffer.from(signature))) {
      return { isMalicious: true, threat: name };
    }
  }
  return { isMalicious: false };
}

// Validate media files
router.post('/validate-media', upload.array('files'), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided for validation'
      });
    }

    const results = [];

    for (const file of files) {
      const validation = checkMaliciousSignature(file.buffer);

      results.push({
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        valid: !validation.isMalicious,
        threat: validation.threat || null
      });
    }

    const allValid = results.every(r => r.valid);

    return res.json({
      success: allValid,
      message: allValid ? 'All files passed validation' : 'Some files failed validation',
      results
    });

  } catch (error) {
    logger.error('Media validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during validation'
    });
  }
});

export default router;