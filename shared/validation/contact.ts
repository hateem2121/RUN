import { z } from "zod";

/**
 * UI-centric schema for the React Hook Form.
 * Includes split name fields and UI-specific logic like 'otherPlatform'.
 */
export const ContactFormSchema = z.object({
  firstName: z.string().min(1, { error: "First name is required" }),
  lastName: z.string().min(1, { error: "Last name is required" }),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email({ error: "Invalid email address" }),
  country: z.string().min(1, { error: "Country is required" }),
  platform: z.string().default("Phone Call"),
  contactNumber: z.string().optional(),
  otherPlatform: z.string().optional(),
  message: z.string().min(1, { error: "Message is required" }),
  contactPreference: z.enum(["email", "platform"]).default("email"),
  honeypot: z.string().optional(),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;

/**
 * Backend-centric schema for database insertion and API validation.
 * Matches the 'inquiries' table columns exactly.
 */
export const ContactSubmissionSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required" }).max(100),
  email: z.string().trim().email({ error: "Invalid email address" }),
  message: z.string().trim().min(1, { error: "Message is required" }).max(5000),
  company: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => val || null),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable()
    .transform((val) => val || null),
  country: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => val || null),
  preferredPlatform: z.string().trim().max(50).nullish(),
  source: z.string().default("contact-page"),
  status: z.enum(["new", "read", "responded", "archived"]).default("new"),
  honeypot: z.string().optional(),
  recaptchaToken: z.string().optional(),
});

export type ContactSubmissionData = z.input<typeof ContactSubmissionSchema>;

/**
 * Quote request schema (B2B/Catalog-centric).
 */
export const QuoteSubmissionSchema = z.object({
  contact: z.object({
    name: z.string().min(2, { error: "Name is required" }),
    email: z.string().email({ error: "Invalid email address" }),
    company: z.string().min(2, { error: "Company name is required" }),
    phone: z.string().optional(),
    projectDescription: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        notes: z.string().optional(),
      }),
    )
    .min(1, { error: "At least one item must be added to the quote" }),
});

export type QuoteSubmissionData = z.infer<typeof QuoteSubmissionSchema>;

// Admin contact page CMS settings form schema
export const contactContentFormSchema = z.object({
  heroTitle: z.string().min(1, { error: "Hero title is required" }).default("DROP US A MESSAGE"),
  email: z.string().email({ error: "Invalid email address" }).default("hello@runapparel.co"),
  phone: z.string().min(1, { error: "Phone number is required" }).default("+1 (555) 123-4567"),
  locationLine1: z
    .string()
    .min(1, { error: "Address line 1 is required" })
    .default("123 Innovation Drive"),
  locationLine2: z
    .string()
    .min(1, { error: "Address line 2 is required" })
    .default("Tech Valley, CA 94043"),
  locationButtonText: z.string().default("GET DIRECTIONS"),
  tradingHours: z
    .array(
      z.object({
        label: z.string().optional().default(""),
        value: z.string().optional().default(""),
      }),
    )
    .optional()
    .default([]),
  socialLinks: z.preprocess((val) => {
    if (typeof val !== "object" || val === null) {
      return {};
    }
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(val as Record<string, unknown>)) {
      result[key] = typeof value === "string" ? value : "";
    }
    return result;
  }, z.record(z.string(), z.string()).optional().default({})),
  platformOptions: z
    .array(z.string())
    .optional()
    .default(["Phone Call", "WhatsApp", "WeChat", "Telegram", "Other"]),
  formButtonText: z.string().default("Get a Response Within 24 Hours"),
  formPrivacyText: z
    .string()
    .default("We value your privacy and will never share your information."),
  successHeading: z.string().default("Thank you!"),
  successMessage: z.string().default("We've received your message and will be in touch shortly."),
});

export type ContactContentForm = z.infer<typeof contactContentFormSchema>;
