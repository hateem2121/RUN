import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { type ActionFunctionArgs, useLoaderData } from "react-router";
import { ContactInfoCardsSkeleton } from "@/components/contact/contact-info-skeleton";
import { ContactForm, type ContactConfig } from "@/components/contact/contact-form";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import type { Route } from "./+types/contact";

const ContactInfoCards = lazy(() => import("@/components/contact/contact-info-cards"));
const Footer = lazy(() => import("@/components/layout/Footer"));

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact Us | Run Apparel" },
    {
      name: "description",
      content: "Get in touch with our team for inquiries, support, or partnership opportunities.",
    },
  ];
}

export async function loader() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["/api/contact-info"],
    queryFn: () => apiRequest("/api/contact-info"),
  });
  return { dehydratedState: dehydrate(queryClient) };
}

import { submitContactInquiry } from "../services/inquiry.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const data = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    message: formData.get("message") as string,
    company: formData.get("company") as string,
    phone: formData.get("phone") as string,
    country: formData.get("country") as string,
    preferredPlatform: formData.get("preferredPlatform") as string,
    honeypot: formData.get("honeypot") as string,
  };

  try {
    const result = await submitContactInquiry(data);
    return { success: true, data: result };
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: action error logging
    console.error("Action Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Submission failed",
    };
  }
}

export default function Contact() {
  const loaderData = useLoaderData<typeof loader>();
  // SSR-safe: hook matches hydration by defaulting to false (or true based on device hint if available)
  // We remove the conditional check to fix the "Rendered more hooks" crash
  const isMobile = useIsMobile();

  const { data: contactConfig, isLoading } = useQuery<ContactConfig>({
    queryKey: ["/api/contact-info"],
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="h-12 w-12 animate-spin rounded-full border-foreground border-b-2"></div>
      </div>
    );
  }

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <div className="min-h-screen bg-muted/30 pt-32 pb-24 text-foreground">
        <div className="container mx-auto max-w-7xl p-6 md:p-8 lg:p-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {/* Left Column: Contact Form */}
            <ContactForm contactConfig={contactConfig} isMobile={isMobile} />



            {/* Right Column: Info Boxes */}
            <Suspense fallback={<ContactInfoCardsSkeleton />}>
              <ContactInfoCards contactConfig={contactConfig} />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </HydrationBoundary>
  );
}
