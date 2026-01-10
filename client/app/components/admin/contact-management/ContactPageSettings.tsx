import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  Share2,
  Trash2,
} from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

const contactContentSchema = z.object({
  heroTitle: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  locationLine1: z.string().optional().default(""),
  locationLine2: z.string().optional().default(""),
  locationButtonText: z.string().optional().default(""),
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
    if (typeof val !== "object" || val === null) return {};
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(val)) {
      result[key] = typeof value === "string" ? value : "";
    }
    return result;
  }, z.record(z.string(), z.string()).optional().default({})),
  platformOptions: z.array(z.string()).optional().default([]),
  formButtonText: z.string().optional().default(""),
  formPrivacyText: z.string().optional().default(""),
  successHeading: z.string().optional().default(""),
  successMessage: z.string().optional().default(""),
});

type ContactContentForm = z.infer<typeof contactContentSchema>;

interface ContactConfig {
  id?: number | undefined;
  heroTitle?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  locationLine1?: string | undefined;
  locationLine2?: string | undefined;
  locationButtonText?: string | undefined;
  tradingHours?: Array<{ label: string; value: string }>;
  socialLinks?: Record<string, string>;
  platformOptions?: string[];
  formButtonText?: string | undefined;
  formPrivacyText?: string | undefined;
  successHeading?: string | undefined;
  successMessage?: string | undefined;
}

