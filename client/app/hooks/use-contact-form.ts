import { zodResolver } from "@hookform/resolvers/zod";
import { type ContactFormData, contactFormSchema } from "@shared/validation/contact";
import { useEffect, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { type Country, countries } from "@/data/countries";
import { useToast } from "@/hooks/use-toast";
import { useServerValidation } from "@/hooks/useServerValidation";
import { ApiError } from "@/lib/api";

type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  timestamp: number;
  data?: unknown;
  error?: unknown;
};

interface UseContactFormConfig {
  successMessage?: string;
}

export function useContactForm(config?: UseContactFormConfig) {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const fetcher = useFetcher<ActionState>();
  const isPending = fetcher.state !== "idle";
  const state = fetcher.data || { status: "idle", message: "", timestamp: Date.now() };

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema) as Resolver<ContactFormData>,
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

  const apiError = useMemo(() => {
    if (state.status === "error" && state.error) {
      return new ApiError((state.error as any).status || 500, state.error as any);
    }
    return null;
  }, [state]);

  useServerValidation({ form, error: apiError });

  useEffect(() => {
    if (state.status === "success") {
      form.reset();
      setShowSuccess(true);
      toast({
        title: "Success!",
        description:
          config?.successMessage ||
          state.message ||
          "Thank you for your message. We'll get back to you soon!",
      });
    } else if (state.status === "error") {
      toast({
        title: "Error",
        description: state.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [state, form, config, toast]);

  const submitForm = (data: ContactFormData) => {
    if (data.honeypot) return;

    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const company = data.companyName || "";
    const phone = data.contactNumber || "";
    const preferredPlatform = data.platform === "Other" ? data.otherPlatform || "" : data.platform;

    const formData = new FormData();
    formData.append("name", fullName);
    formData.append("email", data.email);
    formData.append("country", data.country);
    formData.append("message", data.message);
    if (company) formData.append("company", company);
    if (phone) formData.append("phone", phone);
    if (preferredPlatform) formData.append("preferredPlatform", preferredPlatform);
    if (data.honeypot) formData.append("honeypot", data.honeypot);

    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrf_token="))
      ?.split("=")[1];
    if (csrfToken) formData.append("csrf_token", csrfToken);

    fetcher.submit(formData, { method: "post", action: "/contact" });
  };

  const setCountry = (country: Country) => {
    setSelectedCountry(country);
    form.setValue("country", country.name);
  };

  const countryOptions = useMemo(() => {
    return [...countries].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return {
    form,
    fetcher,
    isPending,
    showSuccess,
    setShowSuccess,
    selectedCountry,
    setCountry,
    submitForm,
    countryOptions,
  };
}
