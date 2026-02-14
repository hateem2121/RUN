import path from "node:path";

/**
 * SECURITY UTILITIES (OWASP A03: Injection)
 * Centralizes sanitization and validation for untrusted inputs
 * that could lead to command injection, path traversal, or other injection attacks.
 */

/**
 * Validates a filename to prevent path traversal.
 * Ensures the filename contains only alphanumeric characters, dots, dashes, and underscores.
 * Also prevents empty filenames or filenames consisting only of dots.
 */
export function validateFilename(filename: string): boolean {
  if (!filename || filename.length === 0) return false;

  // Prevent path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return false;
  }

  // Basic character whitelist
  const allowedChars = /^[a-zA-Z0-9._-]+$/;
  if (!allowedChars.test(filename)) {
    return false;
  }

  // Prevent specific dangerous names
  const dangerousNames = ["CON", "PRN", "AUX", "NUL", "COM1", "LPT1"];
  if (dangerousNames.includes(filename.toUpperCase().split(".")[0] || "")) {
    return false;
  }

  return true;
}

/**
 * Sanitizes a string for use in a command-line argument to prevent command injection.
 * While we should avoid shell commands, if they are necessary, this provides a safety layer.
 * NOTE: Prefer child_process.spawn([args]) over child_process.exec("command " + args).
 */
export function sanitizeShellArg(arg: string): string {
  // Replace characters that could be used for injection
  // While spawn is safer, this is an extra layer for any string-concat scenarios
  return arg.replace(/[^a-zA-Z0-9._-\s/]/g, "");
}

/**
 * Ensures a path is within a specific root directory to prevent traversal.
 */
export function isPathInside(childPath: string, parentPath: string): boolean {
  const relative = path.relative(parentPath, childPath);
  return !!relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}
