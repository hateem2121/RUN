import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { type ActionFunctionArgs, useLoaderData } from "react-router";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactInfoCardsSkeleton } from "@/components/contact/contact-info-skeleton";
import { ClientOnly } from "@/components/shared/ClientOnly";
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

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = getQueryClient();

  // Use protocol and host from request to build a dynamic base URL for server-side fetch
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    await queryClient.prefetchQuery({
      queryKey: ["/api/contact-info"],
      queryFn: () => fetch(`${baseUrl}/api/contact-info`).then((res) => res.json()),
    });
  } catch (_error) {
    console.error("[Contact] Failed to prefetch contact info:", _error);
  }

  return {
    dehydratedState: dehydrate(queryClient),
  };
}

import { submitInquiryAction } from "../services/inquiry.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  // Use the shared server action adapter to ensure consistent validation and response format
  return await submitInquiryAction(null, formData);
}

export default function Contact() {
  const { dehydratedState } = useLoaderData<typeof loader>();
  const isMobile = useIsMobile();

  return (
    <HydrationBoundary state={dehydratedState}>
      <ClientOnly fallback={
        <div className="min-h-screen bg-muted/30 pt-32 pb-24 text-foreground">
          <div className="container mx-auto max-w-7xl p-6 md:p-8 lg:p-12">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5 relative z-10">
              <div className="col-span-1 md:col-span-2 lg:col-span-3 h-[600px] bg-card/50 animate-pulse rounded-xl" />
              <ContactInfoCardsSkeleton />
            </div>
          </div>
        </div>
      }>
        <ContactContent isMobile={isMobile} />
      </ClientOnly>
    </HydrationBoundary>
  );
}

import type { ContactPageConfiguration } from "@shared/index";
import { useQuery } from "@tanstack/react-query";

function ContactContent({ isMobile }: { isMobile: boolean }) {
  const { data: contactConfig, isLoading } = useQuery<ContactPageConfiguration>({
    queryKey: ["/api/contact-info"],
  });

  if (isLoading || !contactConfig) {
    return (
      <div className="min-h-screen bg-muted/30 pt-32 pb-24 text-foreground">
        <div className="container mx-auto max-w-7xl p-6 md:p-8 lg:p-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5 relative z-10">
            <div className="col-span-1 md:col-span-2 lg:col-span-3 h-[600px] bg-card/50 animate-pulse rounded-xl" />
            <ContactInfoCardsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pt-32 pb-24 text-foreground">
      <div className="container mx-auto max-w-7xl p-6 md:p-8 lg:p-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5 relative z-10">
          <ContactForm contactConfig={contactConfig as any} isMobile={isMobile} />
          <Suspense fallback={<ContactInfoCardsSkeleton />}>
            <ContactInfoCards contactConfig={contactConfig as any} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
