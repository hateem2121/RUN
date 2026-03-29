import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, GlassCardDecorations } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { useContactForm } from "@/hooks/use-contact-form";
import { ContactFields } from "./ContactFields";
import { ContactSuccess } from "./ContactSuccess";

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
  const {
    form,
    isPending,
    showSuccess,
    setShowSuccess,
    selectedCountry,
    setCountry,
    submitForm,
    countryOptions,
  } = useContactForm({
    successMessage: contactConfig?.successMessage || "Your message has been sent successfully.",
  });

  const platformOptions = contactConfig?.platformOptions || [
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
              onSubmit={form.handleSubmit(submitForm)}
              className="space-y-5"
              data-testid="form-contact"
            >
              <ContactFields
                form={form}
                isPending={isPending}
                countryOptions={countryOptions}
                selectedCountry={selectedCountry}
                onCountryChange={setCountry}
                platformOptions={platformOptions}
              />

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  data-testid="button-submit"
                  disabled={isPending}
                  size="lg"
                  className="h-12 w-full bg-primary font-semibold text-primary-foreground shadow-md hover:shadow-lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    contactConfig?.formButtonText || "Get a Response Within 24 Hours"
                  )}
                </Button>
                <Typography.P className="mt-4 text-center text-muted-foreground text-xs">
                  {contactConfig?.formPrivacyText ||
                    "We value your privacy and will never share your information."}
                </Typography.P>
              </div>
            </form>
          </div>
        ) : (
          <ContactSuccess
            heading={contactConfig?.successHeading || "Message Sent!"}
            message={contactConfig?.successMessage || "Your message has been sent successfully."}
            onReset={() => setShowSuccess(false)}
          />
        )}
      </div>
    </Card>
  );
}
