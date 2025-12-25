import { Buffer } from "buffer";

/**
 * Basic file security scanner for malicious content detection
 */
export class FileSecurityScanner {
  // Common malicious file signatures (simplified for security)
  private static readonly MALICIOUS_SIGNATURES = [
    // Script tags and executable code patterns
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,

    // Executable file headers
    Buffer.from([0x4d, 0x5a]), // PE/MZ header (Windows executables)
    Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF header (Linux executables)
    Buffer.from([0xcf, 0xfa, 0xed, 0xfe]), // Mach-O header (macOS executables)

    // Suspicious PHP/ASP patterns
    /<\?php/gi,
    /<%[\s\S]*?%>/gi,
    /eval\s*\(/gi,
    /base64_decode\s*\(/gi,
  ];

  /**
   * Scan file buffer for malicious content
   */
  static scanBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): {
    isSafe: boolean;
    threats: string[];
    confidence: number;
  } {
    const threats: string[] = [];
    let confidence = 100;

    try {
      // SECURITY-HARDENED: Updated file size limits to 500MB per user request
      if (buffer.length > 500 * 1024 * 1024) {
        // 500MB max for any file
        threats.push("File exceeds maximum allowed size (500MB)");
        confidence -= 50; // Increased penalty
      } else if (buffer.length > 250 * 1024 * 1024) {
        // 250MB warning threshold
        threats.push("Large file size detected");
        confidence -= 20;
      }

      // Get file extension for media detection
      const extension = filename.split(".").pop()?.toLowerCase();
      const isMediaFile = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "webp",
        "svg",
        "mp4",
        "webm",
        "glb",
        "gltf",
      ].includes(extension || "");

      // For media files, only do basic validation to avoid false positives
      if (isMediaFile) {
        // Only check for obvious script injection in media files (first 512 bytes only)
        // Use 'latin1' encoding to avoid UTF-8 decoding errors on binary content
        const textSample = buffer.slice(0, 512).toString("latin1", 0, Math.min(buffer.length, 512));
        const criticalThreats = [
          /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
          /javascript:/gi,
          /<\?php/gi,
        ];

        let foundCriticalThreat = false;
        for (const pattern of criticalThreats) {
          if (pattern.test(textSample)) {
            threats.push(`Critical script injection detected in media file`);
            confidence -= 50;
            foundCriticalThreat = true;
          }
        }

        if (!foundCriticalThreat) {
        }
      } else {
        // For non-media files, do full scanning
        const textContent = buffer
          .slice(0, 1024 * 1024)
          .toString("utf8", 0, Math.min(buffer.length, 1024 * 1024));

        // Scan for malicious text patterns
        for (const signature of FileSecurityScanner.MALICIOUS_SIGNATURES) {
          if (signature instanceof Buffer) {
            // Binary signature check - only for non-media files
            if (buffer.indexOf(signature) !== -1) {
              threats.push(`Suspicious binary signature detected`);
              confidence -= 30;
            }
          } else if (signature instanceof RegExp) {
            // Text pattern check
            if (signature.test(textContent)) {
              threats.push(
                `Suspicious code pattern detected: ${signature.source.substring(0, 50)}`,
              );
              confidence -= 25;
            }
          }
        }
      }

      // MIME type validation
      const suspiciousMimes = [
        "application/x-executable",
        "application/x-msdownload",
        "application/x-msdos-program",
        "text/x-php",
        "application/x-httpd-php",
      ];

      if (suspiciousMimes.includes(mimeType)) {
        threats.push(`Suspicious MIME type: ${mimeType}`);
        confidence -= 40;
      }

      // Extension vs content mismatch detection
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
      const isImageExtension = imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
      const isImageMime = mimeType.startsWith("image/");

      if (isImageExtension && !isImageMime) {
        threats.push("File extension does not match content type");
        confidence -= 30;
      }

      // SECURITY-HARDENED: Stricter confidence thresholds
      const threshold = isMediaFile ? 60 : 70; // Increased from 40/50 to 60/70

      return {
        isSafe: threats.length === 0 && confidence > threshold,
        threats,
        confidence: Math.max(0, confidence),
      };
    } catch (error) {
      return {
        isSafe: false,
        threats: ["Security scan failed - file rejected for safety"],
        confidence: 0,
      };
    }
  }

  /**
   * Quick filename validation
   */
  static validateFilename(filename: string): {
    isValid: boolean;
    reason?: string;
  } {
    // Check for suspicious characters
    const suspiciousChars = /[<>:"|?*\x00-\x1F]/;
    if (suspiciousChars.test(filename)) {
      return {
        isValid: false,
        reason: "Filename contains suspicious characters",
      };
    }

    // Check for suspicious extensions
    const dangerousExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".com",
      ".pif",
      ".scr",
      ".vbs",
      ".js",
      ".jar",
      ".php",
      ".asp",
      ".aspx",
      ".jsp",
      ".pl",
      ".py",
      ".rb",
      ".sh",
    ];

    const hassDangerousExt = dangerousExtensions.some((ext) =>
      filename.toLowerCase().endsWith(ext),
    );

    if (hassDangerousExt) {
      return { isValid: false, reason: "Potentially dangerous file extension" };
    }

    return { isValid: true };
  }
}
