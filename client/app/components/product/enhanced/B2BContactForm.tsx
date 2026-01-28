/**
 * Enhanced B2B Contact Form - Style 1 Integration
 * Features: Professional inquiry forms, validation, B2B workflows
 */

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building,
  Download,
  Loader2,
  Mail,
  MessageSquare,
  Package,
  Phone,
  User,
} from "lucide-react";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useServerValidation } from "@/hooks/useServerValidation";
import { ApiError } from "@/lib/api";
import { submitInquiryAction as submitInquiry } from "../../../../app/services/inquiry.server";

type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  timestamp: number;
  // biome-ignore lint/suspicious/noExplicitAny: Error state needs flexibility
  error?: any;
};

// Define local initial state matching the server action return type
const initialState: ContactState = {
  status: "idle",
  message: "",
  timestamp: Date.now(),
};

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const b2bContactSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional(),
  inquiryType: z.enum(["wholesale", "customization", "samples", "bulk", "partnership"]),
  message: z.string().min(10, "Please provide more details about your inquiry"),
  volume: z.string().optional(),
  timeline: z.string().optional(),
});

type B2BContactFormData = z.infer<typeof b2bContactSchema>;

interface B2BContactFormProps {
  productName?: string | undefined;
  productId?: string | undefined;
  className?: string | undefined;
  onSubmit?: (data: B2BContactFormData) => Promise<void>;
  prefilledType?: "samples" | "wholesale" | "customization";
}

const inquiryOptions = [
  {
    value: "wholesale",
    label: "Wholesale Pricing",
    description: "Get bulk pricing information",
  },
  {
    value: "customization",
    label: "Custom Branding",
    description: "Private label and customization",
  },
  {
    value: "samples",
    label: "Sample Request",
    description: "Request product samples",
  },
  { value: "bulk", label: "Bulk Orders", description: "Large quantity orders" },
  {
    value: "partnership",
    label: "Partnership",
    description: "Distribution partnership",
  },
];

const volumeOptions = [
  "50-100 units",
  "100-500 units",
  "500-1000 units",
  "1000-5000 units",
  "5000+ units",
];

const timelineOptions = [
  "Immediate (1-2 weeks)",
  "Short term (1 month)",
  "Medium term (2-3 months)",
  "Long term (3+ months)",
  "Ongoing relationship",
];

