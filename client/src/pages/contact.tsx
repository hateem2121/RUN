import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Mail, MapPin, Share2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { type Country, countries } from "@/data/countries";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { Typography } from "@/components/ui/typography";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ContactConfig {
  heroTitle?: string;
  locationLine1?: string;
  locationLine2?: string;
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

const contactFormSchema = z.object({
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

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { isMobile } = useMobileDetection();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const { data: contactConfig, isLoading } = useQuery<ContactConfig>({
    queryKey: ["/api/contact-info"],
    staleTime: 300000,
  });

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

  const mutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      if (data.honeypot) {
        throw new Error("Invalid submission");
      }

      const fullName = `${data.firstName} ${data.lastName}`.trim();
      const company = data.companyName || null;
      const phone = data.contactNumber || null;
      const preferredPlatform = data.platform === "Other" ? data.otherPlatform : data.platform;

      const payload = {
        name: fullName,
        email: data.email,
        company,
        phone,
        country: data.country || null,
        preferredPlatform,
        message: data.message,
        honeypot: data.honeypot || "",
      };

      return await apiRequest("/api/contact", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_result) => {
      setShowSuccess(true);
      form.reset();
      toast({
        title: "Success!",
        description:
          contactConfig?.successMessage ||
          "Thank you for your message. We'll get back to you soon!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    mutation.mutate(data);
  };

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const platforms = contactConfig?.platformOptions || [
    "Phone Call",
    "WhatsApp",
    "WeChat",
    "Telegram",
    "Other",
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-gray-900 border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24 text-gray-900">
      <div className="container mx-auto max-w-7xl p-6 md:p-8 lg:p-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {/* Left Column: Contact Form */}
          <GlassCard className="col-span-1 p-8 md:col-span-2 md:p-10 lg:col-span-3 lg:p-12">
            {/* Gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />

            {/* Inner glow */}
            <div className="card-border-overlay rounded-[calc(0.75rem-1px)]" />

            {/* Hover shimmer - disabled on mobile for performance */}
            {!isMobile && (
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="shimmer-overlay" />
              </div>
            )}

            <div className="relative z-default">
              {!showSuccess ? (
                <div>
                  <Typography.H1
                    className="mb-8 font-bold text-3xl text-gray-800 leading-none tracking-tighter sm:text-4xl md:text-5xl lg:text-5xl"
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
                          className="mb-2 block font-medium text-gray-700 text-sm"
                        >
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          data-testid="input-first-name"
                          {...form.register("firstName")}
                          className="block w-full rounded-lg border-gray-300 p-3 shadow-sm-xs transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600"
                        />
                        {form.formState.errors.firstName && (
                          <Typography.P className="mt-2 text-red-500 text-sm">
                            {form.formState.errors.firstName.message}
                          </Typography.P>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="lastName"
                          className="mb-2 block font-medium text-gray-700 text-sm"
                        >
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          data-testid="input-last-name"
                          {...form.register("lastName")}
                          className="block w-full rounded-lg border-gray-300 p-3 shadow-sm-xs transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600"
                        />
                        {form.formState.errors.lastName && (
                          <Typography.P className="mt-2 text-red-500 text-sm">
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
                          className="mb-2 block font-medium text-gray-700 text-sm"
                        >
                          Job Title
                        </Label>
                        <Input
                          id="jobTitle"
                          data-testid="input-job-title"
                          {...form.register("jobTitle")}
                          className="block w-full rounded-lg border-gray-300 p-3 shadow-sm-xs transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="companyName"
                          className="mb-2 block font-medium text-gray-700 text-sm"
                        >
                          Company Name
                        </Label>
                        <Input
                          id="companyName"
                          data-testid="input-company-name"
                          {...form.register("companyName")}
                          className="block w-full rounded-lg border-gray-300 p-3 shadow-sm-xs transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    {/* Email and Country */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <Label
                          htmlFor="email"
                          className="mb-2 block font-medium text-gray-700 text-sm"
                        >
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          data-testid="input-email"
                          {...form.register("email")}
                          className="block w-full rounded-lg border-gray-300 p-3 shadow-sm-xs transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600"
                        />
                        {form.formState.errors.email && (
                          <Typography.P className="mt-2 text-red-500 text-sm">
                            {form.formState.errors.email.message}
                          </Typography.P>
                        )}
                      </div>
                      <div>
                        <Label className="mb-2 block font-medium text-gray-700 text-sm">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <button
                            type="button"
                            data-testid="button-country-dropdown"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="relative w-full cursor-default rounded-lg border border-gray-300 bg-white p-3 text-left shadow-sm-xs transition-colors hover:border-gray-400 focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                          >
                            <span className="flex items-center">
                              {selectedCountry && (
                                <img
                                  src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                                  alt={`${selectedCountry.name} flag`}
                                  className="mr-3 h-4"
                                />
                              )}
                              <span className="block truncate">
                                {selectedCountry ? selectedCountry.name : "Select Country"}
                              </span>
                            </span>
                          </button>
                          {showCountryDropdown && (
                            <div className="absolute z-dock mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 text-base shadow-xl sm:text-sm">
                              <div className="p-2">
                                <Input
                                  type="text"
                                  placeholder="Search for a country..."
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  className="w-full rounded-md p-2 text-sm"
                                />
                              </div>
                              <ul className="max-h-40 overflow-y-auto">
                                {filteredCountries.map((country) => (
                                  <li
                                    key={country.code}
                                    onClick={() => {
                                      setSelectedCountry(country);
                                      form.setValue("country", country.name);
                                      setShowCountryDropdown(false);
                                      setCountrySearch("");
                                    }}
                                    className="cursor-pointer select-none py-2 pr-9 pl-3 text-gray-900 hover:bg-indigo-600 hover:text-white"
                                  >
                                    <div className="flex items-center">
                                      <img
                                        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                                        alt={`${country.name} flag`}
                                        className="mr-3 h-4"
                                      />
                                      <span className="block truncate">{country.name}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {form.formState.errors.country && (
                          <Typography.P className="mt-2 text-red-500 text-sm">
                            {form.formState.errors.country.message}
                          </Typography.P>
                        )}
                      </div>
                    </div>

                    {/* Platform and Contact Number */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <Label className="mb-2 block font-medium text-gray-700 text-sm">
                          Preferred Platform
                        </Label>
                        <div className="relative">
                          <button
                            type="button"
                            data-testid="button-platform-dropdown"
                            onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                            className="relative w-full cursor-default rounded-lg border border-gray-300 bg-white p-3 text-left shadow-sm-xs transition-colors hover:border-gray-400 focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                          >
                            <span className="block truncate">{selectedPlatform}</span>
                          </button>
                          {showPlatformDropdown && (
                            <ul className="absolute z-dock mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 text-base shadow-xl sm:text-sm">
                              {platforms.map((platform) => (
                                <li
                                  key={platform}
                                  onClick={() => {
                                    form.setValue("platform", platform);
                                    setShowPlatformDropdown(false);
                                  }}
                                  className="cursor-pointer select-none px-3 py-2 text-gray-900 hover:bg-indigo-600 hover:text-white"
                                >
                                  {platform}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="contactNumber"
                          className="mb-2 block font-medium text-gray-700 text-sm"
                        >
                          Contact Number / Handle
                        </Label>
                        <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 shadow-sm-xs transition-colors focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600">
                          <span className="inline-flex items-center border-gray-300 border-r bg-gray-50 px-3 text-gray-700 sm:text-sm">
                            {selectedCountry ? `+${selectedCountry.phone}` : "--"}
                          </span>
                          <Input
                            id="contactNumber"
                            data-testid="input-contact-number"
                            {...form.register("contactNumber")}
                            className="flex-1 border-0 bg-transparent p-3"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Other Platform */}
                    {showOtherPlatform && (
                      <div>
                        <Label
                          htmlFor="otherPlatform"
                          className="mb-2 block font-medium text-gray-700 text-sm"
                        >
                          Please specify platform
                        </Label>
                        <Input
                          id="otherPlatform"
                          data-testid="input-other-platform"
                          {...form.register("otherPlatform")}
                          className="block w-full rounded-lg border-gray-300 p-3 shadow-sm-xs transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    )}

                    {/* Message */}
                    <div>
                      <Label
                        htmlFor="message"
                        className="mb-2 block font-medium text-gray-700 text-sm"
                      >
                        Message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        data-testid="textarea-message"
                        rows={5}
                        {...form.register("message")}
                        className="block w-full rounded-lg border-gray-300 p-3 shadow-sm-xs transition-colors focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600"
                      />
                      {form.formState.errors.message && (
                        <Typography.P className="mt-2 text-red-500 text-sm">
                          {form.formState.errors.message.message}
                        </Typography.P>
                      )}
                    </div>

                    {/* Contact Preference */}
                    <div>
                      <Label className="mb-2 block font-medium text-gray-700 text-sm">
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
                        disabled={mutation.isPending}
                        size="lg"
                        className="h-12 w-full bg-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg"
                      >
                        {mutation.isPending
                          ? "Sending..."
                          : contactConfig?.formButtonText || "Get a Response Within 24 Hours"}
                      </Button>
                      <Typography.P className="mt-4 text-center text-gray-500 text-xs">
                        {contactConfig?.formPrivacyText ||
                          "We value your privacy and will never share your information."}
                      </Typography.P>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mb-6 inline-block rounded-full bg-green-100 p-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <Typography.H2 className="mb-3 font-bold text-3xl text-gray-800">
                    {contactConfig?.successHeading || "Thank you!"}
                  </Typography.H2>
                  <Typography.P className="mb-8 text-gray-600">
                    {contactConfig?.successMessage ||
                      "We've received your message and will be in touch shortly."}
                  </Typography.P>
                  <Button
                    onClick={() => setShowSuccess(false)}
                    className="focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
                    data-testid="button-send-another"
                  >
                    Send Another Message
                  </Button>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Right Column: Info Boxes */}
          <div className="col-span-1 grid grid-cols-1 gap-6 sm:grid-cols-2 md:col-span-1 md:grid-cols-1 lg:col-span-2 lg:grid-cols-1">
            {/* Location Box */}
            <GlassCard className="p-6 lg:p-8">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent" />
              {!isMobile && (
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              )}
              <div className="relative z-elevated">
                <MapPin className="mb-4 h-6 w-6 text-gray-800" />
                <Typography.H2 className="mb-4 font-bold text-xl tracking-tight">
                  LOCATION
                </Typography.H2>
                <Typography.P className="mb-6 text-gray-600">
                  {contactConfig?.locationLine1 || "123 Main Street,"}
                  <br />
                  {contactConfig?.locationLine2 || "Anytown, USA 12345"}
                </Typography.P>
                <Button variant="outline" data-testid="button-get-directions" className="w-full">
                  {contactConfig?.locationButtonText || "GET DIRECTIONS"}
                </Button>
              </div>
            </GlassCard>

            {/* Contact Box */}
            <GlassCard className="p-6 lg:p-8">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent" />
              {!isMobile && (
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              )}
              <div className="relative z-elevated">
                <Mail className="mb-4 h-6 w-6 text-gray-800" />
                <Typography.H2 className="mb-4 font-bold text-xl tracking-tight">
                  CONTACT
                </Typography.H2>
                <ul className="space-y-2 text-gray-600">
                  <li>
                    <a
                      href={`mailto:${contactConfig?.email || "info@example.com"}`}
                      className="hover:underline"
                      data-testid="link-email"
                    >
                      {contactConfig?.email || "info@example.com"}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`tel:${contactConfig?.phone || "+1234567890"}`}
                      className="hover:underline"
                      data-testid="link-phone"
                    >
                      {contactConfig?.phone || "(123) 456-7890"}
                    </a>
                  </li>
                </ul>
              </div>
            </GlassCard>

            {/* Trading Hours Box */}
            <GlassCard className="p-6 lg:p-8">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent" />
              {!isMobile && (
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              )}
              <div className="relative z-elevated">
                <Clock className="mb-4 h-6 w-6 text-gray-800" />
                <Typography.H2 className="mb-4 font-bold text-xl tracking-tight">
                  TRADING HOURS
                </Typography.H2>
                <div className="space-y-1 text-gray-600">
                  {contactConfig?.tradingHours && contactConfig.tradingHours.length > 0 ? (
                    contactConfig.tradingHours.map((hours, index) => (
                      <Typography.P key={index}>
                        <strong>{hours.label}:</strong> <span>{hours.value}</span>
                      </Typography.P>
                    ))
                  ) : (
                    <>
                      <Typography.P>
                        <strong>Monday - Friday:</strong> <span>9:00 AM to 5:00 PM</span>
                      </Typography.P>
                      <Typography.P>
                        <strong>Saturdays:</strong> <span>10:00 AM to 2:00 PM</span>
                      </Typography.P>
                      <Typography.P>
                        <strong>Sundays:</strong> <span className="font-semibold">Closed</span>
                      </Typography.P>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Social Links Box */}
            <GlassCard className="p-6 lg:p-8">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent" />
              {!isMobile && (
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              )}
              <div className="relative z-elevated">
                <Share2 className="mb-4 h-6 w-6 text-gray-800" />
                <Typography.H2 className="mb-4 font-bold text-xl tracking-tight">
                  FOLLOW US
                </Typography.H2>
                <ul className="space-y-2 text-gray-600">
                  {contactConfig?.socialLinks &&
                  Object.keys(contactConfig.socialLinks).length > 0 ? (
                    Object.entries(contactConfig.socialLinks).map(([platform, url]) => (
                      <li key={platform}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="capitalize hover:underline"
                          data-testid={`link-social-${platform.toLowerCase()}`}
                        >
                          {platform}
                        </a>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        <a href="#" className="hover:underline" data-testid="link-social-facebook">
                          Facebook
                        </a>
                      </li>
                      <li>
                        <a href="#" className="hover:underline" data-testid="link-social-instagram">
                          Instagram
                        </a>
                      </li>
                      <li>
                        <a href="#" className="hover:underline" data-testid="link-social-twitter">
                          Twitter
                        </a>
                      </li>
                      <li>
                        <a href="#" className="hover:underline" data-testid="link-social-linkedin">
                          LinkedIn
                        </a>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
