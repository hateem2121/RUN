import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Mail, MapPin, Share2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { type Country, countries } from "@/data/countries";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
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
    onSuccess: (result) => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-32 pb-24">
      <div className="container mx-auto p-6 md:p-8 lg:p-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* Left Column: Contact Form */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 relative group bg-white/10 dark:bg-white/5 backdrop-blur-md p-8 md:p-10 lg:p-12 rounded-xl border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />

            {/* Inner glow */}
            <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            {/* Hover shimmer - disabled on mobile for performance */}
            {!isMobile && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              </div>
            )}

            <div className="relative z-10">
              {!showSuccess ? (
                <div>
                  <h1
                    className="tracking-tighter leading-none mb-8 text-gray-800 text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold"
                    style={{ fontFamily: "'Anton', sans-serif" }}
                  >
                    {contactConfig?.heroTitle || "DROP US A MESSAGE"}
                  </h1>

                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5"
                    data-testid="form-contact"
                  >
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label
                          htmlFor="firstName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          data-testid="input-first-name"
                          {...form.register("firstName")}
                          className="block w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 shadow-sm-xs p-3 transition-colors"
                        />
                        {form.formState.errors.firstName && (
                          <p className="text-red-500 text-sm mt-2">
                            {form.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="lastName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          data-testid="input-last-name"
                          {...form.register("lastName")}
                          className="block w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 shadow-sm-xs p-3 transition-colors"
                        />
                        {form.formState.errors.lastName && (
                          <p className="text-red-500 text-sm mt-2">
                            {form.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Work Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label
                          htmlFor="jobTitle"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Job Title
                        </Label>
                        <Input
                          id="jobTitle"
                          data-testid="input-job-title"
                          {...form.register("jobTitle")}
                          className="block w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 shadow-sm-xs p-3 transition-colors"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="companyName"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Company Name
                        </Label>
                        <Input
                          id="companyName"
                          data-testid="input-company-name"
                          {...form.register("companyName")}
                          className="block w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 shadow-sm-xs p-3 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Email and Country */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          data-testid="input-email"
                          {...form.register("email")}
                          className="block w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 shadow-sm-xs p-3 transition-colors"
                        />
                        {form.formState.errors.email && (
                          <p className="text-red-500 text-sm mt-2">
                            {form.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                          Country <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <button
                            type="button"
                            data-testid="button-country-dropdown"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="relative w-full cursor-default rounded-lg border border-gray-300 bg-white p-3 text-left shadow-sm-xs hover:border-gray-400 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-colors sm:text-sm"
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
                            <div className="absolute z-dock mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-white py-1 text-base shadow-xl border border-gray-200 sm:text-sm">
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
                                    className="text-gray-900 cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
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
                          <p className="text-red-500 text-sm mt-2">
                            {form.formState.errors.country.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Platform and Contact Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                          Preferred Platform
                        </Label>
                        <div className="relative">
                          <button
                            type="button"
                            data-testid="button-platform-dropdown"
                            onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                            className="relative w-full cursor-default rounded-lg border border-gray-300 bg-white p-3 text-left shadow-sm-xs hover:border-gray-400 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-colors sm:text-sm"
                          >
                            <span className="block truncate">{selectedPlatform}</span>
                          </button>
                          {showPlatformDropdown && (
                            <ul className="absolute z-dock mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-white py-1 text-base shadow-xl border border-gray-200 sm:text-sm">
                              {platforms.map((platform) => (
                                <li
                                  key={platform}
                                  onClick={() => {
                                    form.setValue("platform", platform);
                                    setShowPlatformDropdown(false);
                                  }}
                                  className="text-gray-900 cursor-pointer select-none py-2 px-3 hover:bg-indigo-600 hover:text-white"
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
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Contact Number / Handle
                        </Label>
                        <div className="flex items-center rounded-lg border border-gray-300 shadow-sm-xs overflow-hidden focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600 transition-colors">
                          <span className="inline-flex items-center px-3 border-r border-gray-300 bg-gray-50 text-gray-700 sm:text-sm">
                            {selectedCountry ? `+${selectedCountry.phone}` : "--"}
                          </span>
                          <Input
                            id="contactNumber"
                            data-testid="input-contact-number"
                            {...form.register("contactNumber")}
                            className="flex-1 border-0 p-3 bg-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Other Platform */}
                    {showOtherPlatform && (
                      <div>
                        <Label
                          htmlFor="otherPlatform"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Please specify platform
                        </Label>
                        <Input
                          id="otherPlatform"
                          data-testid="input-other-platform"
                          {...form.register("otherPlatform")}
                          className="block w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 shadow-sm-xs p-3 transition-colors"
                        />
                      </div>
                    )}

                    {/* Message */}
                    <div>
                      <Label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Message <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        data-testid="textarea-message"
                        rows={5}
                        {...form.register("message")}
                        className="block w-full rounded-lg border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600 shadow-sm-xs p-3 transition-colors"
                      />
                      {form.formState.errors.message && (
                        <p className="text-red-500 text-sm mt-2">
                          {form.formState.errors.message.message}
                        </p>
                      )}
                    </div>

                    {/* Contact Preference */}
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-12 w-full py-3 px-4 hover:bg-[#1a2d40]/90 shadow-md hover:shadow-lg text-[#d4e7fa] bg-[#1a2d40]"
                      >
                        {mutation.isPending
                          ? "Sending..."
                          : contactConfig?.formButtonText || "Get a Response Within 24 Hours"}
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-4">
                        {contactConfig?.formPrivacyText ||
                          "We value your privacy and will never share your information."}
                      </p>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-block bg-green-100 p-4 rounded-full mb-6">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    {contactConfig?.successHeading || "Thank you!"}
                  </h2>
                  <p className="text-gray-600 mb-8">
                    {contactConfig?.successMessage ||
                      "We've received your message and will be in touch shortly."}
                  </p>
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
          </div>

          {/* Right Column: Info Boxes */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Location Box */}
            <div className="relative group bg-white/10 dark:bg-white/5 backdrop-blur-md p-6 lg:p-8 rounded-xl border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
              <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              {!isMobile && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
              )}
              <div className="relative z-10">
                <MapPin className="h-6 w-6 mb-4 text-gray-800" />
                <h2 className="text-xl font-bold tracking-tight mb-4">LOCATION</h2>
                <p className="text-gray-600 mb-6">
                  {contactConfig?.locationLine1 || "123 Main Street,"}
                  <br />
                  {contactConfig?.locationLine2 || "Anytown, USA 12345"}
                </p>
                <Button variant="outline" data-testid="button-get-directions" className="w-full">
                  {contactConfig?.locationButtonText || "GET DIRECTIONS"}
                </Button>
              </div>
            </div>

            {/* Contact Box */}
            <div className="relative group bg-white/10 dark:bg-white/5 backdrop-blur-md p-6 lg:p-8 rounded-xl border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
              <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              {!isMobile && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
              )}
              <div className="relative z-10">
                <Mail className="h-6 w-6 mb-4 text-gray-800" />
                <h2 className="text-xl font-bold tracking-tight mb-4">CONTACT</h2>
                <ul className="text-gray-600 space-y-2">
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
            </div>

            {/* Trading Hours Box */}
            <div className="relative group bg-white/10 dark:bg-white/5 backdrop-blur-md p-6 lg:p-8 rounded-xl border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
              <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              {!isMobile && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
              )}
              <div className="relative z-10">
                <Clock className="h-6 w-6 mb-4 text-gray-800" />
                <h2 className="text-xl font-bold tracking-tight mb-4">TRADING HOURS</h2>
                <div className="text-gray-600 space-y-1">
                  {contactConfig?.tradingHours && contactConfig.tradingHours.length > 0 ? (
                    contactConfig.tradingHours.map((hours, index) => (
                      <p key={index}>
                        <strong>{hours.label}:</strong> <span>{hours.value}</span>
                      </p>
                    ))
                  ) : (
                    <>
                      <p>
                        <strong>Monday - Friday:</strong> <span>9:00 AM to 5:00 PM</span>
                      </p>
                      <p>
                        <strong>Saturdays:</strong> <span>10:00 AM to 2:00 PM</span>
                      </p>
                      <p>
                        <strong>Sundays:</strong> <span className="font-semibold">Closed</span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links Box */}
            <div className="relative group bg-white/10 dark:bg-white/5 backdrop-blur-md p-6 lg:p-8 rounded-xl border border-gray-800/60 dark:border-gray-900/70 shadow-[0_0_15px_rgba(255,255,255,0.15)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
              <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              {!isMobile && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
              )}
              <div className="relative z-10">
                <Share2 className="h-6 w-6 mb-4 text-gray-800" />
                <h2 className="text-xl font-bold tracking-tight mb-4">FOLLOW US</h2>
                <ul className="text-gray-600 space-y-2">
                  {contactConfig?.socialLinks &&
                  Object.keys(contactConfig.socialLinks).length > 0 ? (
                    Object.entries(contactConfig.socialLinks).map(([platform, url]) => (
                      <li key={platform}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline capitalize"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