export function ContactPageSettings() {
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<ContactConfig>({
    queryKey: ["/api/contact-info"],
    staleTime: 0,
  });

  const form = useForm<ContactContentForm>({
    resolver: zodResolver(contactContentSchema) as any,
    defaultValues: {
      heroTitle: "",
      email: "",
      phone: "",
      locationLine1: "",
      locationLine2: "",
      locationButtonText: "",
      tradingHours: [],
      socialLinks: {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
      },
      platformOptions: [],
      formButtonText: "",
      formPrivacyText: "",
      successHeading: "",
      successMessage: "",
    },
  });

  const {
    fields: hoursFields,
    append: appendHours,
    remove: removeHours,
  } = useFieldArray({
    control: form.control,
    name: "tradingHours",
  });

  useEffect(() => {
    if (config) {
      const socialLinks = config.socialLinks || {};
      form.reset({
        heroTitle: config.heroTitle || "",
        email: config.email || "",
        phone: config.phone || "",
        locationLine1: config.locationLine1 || "",
        locationLine2: config.locationLine2 || "",
        locationButtonText: config.locationButtonText || "",
        tradingHours: config.tradingHours || [],
        socialLinks: {
          facebook: socialLinks.facebook || "",
          instagram: socialLinks.instagram || "",
          twitter: socialLinks.twitter || "",
          linkedin: socialLinks.linkedin || "",
        },
        platformOptions: config.platformOptions || [],
        formButtonText: config.formButtonText || "",
        formPrivacyText: config.formPrivacyText || "",
        successHeading: config.successHeading || "",
        successMessage: config.successMessage || "",
      });
    }
  }, [config, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ContactContentForm) => {
      const sanitizedData = {
        ...data,
        socialLinks: Object.fromEntries(
          Object.entries(data.socialLinks || {}).filter(([_, url]) => url && url.trim() !== ""),
        ),
        tradingHours: (data.tradingHours || []).filter((hour) => hour.label && hour.value),
      };

      if (config?.id) {
        return await apiRequest("/api/contact-page-configuration", {
          method: "PATCH",
          body: sanitizedData,
        });
      } else {
        return await apiRequest("/api/contact-page-configuration", {
          method: "POST",
          body: sanitizedData,
        });
      }
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/contact-info"] });
      getQueryClient().invalidateQueries({
        queryKey: ["/api/contact-page-configuration"],
      });
      toast({
        title: "Success",
        description: "Contact page content updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact page content.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactContentForm) => {
    saveMutation.mutate(data);
  };

  const onInvalid = (_errors: any) => {
    toast({
      title: "Validation Error",
      description: "Please check all required fields are filled correctly.",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="center-flex py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isDirty = form.formState.isDirty;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="mb-2 font-bold text-2xl text-neutral-900 dark:text-neutral-100">
            Contact Page Content
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Manage all content displayed on the contact page
          </p>
        </div>

        <div className="flex gap-3">
          {saveMutation.isSuccess && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium text-sm">Saved</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/contact", "_blank")}
            data-testid="button-preview"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => form.reset()}
            disabled={!isDirty || saveMutation.isPending}
            data-testid="button-reset"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit as any, onInvalid)}
            disabled={!isDirty || saveMutation.isPending}
            data-testid="button-save"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit as any, onInvalid)}>
        <Accordion
          type="multiple"
          defaultValue={["hero", "location", "contact"]}
          className="space-y-4"
        >
          {/* Hero Section */}
          <AccordionItem value="hero">
            <AccordionTrigger className="font-semibold text-lg">Hero Section</AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="heroTitle">Hero Heading</Label>
                      <Input
                        id="heroTitle"
                        {...form.register("heroTitle")}
                        placeholder="DROP US A LINE"
                        maxLength={100}
                        data-testid="input-hero-title"
                      />
                      {form.formState.errors.heroTitle && (
                        <p className="mt-1 text-red-500 text-sm">
                          {form.formState.errors.heroTitle.message}
                        </p>
                      )}
                      <p className="mt-1 text-muted-foreground text-sm">
                        Large heading displayed at the top of the contact page
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Location Information */}
          <AccordionItem value="location">
            <AccordionTrigger className="font-semibold text-lg">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="locationLine1">Address Line 1</Label>
                    <Input
                      id="locationLine1"
                      {...form.register("locationLine1")}
                      placeholder="123 Main Street"
                      data-testid="input-location-line1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationLine2">Address Line 2</Label>
                    <Input
                      id="locationLine2"
                      {...form.register("locationLine2")}
                      placeholder="Anytown, USA 12345"
                      data-testid="input-location-line2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationButtonText">Directions Button Text</Label>
                    <Input
                      id="locationButtonText"
                      {...form.register("locationButtonText")}
                      placeholder="GET DIRECTIONS"
                      data-testid="input-location-button-text"
                    />
                    {form.formState.errors.locationButtonText && (
                      <p className="mt-1 text-red-500 text-sm">
                        {form.formState.errors.locationButtonText.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Contact Details */}
          <AccordionItem value="contact">
            <AccordionTrigger className="font-semibold text-lg">
              <span className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Details
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="info@example.com"
                      data-testid="input-email"
                    />
                    {form.formState.errors.email && (
                      <p className="mt-1 text-red-500 text-sm">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      placeholder="(123) 456-7890"
                      data-testid="input-phone"
                    />
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Trading Hours */}
          <AccordionItem value="hours">
            <AccordionTrigger className="font-semibold text-lg">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Trading Hours
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  {hoursFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2"
                    >
                      <div>
                        <Label>Day(s)</Label>
                        <Input
                          {...form.register(`tradingHours.${index}.label`)}
                          placeholder="e.g., Monday - Friday"
                          data-testid={`input-hours-label-${index}`}
                        />
                        {form.formState.errors.tradingHours?.[index]?.label && (
                          <p className="mt-1 text-red-500 text-sm">
                            {form.formState.errors.tradingHours[index]?.label?.message}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label>Hours</Label>
                          <Input
                            {...form.register(`tradingHours.${index}.value`)}
                            placeholder="e.g., 9:00 AM to 5:00 PM"
                            data-testid={`input-hours-value-${index}`}
                          />
                          {form.formState.errors.tradingHours?.[index]?.value && (
                            <p className="mt-1 text-red-500 text-sm">
                              {form.formState.errors.tradingHours[index]?.value?.message}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeHours(index)}
                          className="mt-6"
                          data-testid={`button-remove-hours-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendHours({ label: "", value: "" })}
                    data-testid="button-add-hours"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Trading Hours
                  </Button>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Social Links */}
          <AccordionItem value="social">
            <AccordionTrigger className="font-semibold text-lg">
              <span className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Social Media Links
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  {["facebook", "instagram", "twitter", "linkedin"].map((platform) => (
                    <div key={platform}>
                      <Label htmlFor={platform} className="capitalize">
                        {platform}
                      </Label>
                      <Input
                        id={platform}
                        type="url"
                        {...form.register(`socialLinks.${platform}`)}
                        placeholder={`https://${platform}.com/...`}
                        data-testid={`input-social-${platform}`}
                      />
                      {form.formState.errors.socialLinks?.[platform] && (
                        <p className="mt-1 text-red-500 text-sm">
                          {form.formState.errors.socialLinks[platform]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Platform Options */}
          <AccordionItem value="platforms">
            <AccordionTrigger className="font-semibold text-lg">Platform Options</AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <Label>Available Communication Platforms</Label>
                    <p className="mb-3 text-muted-foreground text-sm">
                      Comma-separated list of platform options for the contact form dropdown
                    </p>
                    <Input
                      value={form.watch("platformOptions").join(", ")}
                      onChange={(e) => {
                        const platforms = e.target.value
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean);
                        form.setValue("platformOptions", platforms, {
                          shouldDirty: true,
                        });
                      }}
                      placeholder="Phone Call, WhatsApp, WeChat, Telegram, Other"
                      data-testid="input-platform-options"
                    />
                    {form.formState.errors.platformOptions && (
                      <p className="mt-1 text-red-500 text-sm">
                        {form.formState.errors.platformOptions.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Form Configuration */}
          <AccordionItem value="form">
            <AccordionTrigger className="font-semibold text-lg">
              Form Configuration
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="formButtonText">Submit Button Text</Label>
                    <Input
                      id="formButtonText"
                      {...form.register("formButtonText")}
                      placeholder="Get a Response Within 24 Hours"
                      data-testid="input-form-button-text"
                    />
                    {form.formState.errors.formButtonText && (
                      <p className="mt-1 text-red-500 text-sm">
                        {form.formState.errors.formButtonText.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="formPrivacyText">Privacy Notice</Label>
                    <Textarea
                      id="formPrivacyText"
                      {...form.register("formPrivacyText")}
                      rows={3}
                      placeholder="We value your privacy and will never share your information."
                      data-testid="textarea-form-privacy-text"
                    />
                    {form.formState.errors.formPrivacyText && (
                      <p className="mt-1 text-red-500 text-sm">
                        {form.formState.errors.formPrivacyText.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Success Message */}
          <AccordionItem value="success">
            <AccordionTrigger className="font-semibold text-lg">Success Message</AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="successHeading">Success Heading</Label>
                    <Input
                      id="successHeading"
                      {...form.register("successHeading")}
                      placeholder="Thank you!"
                      data-testid="input-success-heading"
                    />
                    {form.formState.errors.successHeading && (
                      <p className="mt-1 text-red-500 text-sm">
                        {form.formState.errors.successHeading.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="successMessage">Success Message</Label>
                    <Textarea
                      id="successMessage"
                      {...form.register("successMessage")}
                      rows={4}
                      placeholder="We've received your message and will be in touch shortly."
                      data-testid="textarea-success-message"
                    />
                    {form.formState.errors.successMessage && (
                      <p className="mt-1 text-red-500 text-sm">
                        {form.formState.errors.successMessage.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>

      {/* Fixed Bottom Actions */}
      <div className="sticky bottom-6 rounded-lg border-neutral-200 border-t bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="text-neutral-600 text-sm dark:text-neutral-400">
            {isDirty ? "You have unsaved changes" : "All changes saved"}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => form.reset()}
              disabled={!isDirty || saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit as any, onInvalid)}
              disabled={!isDirty || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
