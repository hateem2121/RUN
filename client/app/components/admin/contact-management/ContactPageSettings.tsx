import { zodResolver } from "@hookform/resolvers/zod";
import { type ContactContentForm, contactContentFormSchema } from "@shared/validation/contact";
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
import {
  type FieldErrors,
  type Resolver,
  type SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
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
    resolver: zodResolver(contactContentFormSchema) as Resolver<ContactContentForm>,
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
    mutationFn: (data: ContactContentForm) => {
      const sanitizedData = {
        ...data,
        socialLinks: Object.fromEntries(
          Object.entries(data.socialLinks || {}).filter(([_, url]) => url && url.trim() !== ""),
        ),
        tradingHours: (data.tradingHours || []).filter((hour) => hour.label && hour.value),
      };

      if (config?.id) {
        return apiRequest("/api/admin/contact-page-configuration", {
          method: "PATCH",
          body: JSON.stringify(sanitizedData),
        });
      } else {
        return apiRequest("/api/admin/contact-page-configuration", {
          method: "POST",
          body: JSON.stringify(sanitizedData),
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact page content.",
        variant: "destructive",
      });
    },
  });

  const onSubmit: SubmitHandler<ContactContentForm> = (data) => {
    saveMutation.mutate(data);
  };

  const onInvalid = (_errors: FieldErrors<ContactContentForm>) => {
    toast({
      title: "Validation Error",
      description: "Please check all required fields are filled correctly.",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
          <p className="text-admin-muted text-sm font-bold tracking-wider uppercase">
            Loading contact settings...
          </p>
        </div>
      </div>
    );
  }

  const isDirty = form.formState.isDirty;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Mail className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-white tracking-tight">Contact Configuration</h1>
            <p className="text-admin-muted text-sm">
              Manage all content displayed on the global contact page
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {saveMutation.isSuccess && (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-bold uppercase tracking-widest text-xxs">Saved</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/contact", "_blank")}
            data-testid="button-preview"
            className="h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-4 transition-colors"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            onClick={() => form.reset()}
            disabled={!isDirty || saveMutation.isPending}
            data-testid="button-reset"
            className="h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-4 transition-colors"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit, onInvalid)}
            disabled={!isDirty || saveMutation.isPending}
            data-testid="button-save"
            className="h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 shadow-[0_0_20px_rgba(37,99,235,0.2)] font-bold uppercase tracking-widest text-xxs outline-none border-0 transition-all active:scale-95"
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
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <Accordion
          type="multiple"
          defaultValue={["hero", "location", "contact"]}
          className="space-y-4"
        >
          {/* Hero Section */}
          <AccordionItem value="hero" className="border-white/10">
            <AccordionTrigger className="font-semibold text-lg text-white hover:text-blue-400 transition-colors">
              Hero Section
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-inner mt-4">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="heroTitle" className="text-white/90">
                        Hero Heading
                      </Label>
                      <Input
                        id="heroTitle"
                        {...form.register("heroTitle")}
                        placeholder="DROP US A LINE"
                        maxLength={100}
                        data-testid="input-hero-title"
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
                      />
                      {form.formState.errors.heroTitle && (
                        <p className="mt-1 text-red-500 text-sm">
                          {form.formState.errors.heroTitle.message}
                        </p>
                      )}
                      <p className="mt-1 text-admin-muted text-sm">
                        Large heading displayed at the top of the contact page
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Location Information */}
          <AccordionItem value="location" className="border-white/10">
            <AccordionTrigger className="font-semibold text-lg text-white hover:text-blue-400 transition-colors">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                Location Information
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-inner mt-4">
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="locationLine1" className="text-white/90">
                      Address Line 1
                    </Label>
                    <Input
                      id="locationLine1"
                      {...form.register("locationLine1")}
                      placeholder="123 Main Street"
                      data-testid="input-location-line1"
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationLine2" className="text-white/90">
                      Address Line 2
                    </Label>
                    <Input
                      id="locationLine2"
                      {...form.register("locationLine2")}
                      placeholder="Anytown, USA 12345"
                      data-testid="input-location-line2"
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="locationButtonText" className="text-white/90">
                      Directions Button Text
                    </Label>
                    <Input
                      id="locationButtonText"
                      {...form.register("locationButtonText")}
                      placeholder="GET DIRECTIONS"
                      data-testid="input-location-button-text"
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
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
          <AccordionItem value="contact" className="border-white/10">
            <AccordionTrigger className="font-semibold text-lg text-white hover:text-blue-400 transition-colors">
              <span className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-400" />
                Contact Details
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-inner mt-4">
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="email" className="text-white/90">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="info@example.com"
                      data-testid="input-email"
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
                    />
                    {form.formState.errors.email && (
                      <p className="mt-1 text-red-500 text-sm">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white/90">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      placeholder="(123) 456-7890"
                      data-testid="input-phone"
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Trading Hours */}
          <AccordionItem value="hours" className="border-white/10">
            <AccordionTrigger className="font-semibold text-lg text-white hover:text-blue-400 transition-colors">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Trading Hours
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-inner mt-4">
                <CardContent className="space-y-4 pt-6">
                  {hoursFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-black/20 p-4 md:grid-cols-2"
                    >
                      <div>
                        <Label className="text-white/90">Day(s)</Label>
                        <Input
                          {...form.register(`tradingHours.${index}.label`)}
                          placeholder="e.g., Monday - Friday"
                          data-testid={`input-hours-label-${index}`}
                          className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
                        />
                        {form.formState.errors.tradingHours?.[index]?.label && (
                          <p className="mt-1 text-red-500 text-sm">
                            {form.formState.errors.tradingHours[index]?.label?.message}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-white/90">Hours</Label>
                          <Input
                            {...form.register(`tradingHours.${index}.value`)}
                            placeholder="e.g., 9:00 AM to 5:00 PM"
                            data-testid={`input-hours-value-${index}`}
                            className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
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
                          className="mt-8 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20 rounded-xl transition-colors h-11 w-11"
                          data-testid={`button-remove-hours-${index}`}
                          aria-label="Remove trading hours"
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
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-4 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Trading Hours
                  </Button>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Social Links */}
          <AccordionItem value="social" className="border-white/10">
            <AccordionTrigger className="font-semibold text-lg text-white hover:text-blue-400 transition-colors">
              <span className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-400" />
                Social Media Links
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-inner mt-4">
                <CardContent className="space-y-4 pt-6">
                  {["facebook", "instagram", "twitter", "linkedin"].map((platform) => (
                    <div key={platform}>
                      <Label htmlFor={platform} className="capitalize text-white/90">
                        {platform}
                      </Label>
                      <Input
                        id={platform}
                        type="url"
                        {...form.register(`socialLinks.${platform}`)}
                        placeholder={`https://${platform}.com/...`}
                        data-testid={`input-social-${platform}`}
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
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
          <AccordionItem value="platforms" className="border-white/10">
            <AccordionTrigger className="font-semibold text-lg text-white hover:text-blue-400 transition-colors">
              Platform Options
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-inner mt-4">
                <CardContent className="pt-6">
                  <div>
                    <Label className="text-white/90">Available Communication Platforms</Label>
                    <p className="mb-3 text-admin-muted text-sm mt-1">
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
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50"
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
          <AccordionItem value="form" className="border-white/10">
            <AccordionTrigger className="font-semibold text-lg text-white hover:text-blue-400 transition-colors">
              Form Configuration
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-inner mt-4">
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="formButtonText" className="text-white/90">
                      Submit Button Text
                    </Label>
                    <Input
                      id="formButtonText"
                      {...form.register("formButtonText")}
                      placeholder="Get a Response Within 24 Hours"
                      data-testid="input-form-button-text"
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="formPrivacyText" className="text-white/90">
                      Privacy Notice
                    </Label>
                    <Textarea
                      id="formPrivacyText"
                      {...form.register("formPrivacyText")}
                      rows={3}
                      placeholder="We value your privacy and will never share your information."
                      data-testid="textarea-form-privacy-text"
                      className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Success Message */}
          <AccordionItem value="success" className="border-white/10">
            <AccordionTrigger className="font-semibold text-lg text-white hover:text-blue-400 transition-colors">
              Success Message
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-inner mt-4">
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="successHeading" className="text-white/90">
                      Success Heading
                    </Label>
                    <Input
                      id="successHeading"
                      {...form.register("successHeading")}
                      placeholder="Thank you!"
                      data-testid="input-success-heading"
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 mt-2"
                    />
                    {form.formState.errors.successHeading && (
                      <p className="mt-1 text-red-500 text-sm">
                        {form.formState.errors.successHeading.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="successMessage" className="text-white/90">
                      Success Message
                    </Label>
                    <Textarea
                      id="successMessage"
                      {...form.register("successMessage")}
                      rows={4}
                      placeholder="We've received your message and will be in touch shortly."
                      data-testid="textarea-success-message"
                      className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 mt-2"
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
      <div className="sticky bottom-6 rounded-2xl border border-white/10 bg-surface-black/80 backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-20">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="text-admin-muted text-sm font-medium">
            {isDirty ? "You have unsaved changes" : "All changes saved"}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => form.reset()}
              disabled={!isDirty || saveMutation.isPending}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl px-4 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit, onInvalid)}
              disabled={!isDirty || saveMutation.isPending}
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 shadow-[0_0_20px_rgba(37,99,235,0.2)] font-bold uppercase tracking-widest text-xxs outline-none border-0 transition-all active:scale-95"
            >
              {saveMutation.isPending ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
