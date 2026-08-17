import { lazy, Suspense } from "react";
import type { ActionFunctionArgs } from "react-router";
import { type ContactConfig, ContactForm } from "@/components/contact/contact-form";
import { ContactInfoCardsSkeleton } from "@/components/contact/contact-info-skeleton";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { Route } from "./+types/contact";

const ContactInfoCards = lazy(() =>
  import("@/components/contact/contact-info-cards").then((m) => ({ default: m.ContactInfoCards })),
);

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
  const base = new URL(request.url);
  const get = (path: string) =>
    fetch(new URL(path, base).toString())
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const [contactConfig, locations] = await Promise.all([
    get("/api/contact-info"),
    get("/api/locations"),
  ]);

  return { contactConfig, locations };
}

export async function action({ request }: ActionFunctionArgs) {
  const { submitInquiryAction } = await import("../services/inquiry.server");
  const formData = await request.formData();
  return await submitInquiryAction(request, formData);
}

type LoaderData = {
  contactConfig: ContactPageConfiguration | null;
  locations: unknown;
};

import { isRouteErrorResponse, useLoaderData, useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div className="min-h-screen bg-muted/30 pt-32 pb-24 text-foreground flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h1>
      <p className="text-muted-foreground">
        {isRouteErrorResponse(error)
          ? `${error.status} ${error.statusText}`
          : "An unexpected error occurred."}
      </p>
    </div>
  );
}

export default function Component({ loaderData }: { loaderData?: LoaderData }) {
  const hookData = useLoaderData<typeof loader>();
  const effectiveData = loaderData || hookData;
  const contactConfig = effectiveData?.contactConfig ?? null;
  const isMobile = useIsMobile();

  return <ContactContent contactConfig={contactConfig} isMobile={isMobile} />;
}

import type { ContactPageConfiguration } from "@shared/index";

function ContactContent({
  contactConfig,
  isMobile,
}: {
  contactConfig: ContactPageConfiguration | null;
  isMobile: boolean;
}) {
  return (
    <div className="min-h-screen bg-muted/30 pt-32 pb-24 text-foreground">
      <div className="container mx-auto max-w-7xl p-6 md:p-8 lg:p-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5 relative z-10">
          <ContactForm
            contactConfig={contactConfig as unknown as ContactConfig}
            isMobile={isMobile}
          />
          <Suspense fallback={<ContactInfoCardsSkeleton />}>
            <ContactInfoCards contactConfig={contactConfig as unknown as ContactConfig} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export function HydrateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
