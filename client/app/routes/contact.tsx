import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { type ActionFunctionArgs, useLoaderData } from "react-router";
import { ContactInfoCardsSkeleton } from "@/components/contact/contact-info-skeleton";
import { ContactForm, type ContactConfig } from "@/components/contact/contact-form";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { getQueryClient } from "@/lib/queryClient";
import type { Route } from "./+types/contact";

const ContactInfoCards = lazy(() => import("@/components/contact/contact-info-cards"));


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact Us | Run Apparel" },
    {
      name: "description",
      content: "Get in touch with our team for inquiries, support, or partnership opportunities.",
    },
  ];
}

// Mock Contact Configuration (previously fetched from /api/contact-info)
const CONTACT_CONFIG: ContactConfig = {
  heroTitle: "DROP US A MESSAGE",
  email: "hello@runapparel.co",
  phone: "+1 (555) 123-4567",
  locationLine1: "123 Innovation Drive",
  locationLine2: "Tech Valley, CA 94043",
  locationButtonText: "GET DIRECTIONS",
  mapCoordinates: { lat: 37.422, lng: -122.084 },
  socialLinks: {
    instagram: "https://instagram.com/runapparel",
    twitter: "https://twitter.com/runapparel",
    linkedin: "https://linkedin.com/company/runapparel"
  },
  tradingHours: [
    { label: "Mon - Fri", value: "9:00 AM - 6:00 PM" },
    { label: "Sat - Sun", value: "Closed" }
  ]
};

export async function loader() {
  const queryClient = getQueryClient();
  // We can still hydrate other potential queries here if needed, 
  // but for contact-info we return it directly.
  
  return { 
    dehydratedState: dehydrate(queryClient),
    contactConfig: CONTACT_CONFIG
  };
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
  const { dehydratedState, contactConfig } = useLoaderData<typeof loader>();
  
  // SSR-safe: hook matches hydration by defaulting to false
  const isMobile = useIsMobile();

  // Previously client-side query
  // const { data: contactConfig, isLoading } = useQuery<ContactConfig>({ ... });

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="min-h-screen bg-muted/30 pt-32 pb-24 text-foreground">
        <div className="container mx-auto max-w-7xl p-6 md:p-8 lg:p-12">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5 relative z-10">
            {/* Left Column: Contact Form */}
            <ContactForm contactConfig={contactConfig} isMobile={isMobile} />

            {/* Right Column: Info Boxes */}
            <Suspense fallback={<ContactInfoCardsSkeleton />}>
              <ContactInfoCards contactConfig={contactConfig} />
            </Suspense>
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
}
