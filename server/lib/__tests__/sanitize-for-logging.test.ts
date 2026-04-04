import { describe, expect, it } from "vitest";
import { sanitizeForLogging } from "../sanitize-for-logging.js";

describe("sanitizeForLogging", () => {
  it("should sanitize exact and partial PII key names", () => {
    const input = {
      email: "test@example.com",
      user_email: "another@example.com",
      password: "secretpassword123",
      creditCardNumber: "1234-5678-9012-3456",
      ssn: "000-00-0000",
      normalField: "visible",
    };

    const output = sanitizeForLogging(input);

    expect(output.email).toBe("[REDACTED]");
    expect(output.user_email).toBe("[REDACTED]");
    expect(output.password).toBe("[REDACTED]");
    expect(output.creditCardNumber).toBe("[REDACTED]");
    expect(output.ssn).toBe("[REDACTED]");
    expect(output.normalField).toBe("visible");
  });

  it("should sanitize nested objects", () => {
    const input = {
      user: {
        id: "123",
        credentials: {
          token: "abcdefghi",
          refreshToken: "xyz123",
          api_secret: "hidden",
        },
        address: "123 Main St", // address is typically sensitive
      },
      status: "active",
    };

    const output = sanitizeForLogging(input);

    expect(output.user.id).toBe("123");
    expect(output.user.credentials.token).toBe("[REDACTED]");
    expect(output.user.credentials.refreshToken).toBe("[REDACTED]");
    expect(output.user.credentials.api_secret).toBe("[REDACTED]");
    expect(output.user.address).toBe("[REDACTED]");
    expect(output.status).toBe("active");
  });

  it("should sanitize arrays of objects", () => {
    const input = [
      { id: 1, email: "one@test.com" },
      { id: 2, secretKey: "two" },
    ];

    const output = sanitizeForLogging(input);

    expect(output[0].id).toBe(1);
    expect(output[0].email).toBe("[REDACTED]");
    expect(output[1].id).toBe(2);
    expect(output[1].secretKey).toBe("[REDACTED]");
  });

  it("should handle null and primitive types directly", () => {
    expect(sanitizeForLogging(null)).toBeNull();
    expect(sanitizeForLogging("test")).toBe("test");
    expect(sanitizeForLogging(123)).toBe(123);
    // Even if it's an email string directly, we can't key-match it, so it remains unchanged
    // We only sanitize *by key names* in object structures
  });
});
