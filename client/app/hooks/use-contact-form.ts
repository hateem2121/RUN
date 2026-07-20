import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { type Country, countries } from "@/data/countries";

interface ActionState {
  success?: boolean;
  message?: string;
  error?: string;
  submissionId?: string;
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

async function submitAction(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const honeypot = formData.get("honeypot");
  if (honeypot) {
    return { success: true, message: "Message received." };
  }

  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf_token="))
    ?.split("=")[1];

  const recaptchaToken =
    (typeof window !== "undefined" && window.grecaptcha?.getResponse?.()) || "";

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();

  const payload = {
    name: fullName,
    email: formData.get("email") as string,
    message: formData.get("message") as string,
    company: (formData.get("companyName") as string) || undefined,
    country: formData.get("country") as string,
    phone: (formData.get("contactNumber") as string) || undefined,
    preferredPlatform:
      formData.get("platform") === "Other"
        ? (formData.get("otherPlatform") as string) || undefined
        : (formData.get("platform") as string) || undefined,
    recaptchaToken,
  };

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (_err) {
    return { success: false, error: "Failed to connect to the server." };
  }
}

export function useContactForm(config?: UseContactFormConfig) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("Phone Call");

  const [state, formAction, isPending] = useActionState(submitAction, null);

  // PHASE 4 REMEDIATION: Pre-warm Cloud Task pipeline on form focus
  useEffect(() => {
    const handleFocus = () => {
      fetch("/api/contact", { method: "HEAD", priority: "low" }).catch(() => {});
    };

    window.addEventListener("focus", handleFocus, { once: true });
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      setShowSuccess(true);
      toast.success("Success!", {
        description:
          config?.successMessage ||
          state.message ||
          "Thank you for your message. We'll get back to you soon!",
      });
      if (window.grecaptcha) window.grecaptcha.reset();
    } else if (state.error) {
      toast.error("Error", {
        description: state.error || "Failed to send message. Please try again.",
      });
    }
  }, [state, config?.successMessage]);

  const setCountry = (country: Country) => {
    setSelectedCountry(country);
  };

  const countryOptions = useMemo(() => {
    return [...countries].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const handleAgentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const nativeEvent = event.nativeEvent as unknown as {
      agentInvoked?: boolean;
      respondWith?: (result: Promise<string>) => void;
    };
    if (nativeEvent.agentInvoked && nativeEvent.respondWith) {
      const formData = new FormData(event.currentTarget);
      const resultPromise = submitAction(state, formData).then((res) => {
        if (res.success) return "Successfully submitted contact form.";
        return "Error: " + (res.error || "Failed to submit.");
      });
      nativeEvent.respondWith(resultPromise);
      event.preventDefault();
    }
  };

  return {
    formAction,
    handleAgentSubmit,
    isPending,
    showSuccess,
    setShowSuccess,
    selectedCountry,
    setCountry,
    selectedPlatform,
    setSelectedPlatform,
    countryOptions,
    state,
  };
}
