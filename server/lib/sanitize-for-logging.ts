/**
 * Utility to sanitize sensitive information (PII, credentials) from objects before logging
 */

// Keys that should be redacted, either exact matches or partial matches
const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "email",
  "phone",
  "ssn",
  "creditcard",
  "cardnumber",
  "cvv",
  "address",
  "name", // Can catch firstname, lastname
  "birth", // Can catch dob, birthdate
  "license",
  "citizen",
  "accountnumber",
  "routingnumber",
  "passport",
  "taxid",
];

function isSensitiveKey(key: string): boolean {
  const lowercaseKey = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensitive) => lowercaseKey.includes(sensitive));
}

export function sanitizeForLogging(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLogging(item));
  }

  if (typeof obj === "object") {
    // Handle specific object types we shouldn't dig into
    if (
      obj instanceof Date ||
      obj instanceof RegExp ||
      obj instanceof Error ||
      Buffer.isBuffer(obj)
    ) {
      if (obj instanceof Error) {
        // Redact exact messages if needed, but usually we just return errors as they are logging formatted
        // We can create a shallow clone to avoid mutating the original error
        return {
          name: obj.name,
          message: obj.message,
          stack: obj.stack,
          ...(obj as unknown as Record<string, unknown>),
        };
      }
      return obj;
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }

  return obj;
}
