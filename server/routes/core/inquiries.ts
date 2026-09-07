import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createInquirySchema } from "@run-remix/shared";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";
import { validateRequest } from "zod-express-middleware";
import { logger } from "../../lib/monitoring/logger.js";
import { handleUploadError } from "../../lib/multer-optimized.js";
import { criticalTier, uploadTier } from "../../middleware/rate-limit-tiers.js";
import { authService } from "../../services/system/auth.service.js";
import { inquiryService } from "../../services/system/inquiry.service.js";

const router = Router();

const isCwdServer = process.cwd().endsWith("server");
const baseDir = isCwdServer ? process.cwd() : path.join(process.cwd(), "server");
const TECHPACK_DIR = path.resolve(baseDir, "public/uploads/techpacks");

// Ensure upload directory exists
if (!fs.existsSync(TECHPACK_DIR)) {
  fs.mkdirSync(TECHPACK_DIR, { recursive: true });
}

// Dedicated safe streaming disk storage for tech-packs (prevents V8 heap exhaustion)
const techpackStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TECHPACK_DIR);
  },
  filename: (_req, file, cb) => {
    const token = `tp_${crypto.randomBytes(32).toString("hex")}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${token}__${safeName}`);
  },
});

const allowedTechpackExtensions = [".pdf", ".ai", ".dxf", ".zip", ".png", ".jpg", ".jpeg"];

const techPackUpload = multer({
  storage: techpackStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB stream limit directly in Multer
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedTechpackExtensions.includes(ext)) {
      return cb(new Error(`File type not allowed: ${ext || file.mimetype}`));
    }
    cb(null, true);
  },
}).single("file");

/**
 * POST /api/inquiries/upload-techpack
 * Public endpoint for uploading tech-pack attachments (PDF, CAD, DXF, AI, ZIP) up to 25MB.
 * Streams files directly to disk with 256-bit cryptographic tokens to prevent data loss and memory exhaustion.
 */
router.post(
  "/inquiries/upload-techpack",
  uploadTier,
  (req: Request, res: Response, next: NextFunction) => {
    techPackUpload(req, res, (err) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "No tech-pack file provided" });
    }

    // Validate file magic bytes against extension to prevent MIME-spoofing
    const ext = path.extname(file.originalname).toLowerCase();
    try {
      const handle = await fs.promises.open(file.path, "r");
      const header = Buffer.alloc(16);
      await handle.read(header, 0, 16, 0);
      await handle.close();

      let signatureValid = true;
      if (ext === ".pdf" && !header.subarray(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46]))) {
        signatureValid = false;
      } else if (
        ext === ".png" &&
        !header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      ) {
        signatureValid = false;
      } else if (
        (ext === ".jpg" || ext === ".jpeg") &&
        !header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
      ) {
        signatureValid = false;
      } else if (
        ext === ".zip" &&
        !header.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
      ) {
        signatureValid = false;
      }

      if (!signatureValid) {
        await fs.promises.unlink(file.path);
        return res.status(400).json({
          success: false,
          error: `File signature mismatch: content does not match ${ext} format`,
        });
      }
    } catch (sigErr) {
      logger.error("[TechPackUpload] Signature check error:", sigErr);
    }

    const storedFilename = file.filename;
    const separatorIdx = storedFilename.indexOf("__");
    const token = separatorIdx !== -1 ? storedFilename.substring(0, separatorIdx) : storedFilename;
    const safeName =
      separatorIdx !== -1 ? storedFilename.substring(separatorIdx + 2) : file.originalname;

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    logger.info(
      `[TechPackUpload] Successfully persisted tech-pack attachment: ${safeName} (${formattedSize}) -> ${storedFilename}`,
    );

    return res.status(201).json({
      success: true,
      token,
      name: safeName,
      size: formattedSize,
      mimeType: file.mimetype,
      url: `/api/inquiries/techpack/${token}`,
    });
  },
);

/**
 * GET /api/inquiries/techpack/:token
 * Authenticated staff/admin endpoint for downloading uploaded tech-pack attachments.
 */
router.get("/inquiries/techpack/:token", authService.requireAdmin, async (req, res) => {
  const token = typeof req.params.token === "string" ? req.params.token : undefined;
  if (!token || !/^tp_[a-zA-Z0-9_-]+$/.test(token)) {
    return res.status(400).json({ success: false, error: "Invalid tech-pack token" });
  }

  try {
    const files = await fs.promises.readdir(TECHPACK_DIR);
    const matching = files.find((f) => f.startsWith(`${token}__`));
    if (!matching) {
      return res.status(404).json({ success: false, error: "Tech-pack not found or expired" });
    }

    const filePath = path.join(TECHPACK_DIR, matching);
    const originalName = matching.substring(matching.indexOf("__") + 2);

    res.setHeader("Content-Disposition", `attachment; filename="${originalName}"`);
    return res.sendFile(path.resolve(filePath));
  } catch (err) {
    logger.error("[TechPackDownload] Failed to retrieve tech-pack:", err);
    return res.status(500).json({ success: false, error: "Failed to download tech-pack" });
  }
});

/**
 * POST /api/inquiries
 * Public endpoint for submitting contact inquiries and quote requests.
 */
router.post(
  "/inquiries",
  criticalTier,
  validateRequest({ body: createInquirySchema }),
  async (req, res) => {
    // Zero-friction Honeypot Bot Trap: Reject silent bots without error leakage
    const honeypot = req.body.b_fax_field || req.body.contact?.b_fax_field;
    if (honeypot) {
      logger.warn(`[PublicInquiry] Bot trapped via honeypot field: "${honeypot}"`);
      return res.status(201).json({
        success: true,
        message: "Inquiry received successfully",
      });
    }

    const parsedData = createInquirySchema.parse(req.body);
    const result = await inquiryService.createFromPublicPayload(parsedData);

    return result.match(
      (inquiry) => {
        logger.info(
          `[PublicInquiry] Successfully created inquiry #${inquiry.id} from ${inquiry.source}`,
        );

        return res.status(201).json({
          success: true,
          id: inquiry.id,
          message: "Inquiry received successfully",
        });
      },
      (error) => {
        logger.error("[PublicInquiry] Failed to create inquiry", error);
        return res.status(error.statusCode || 500).json({
          success: false,
          error: error.message || "Failed to process inquiry",
        });
      },
    );
  },
);

export default router;
