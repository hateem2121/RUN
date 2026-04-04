import { z } from "zod";

export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  country: z.string().min(1, "Country is required"),
  platform: z.string().default("Phone Call"),
  contactNumber: z.string().optional(),
  otherPlatform: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  contactPreference: z.enum(["email", "platform"]).default("email"),
  honeypot: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Inquiry (quote cart) form schema
export const inquiryFormSchema = z.object({
  contact: z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    company: z.string().min(2, "Company is required"),
    phone: z.string().optional(),
    projectDescription: z.string().optional(),
  }),
});

export type InquiryFormData = z.infer<typeof inquiryFormSchema>;

// Admin contact page CMS settings form schema
export const contactContentFormSchema = z.object({
  heroTitle: z.string().min(1, "Hero title is required").default("DROP US A MESSAGE"),
  email: z.string().email("Invalid email address").default("hello@runapparel.co"),
  phone: z.string().min(1, "Phone number is required").default("+1 (555) 123-4567"),
  locationLine1: z.string().min(1, "Address line 1 is required").default("123 Innovation Drive"),
  locationLine2: z.string().min(1, "Address line 2 is required").default("Tech Valley, CA 94043"),
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
