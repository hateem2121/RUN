import { zodResolver } from "@hookform/resolvers/zod";
import { type ContactFormData, contactFormSchema } from "@shared/validation/contact";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, GlassCardDecorations } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { type Country, countries } from "@/data/countries";
import { useToast } from "@/hooks/use-toast";

export interface ContactConfig {
  heroTitle?: string;
  locationLine1?: string;
  locationLine2?: string;
  mapCoordinates?: { lat: number; lng: number };
  locationButtonText?: string;
  email?: string;
  phone?: string;
  tradingHours?: Array<{ label: string; value: string }>;
  socialLinks?: Record<string, string>;
  platformOptions?: string[];
  formButtonText?: string;
  formPrivacyText?: string;
  successHeading?: string;
  successMessage?: string;
}

interface ContactFormProps {
  contactConfig?: ContactConfig | undefined;
  isMobile: boolean;
}

export function ContactForm({ contactConfig, isMobile }: ContactFormProps) {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      jobTitle: "",
      companyName: "",
      email: "",
      country: "",
      platform: "Phone Call",
      contactNumber: "",
      otherPlatform: "",
      message: "",
      contactPreference: "email",
      honeypot: "",
    },
  });

  const selectedPlatform = form.watch("platform");
  const showOtherPlatform = selectedPlatform === "Other";

  const fetcher = useFetcher<{ success: boolean; error?: string }>();
  const isPending = fetcher.state === "submitting" || fetcher.state === "loading";

  // Sync state
  useEffect(() => {
    if (fetcher.data?.success) {
      form.reset();
      toast({
        title: "Success!",
        description:
          contactConfig?.successMessage ||
          "Thank you for your message. We'll get back to you soon!",
      });
      setShowSuccess(true);
    } else if (fetcher.data?.success === false && fetcher.data?.error) {
      toast({
        title: "Error",
        description: fetcher.data.error || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [fetcher.data, form, contactConfig, toast]);

  const onSubmit = (data: ContactFormData) => {
    if (data.honeypot) return; // Silent fail for bots

    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const company = data.companyName || null;
    const phone = data.contactNumber || null;
    const preferredPlatform =
      data.platform === "Other" ? data.otherPlatform || null : data.platform;

    const formData = new FormData();
    formData.append("name", fullName);
    formData.append("email", data.email);
    formData.append("country", data.country);
    formData.append("message", data.message);
    if (company) formData.append("company", company);
    if (phone) formData.append("phone", phone);
    if (preferredPlatform) formData.append("preferredPlatform", preferredPlatform);
    if (data.honeypot) formData.append("honeypot", data.honeypot);

    // Call Action using useFetcher
    fetcher.submit(formData, { method: "post" });
  };

  const countryOptions = useMemo(() => {
    return [...countries].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const platforms = contactConfig?.platformOptions || [
    "Phone Call",
    "WhatsApp",
    "WeChat",
    "Telegram",
    "Other",
  ];

  return (
    <Card
      variant="glass-premium"
      className="col-span-1 p-8 md:col-span-2 md:p-10 lg:col-span-3 lg:p-12"
    >
      <GlassCardDecorations showShimmer={!isMobile} />
      <div className="card-border-overlay rounded-[calc(0.75rem-1px)]" />

      <div className="relative z-default">
        {!showSuccess ? (
          <div>
            <Typography.H1
              className="mb-8 font-bold text-3xl text-foreground/90 leading-none tracking-tighter sm:text-4xl md:text-5xl lg:text-5xl"
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              {contactConfig?.heroTitle || "DROP US A MESSAGE"}
            </Typography.H1>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
              data-testid="form-contact"
            >
              {/* Name Fields */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <Label
                    htmlFor="firstName"
                    className="mb-2 block font-medium text-foreground/80 text-sm"
                  >
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    data-testid="input-first-name"
                    size="lg"
                    aria-describedby={
                      form.formState.errors.firstName ? "firstName-error" : undefined
                    }
                    {...form.register("firstName")}
                  />
                  {form.formState.errors.firstName && (
                    <Typography.P id="firstName-error" className="mt-2 text-destructive text-sm">
                      {form.formState.errors.firstName.message}
                    </Typography.P>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="lastName"
                    className="mb-2 block font-medium text-foreground/80 text-sm"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    data-testid="input-last-name"
                    size="lg"
                    aria-describedby={form.formState.errors.lastName ? "lastName-error" : undefined}
                    {...form.register("lastName")}
                  />
                  {form.formState.errors.lastName && (
                    <Typography.P id="lastName-error" className="mt-2 text-destructive text-sm">
                      {form.formState.errors.lastName.message}
                    </Typography.P>
                  )}
                </div>
              </div>

              {/* Work Information */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <Label
                    htmlFor="jobTitle"
                    className="mb-2 block font-medium text-foreground/80 text-sm"
                  >
                    Job Title
                  </Label>
                  <Input
                    id="jobTitle"
                    data-testid="input-job-title"
                    size="lg"
                    {...form.register("jobTitle")}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="companyName"
                    className="mb-2 block font-medium text-foreground/80 text-sm"
                  >
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    data-testid="input-company-name"
                    size="lg"
                    {...form.register("companyName")}
                  />
                </div>
              </div>

              {/* Email and Country */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <Label
                    htmlFor="email"
                    className="mb-2 block font-medium text-foreground/80 text-sm"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-email"
                    size="lg"
                    aria-describedby={form.formState.errors.email ? "email-error" : undefined}
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <Typography.P id="email-error" className="mt-2 text-destructive text-sm">
                      {form.formState.errors.email.message}
                    </Typography.P>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block font-medium text-foreground/80 text-sm">
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <CustomSelect
                      value={selectedCountry}
                      options={countryOptions}
                      onChange={(country) => {
                        setSelectedCountry(country);
                        form.setValue("country", country.name);
                      }}
                      getLabel={(c) => c.name}
                      getKey={(c) => c.code}
                      renderOption={(c) => (
                        <div className="flex items-center">
                          <img
                            src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                            alt=""
                            className="mr-3 h-4"
                          />
                          <span>{c.name}</span>
                        </div>
                      )}
                      placeholder="Select Country"
                      searchable
                      data-testid="button-country-dropdown"
                      aria-describedby={form.formState.errors.country ? "country-error" : undefined}
                    />
                  </div>
                  {form.formState.errors.country && (
                    <Typography.P id="country-error" className="mt-2 text-destructive text-sm">
                      {form.formState.errors.country.message}
                    </Typography.P>
                  )}
                </div>
              </div>

              {/* Platform and Contact Number */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block font-medium text-foreground/80 text-sm">
                    Preferred Platform
                  </Label>
                  <div className="relative">
                    <CustomSelect
                      value={selectedPlatform || null}
                      options={platforms}
                      onChange={(p) => form.setValue("platform", p)}
                      getLabel={(p) => p}
                      getKey={(p) => p}
                      placeholder="Select Platform"
                      data-testid="button-platform-dropdown"
                    />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="contactNumber"
                    className="mb-2 block font-medium text-foreground/80 text-sm"
                  >
                    Contact Number / Handle
                  </Label>
                  <div className="flex items-center overflow-hidden rounded-lg border border-border shadow-sm-xs transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary h-12">
                    <span className="inline-flex items-center border-border border-r bg-muted px-3 text-foreground/80 sm:text-sm h-full">
                      {selectedCountry ? `+${selectedCountry.phone}` : "--"}
                    </span>
                    <Input
                      id="contactNumber"
                      data-testid="input-contact-number"
                      {...form.register("contactNumber")}
                      variant="ghost"
                      className="flex-1 border-0 bg-transparent p-3 h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Other Platform */}
              {showOtherPlatform && (
                <div>
                  <Label
                    htmlFor="otherPlatform"
                    className="mb-2 block font-medium text-foreground/80 text-sm"
                  >
                    Please specify platform
                  </Label>
                  <Input
                    id="otherPlatform"
                    data-testid="input-other-platform"
                    size="lg"
                    {...form.register("otherPlatform")}
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <Label
                  htmlFor="message"
                  className="mb-2 block font-medium text-foreground/80 text-sm"
                >
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  data-testid="textarea-message"
                  rows={5}
                  aria-describedby={form.formState.errors.message ? "message-error" : undefined}
                  {...form.register("message")}
                  className="block w-full rounded-lg border-border p-3 shadow-sm-xs transition-colors focus:border-primary focus:ring-2 focus:ring-primary min-h-[120px]"
                />
                {form.formState.errors.message && (
                  <Typography.P id="message-error" className="mt-2 text-red-500 text-sm">
                    {form.formState.errors.message.message}
                  </Typography.P>
                )}
              </div>

              {/* Contact Preference */}
              <div>
                <Label className="mb-2 block font-medium text-foreground/80 text-sm">
                  How should we contact you?
                </Label>
                <RadioGroup
                  defaultValue="email"
                  onValueChange={(value) =>
                    form.setValue("contactPreference", value as "email" | "platform")
                  }
                >
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="contact-pref-email" />
                      <Label htmlFor="contact-pref-email" className="text-sm">
                        Email
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="platform" id="contact-pref-platform" />
                      <Label htmlFor="contact-pref-platform" className="text-sm">
                        Your Preferred Platform
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Honeypot */}
              <div className="sr-only" aria-hidden="true">
                <Label htmlFor="honeypot">Do not fill this out if you are human:</Label>
                <Input id="honeypot" {...form.register("honeypot")} tabIndex={-1} />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  data-testid="button-submit"
                  disabled={isPending}
                  size="lg"
                  className="h-12 w-full bg-primary font-semibold text-primary-foreground shadow-md hover:shadow-lg"
                >
                  {isPending
                    ? "Sending..."
                    : contactConfig?.formButtonText || "Get a Response Within 24 Hours"}
                </Button>
                <Typography.P className="mt-4 text-center text-muted-foreground text-xs">
                  {contactConfig?.formPrivacyText ||
                    "We value your privacy and will never share your information."}
                </Typography.P>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-6 inline-block rounded-full bg-status-success-muted p-4">
              <CheckCircle2 className="h-12 w-12 text-status-success" />
            </div>
            <Typography.H2 className="mb-3 font-bold text-3xl text-foreground/90">
              {contactConfig?.successHeading || "Thank you!"}
            </Typography.H2>
            <Typography.P className="mb-8 text-muted-foreground">
              {contactConfig?.successMessage ||
                "We've received your message and will be in touch shortly."}
            </Typography.P>
            <Button
              onClick={() => setShowSuccess(false)}
              className="focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
              data-testid="button-send-another"
            >
              Send Another Message
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
