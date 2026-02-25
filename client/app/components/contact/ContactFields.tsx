import type { ContactFormData } from "@shared/validation/contact";
import type { UseFormReturn } from "react-hook-form";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import type { Country } from "@/data/countries";

interface ContactFieldsProps {
  form: UseFormReturn<ContactFormData>;
  isPending: boolean;
  countryOptions: Country[];
  selectedCountry: Country | null;
  onCountryChange: (country: Country) => void;
  platformOptions: string[];
}

export function ContactFields({
  form,
  isPending,
  countryOptions,
  selectedCountry,
  onCountryChange,
  platformOptions,
}: ContactFieldsProps) {
  const { register, formState, setValue, watch } = form;
  const { errors } = formState;

  const selectedPlatform = watch("platform");
  const showOtherPlatform = selectedPlatform === "Other";

  return (
    <div className="space-y-5">
      {/* Name Fields */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="firstName" className="mb-2 block font-medium text-foreground text-sm">
            First Name{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="firstName"
            data-testid="input-first-name"
            size="lg"
            aria-required="true"
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
            {...register("firstName")}
            disabled={isPending}
          />
          {errors.firstName && (
            <Typography.P id="firstName-error" className="mt-2 text-destructive text-sm">
              {errors.firstName.message}
            </Typography.P>
          )}
        </div>
        <div>
          <Label htmlFor="lastName" className="mb-2 block font-medium text-foreground text-sm">
            Last Name{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="lastName"
            data-testid="input-last-name"
            size="lg"
            aria-required="true"
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            {...register("lastName")}
            disabled={isPending}
          />
          {errors.lastName && (
            <Typography.P id="lastName-error" className="mt-2 text-destructive text-sm">
              {errors.lastName.message}
            </Typography.P>
          )}
        </div>
      </div>

      {/* Work Information */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="jobTitle" className="mb-2 block font-medium text-foreground text-sm">
            Job Title
          </Label>
          <Input
            id="jobTitle"
            data-testid="input-job-title"
            size="lg"
            aria-invalid={!!errors.jobTitle}
            {...register("jobTitle")}
            disabled={isPending}
          />
        </div>
        <div>
          <Label htmlFor="companyName" className="mb-2 block font-medium text-foreground text-sm">
            Company Name
          </Label>
          <Input
            id="companyName"
            data-testid="input-company-name"
            size="lg"
            aria-invalid={!!errors.companyName}
            {...register("companyName")}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Email and Country */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="email" className="mb-2 block font-medium text-foreground text-sm">
            Email Address{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="email"
            type="email"
            data-testid="input-email"
            size="lg"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
            disabled={isPending}
          />
          {errors.email && (
            <Typography.P id="email-error" className="mt-2 text-destructive text-sm">
              {errors.email.message}
            </Typography.P>
          )}
        </div>
        <div>
          <Label
            id="country-label"
            htmlFor="country-select"
            className="mb-2 block font-medium text-foreground text-sm"
          >
            Country{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <div className="relative">
            <CustomSelect
              id="country-select"
              aria-labelledby="country-label"
              value={selectedCountry}
              options={countryOptions}
              onChange={onCountryChange}
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
              aria-required="true"
              aria-invalid={!!errors.country}
              aria-describedby={errors.country ? "country-error" : undefined}
            />
          </div>
          {errors.country && (
            <Typography.P id="country-error" className="mt-2 text-destructive text-sm">
              {errors.country.message}
            </Typography.P>
          )}
        </div>
      </div>

      {/* Platform and Contact Number */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label
            id="platform-label"
            htmlFor="platform-select"
            className="mb-2 block font-medium text-foreground text-sm"
          >
            Preferred Platform
          </Label>
          <div className="relative">
            <CustomSelect
              id="platform-select"
              aria-labelledby="platform-label"
              value={selectedPlatform || null}
              options={platformOptions}
              onChange={(p) => setValue("platform", p)}
              getLabel={(p) => p}
              getKey={(p) => p}
              placeholder="Select Platform"
              data-testid="button-platform-dropdown"
            />
          </div>
        </div>
        <div>
          <Label
            id="contact-number-label"
            htmlFor="contactNumber"
            className="mb-2 block font-medium text-foreground text-sm"
          >
            Contact Number / Handle
          </Label>
          <div className="flex items-center overflow-hidden rounded-lg border border-border shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary h-12">
            <span
              id="country-prefix"
              className="inline-flex items-center border-border border-r bg-muted px-3 text-foreground/80 sm:text-sm h-full"
            >
              {selectedCountry ? `+${selectedCountry.phone}` : "--"}
            </span>
            <Input
              id="contactNumber"
              data-testid="input-contact-number"
              aria-labelledby="contact-number-label country-prefix"
              aria-invalid={!!errors.contactNumber}
              {...register("contactNumber")}
              variant="ghost"
              className="flex-1 border-0 bg-transparent p-3 h-full"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Other Platform */}
      {showOtherPlatform && (
        <div>
          <Label htmlFor="otherPlatform" className="mb-2 block font-medium text-foreground text-sm">
            Please specify platform
          </Label>
          <Input
            id="otherPlatform"
            data-testid="input-other-platform"
            size="lg"
            aria-invalid={!!errors.otherPlatform}
            {...register("otherPlatform")}
            disabled={isPending}
          />
        </div>
      )}

      {/* Message */}
      <div>
        <Label htmlFor="message" className="mb-2 block font-medium text-foreground text-sm">
          Message{" "}
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        </Label>
        <Textarea
          id="message"
          data-testid="textarea-message"
          rows={5}
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
          className="block w-full rounded-lg border-border p-3 shadow-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary min-h-[120px]"
          disabled={isPending}
        />
        {errors.message && (
          <Typography.P id="message-error" className="mt-2 text-red-500 text-sm">
            {errors.message.message}
          </Typography.P>
        )}
      </div>

      {/* Contact Preference */}
      <div>
        <Label
          id="contact-preference-label"
          className="mb-2 block font-medium text-foreground text-sm"
        >
          How should we contact you?
        </Label>
        <div
          className="flex items-center space-x-6"
          role="radiogroup"
          aria-labelledby="contact-preference-label"
        >
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              name="contactPreference"
              value="email"
              id="contact-pref-email"
              defaultChecked
              onChange={() => setValue("contactPreference", "email")}
              disabled={isPending}
              aria-label="Contact via email"
              className="h-4 w-4 border-border text-primary focus:ring-2 focus:ring-primary accent-primary"
            />
            <Label htmlFor="contact-pref-email" className="text-sm">
              Email
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              name="contactPreference"
              value="platform"
              id="contact-pref-platform"
              onChange={() => setValue("contactPreference", "platform")}
              disabled={isPending}
              aria-label="Contact via preferred platform"
              className="h-4 w-4 border-border text-primary focus:ring-2 focus:ring-primary accent-primary"
            />
            <Label htmlFor="contact-pref-platform" className="text-sm">
              Your Preferred Platform
            </Label>
          </div>
        </div>
      </div>

      {/* Honeypot */}
      <div className="sr-only" aria-hidden="true">
        <Label htmlFor="honeypot">Do not fill this out if you are human:</Label>
        <Input id="honeypot" {...register("honeypot")} tabIndex={-1} />
      </div>
    </div>
  );
}
