import { zodResolver } from "@hookform/resolvers/zod";
import { type ContactFormData, ContactFormSchema } from "@shared/validation/contact";
import { useEffect, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { useFetcher } from "react-router";
import { type Country, countries } from "@/data/countries";
import { useToast } from "@/hooks/use-toast";
import { useServerValidation } from "@/hooks/useServerValidation";
import { ApiError } from "@/lib/api";

interface ActionState {
  status: "idle" | "success" | "error";
  message: string;
  timestamp: number;
  data?: {
    submissionId?: string;
  };
  error?: {
    status?: number;
    title?: string;
    message?: string;
    "invalid-params"?: Record<string, string[]>;
  };
}

interface UseContactFormConfig {
  successMessage?: string;
}

declare global {
  interface Window {
    grecaptcha?: {
      getResponse: () => string;
      reset: () => void;
    };
  }
}

export function useContactForm(config?: UseContactFormConfig) {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const fetcher = useFetcher<ActionState>();
  const isPending = fetcher.state !== "idle";
  const state = fetcher.data || { status: "idle", message: "", timestamp: Date.now() };

  const form = useForm<ContactFormData>({
    resolver: zodResolver(ContactFormSchema) as Resolver<ContactFormData>,
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

  // PHASE 4 REMEDIATION: Pre-warm Cloud Task pipeline on form focus
  useEffect(() => {
    const handleFocus = () => {
      // Trigger a light-weight pre-warm request to the contact endpoint
      // This initializes server-side connection pools for Google Cloud Clients
      fetch("/api/contact", { method: "HEAD", priority: "low" }).catch(() => {});
    };

    window.addEventListener("focus", handleFocus, { once: true });
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const apiError = useMemo(() => {
    if (state.status === "error" && state.error) {
      return new ApiError(state.error.status || 500, state.error);
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

    // reCAPTCHA Token (PHASE 4 REMEDIATION)
    const recaptchaToken = window.grecaptcha?.getResponse?.() || "";
    if (recaptchaToken) formData.append("recaptchaToken", recaptchaToken);

    if (csrfToken) formData.append("csrf_token", csrfToken);

    fetcher.submit(formData, {
      method: "post",
      action: "/contact",
    });
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
