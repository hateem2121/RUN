import { describe, expect, it } from "vitest";
import {
  ContactSubmissionSchema,
  contactContentFormSchema,
} from "../../../../shared/validation/contact.js";

describe("Contact Validation", () => {
  describe("contactContentFormSchema", () => {
    it("should process socialLinks correctly", () => {
      // Valid object with string values
      const result1 = contactContentFormSchema.safeParse({
        socialLinks: { facebook: "url", instagram: "url" },
      });
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data.socialLinks).toEqual({ facebook: "url", instagram: "url" });
      }

      // Object with non-string values
      const result2 = contactContentFormSchema.safeParse({
        socialLinks: { facebook: "url", invalidKey: 123, another: null },
      });
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data.socialLinks).toEqual({ facebook: "url", invalidKey: "", another: "" });
      }

      // Non-object value
      const result3 = contactContentFormSchema.safeParse({
        socialLinks: "invalid string",
      });
      expect(result3.success).toBe(true);
      if (result3.success) {
        expect(result3.data.socialLinks).toEqual({});
      }

      // Null value
      const result4 = contactContentFormSchema.safeParse({
        socialLinks: null,
      });
      expect(result4.success).toBe(true);
      if (result4.success) {
        expect(result4.data.socialLinks).toEqual({});
      }
    });
  });

  describe("ContactSubmissionSchema", () => {
    it("should transform empty string values to null", () => {
      const result = ContactSubmissionSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        message: "Hello world",
        company: "",
        phone: "",
        country: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company).toBeNull();
        expect(result.data.phone).toBeNull();
        expect(result.data.country).toBeNull();
        expect(result.data.status).toBe("new");
        expect(result.data.source).toBe("contact-page");
      }
    });

    it("should accept valid string values", () => {
      const result = ContactSubmissionSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        message: "Hello world",
        company: "ACME Corp",
        phone: "+1234567890",
        country: "USA",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company).toBe("ACME Corp");
        expect(result.data.phone).toBe("+1234567890");
        expect(result.data.country).toBe("USA");
      }
    });
  });
});