export function B2BContactForm({
  productName,
  productId,
  className,
  onSubmit: _onSubmit,
  prefilledType,
}: B2BContactFormProps) {
  // REACT 19: Server Action Integration
  const [state, action, isPending] = React.useActionState(submitInquiry, initialState);

  const { toast } = useToast();

  const form = useForm<B2BContactFormData>({
    resolver: zodResolver(b2bContactSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      // biome-ignore lint/suspicious/noExplicitAny: Enum type mismatch
      inquiryType: (prefilledType || undefined) as any,
      message:
        prefilledType === "samples" && productName
          ? `I would like to request samples of the ${productName} for evaluation.`
          : "",
      volume: "",
      timeline: "",
    },
  });

  // Hydrate server error for validation hook
  const apiError = React.useMemo(() => {
    if (state.status === "error" && state.error) {
      return new ApiError(state.error.status || 500, state.error);
    }
    return null;
  }, [state]);

  useServerValidation({ form, error: apiError });

  // Handle side effects from action state
  React.useEffect(() => {
    if (state.status === "success") {
      toast({
        title: "Inquiry Submitted",
        description: state.message,
      });
      form.reset();
    } else if (state.status === "error") {
      toast({
        title: "Submission Failed",
        description: state.message,
        variant: "destructive",
      });
    }
  }, [toast, form, state.status, state.message]);

  const handleSubmit = useCallback(
    (data: B2BContactFormData) => {
      // Bridge React Hook Form to Server Action
      React.startTransition(() => {
        const formData = new FormData();

        // Add form fields
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });

        // Add context
        if (productName) formData.append("productName", productName);
        if (productId) formData.append("productId", productId);
        formData.append("timestamp", new Date().toISOString());

        action(formData);
      });
    },
    [action, productName, productId],
  );

  const handleRequestSamples = useCallback(() => {
    form.setValue("inquiryType", "samples");
    if (productName) {
      form.setValue(
        "message",
        `I would like to request samples of the ${productName} for evaluation.`,
      );
    }

    // Focus on first empty field
    const companyName = form.getValues("companyName");
    if (!companyName) {
      setTimeout(() => {
        document.getElementById("companyName")?.focus();
      }, 100);
    }
  }, [form, productName]);

  const handleDownloadSpecs = useCallback(() => {
    toast({
      title: "Coming Soon",
      description:
        "Technical specifications download will be available soon. Please contact our sales team for detailed specs.",
    });
  }, [toast]);

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="space-y-4 text-center">
        <h2 className="font-bold text-2xl text-foreground dark:text-foreground">Ready to Order?</h2>
        <p className="mx-auto max-w-2xl text-muted-foreground dark:text-muted-foreground/70">
          Connect with our B2B team for wholesale pricing, customization options, and bulk orders.
          {productName && ` Get detailed information about ${productName}.`}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Contact Information */}
        <div className="space-y-6">
          <h3 className="font-semibold text-foreground text-lg dark:text-foreground">
            Get in Touch
          </h3>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 rounded-lg bg-background p-4 dark:bg-muted/80">
              <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-medium text-foreground dark:text-foreground">Phone</h4>
                <p className="text-muted-foreground text-sm dark:text-muted-foreground/70">
                  +1 (555) 123-4567
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 rounded-lg bg-background p-4 dark:bg-muted/80">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-medium text-foreground dark:text-foreground">Email</h4>
                <p className="text-muted-foreground text-sm dark:text-muted-foreground/70">
                  wholesale@runapparel.com
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handleRequestSamples} className="w-full" variant="default">
              <Package className="mr-2 h-4 w-4" />
              Request Samples
            </Button>

            <Button onClick={handleDownloadSpecs} className="w-full" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Tech Specs
            </Button>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-lg border border-border bg-white p-6 dark:border-border dark:bg-muted/80">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Company & Contact Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  htmlFor="companyName"
                  className="font-medium text-foreground/80 text-sm dark:text-muted-foreground/50"
                >
                  Company Name *
                </label>
                <div className="relative">
                  <Building className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground/70" />
                  <Input
                    id="companyName"
                    {...form.register("companyName")}
                    className="pl-10"
                    placeholder="Your Company"
                    disabled={isPending}
                  />
                </div>
                {form.formState.errors.companyName && (
                  <p className="text-red-600 text-xs dark:text-red-400">
                    {form.formState.errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="contactName"
                  className="font-medium text-foreground/80 text-sm dark:text-muted-foreground/50"
                >
                  Contact Name *
                </label>
                <div className="relative">
                  <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground/70" />
                  <Input
                    id="contactName"
                    {...form.register("contactName")}
                    className="pl-10"
                    placeholder="Your Name"
                    disabled={isPending}
                  />
                </div>
                {form.formState.errors.contactName && (
                  <p className="text-red-600 text-xs dark:text-red-400">
                    {form.formState.errors.contactName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="font-medium text-foreground/80 text-sm dark:text-muted-foreground/50"
                >
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground/70" />
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    className="pl-10"
                    placeholder="contact@company.com"
                    disabled={isPending}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-600 text-xs dark:text-red-400">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="font-medium text-foreground/80 text-sm dark:text-muted-foreground/50"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground/70" />
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register("phone")}
                    className="pl-10"
                    placeholder="+1 (555) 123-4567"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            {/* Inquiry Type */}
            <div className="space-y-2">
              <label className="font-medium text-foreground/80 text-sm dark:text-muted-foreground/50">
                Inquiry Type *
              </label>
              <Select
                // biome-ignore lint/suspicious/noExplicitAny: Enum type mismatch
                onValueChange={(value) => form.setValue("inquiryType", value as any)}
                defaultValue={form.getValues("inquiryType")}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inquiry type" />
                </SelectTrigger>
                <SelectContent>
                  {inquiryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-muted-foreground text-xs">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.inquiryType && (
                <p className="text-red-600 text-xs dark:text-red-400">
                  {form.formState.errors.inquiryType.message}
                </p>
              )}
            </div>

            {/* Volume & Timeline */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="font-medium text-foreground/80 text-sm dark:text-muted-foreground/50">
                  Expected Volume
                </label>
                <Select
                  onValueChange={(value) => form.setValue("volume", value)}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select volume" />
                  </SelectTrigger>
                  <SelectContent>
                    {volumeOptions.map((volume) => (
                      <SelectItem key={volume} value={volume}>
                        {volume}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-foreground/80 text-sm dark:text-muted-foreground/50">
                  Timeline
                </label>
                <Select
                  onValueChange={(value) => form.setValue("timeline", value)}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {timelineOptions.map((timeline) => (
                      <SelectItem key={timeline} value={timeline}>
                        {timeline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label
                htmlFor="message"
                className="font-medium text-foreground/80 text-sm dark:text-muted-foreground/50"
              >
                Message *
              </label>
              <div className="relative">
                <MessageSquare className="absolute top-3 left-3 h-4 w-4 text-muted-foreground/70" />
                <Textarea
                  id="message"
                  {...form.register("message")}
                  className="min-h-[100px] pl-10"
                  placeholder="Please provide details about your requirements..."
                  disabled={isPending}
                />
              </div>
              {form.formState.errors.message && (
                <p className="text-red-600 text-xs dark:text-red-400">
                  {form.formState.errors.message.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Inquiry
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default B2BContactForm;
