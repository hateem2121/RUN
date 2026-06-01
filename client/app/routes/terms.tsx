import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export async function loader() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["/api/legal-policies", "terms-of-service"],
    queryFn: () => apiRequest("/api/legal-policies?slug=terms-of-service"),
  });
  return { dehydratedState: dehydrate(queryClient) };
}

export const meta: MetaFunction = () => {
  return [
    { title: "Terms of Service | RUN APPAREL" },
    { name: "description", content: "Terms of Service for RUN APPAREL (PVT) LTD." },
  ];
};

export default function TermsOfService() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <TermsOfServicePageContent />
    </HydrationBoundary>
  );
}

interface LegalPolicyData {
  id: number;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function TermsOfServicePageContent() {
  const { data: policy } = useQuery<LegalPolicyData>({
    queryKey: ["/api/legal-policies", "terms-of-service"],
    queryFn: () => apiRequest("/api/legal-policies?slug=terms-of-service"),
    staleTime: 1000 * 60 * 5,
  });

  const title = policy?.title || "Terms of Service";
  const content =
    policy?.content ||
    "Our terms of service are currently being finalized. We appreciate your patience while we document our protocols.";
  const lastUpdated = policy?.updatedAt
    ? new Date(policy.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "February 2026";

  return (
    <main id="main-content" className="container-centered py-32 outline-none">
      <h1 className="mb-8 text-4xl font-bold font-neue-stance tracking-tighter uppercase sm:text-5xl md:text-6xl">
        {title}
      </h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="font-mono text-muted-foreground tracking-widest uppercase">
          [ PROTOCOL: SERVICE_TERMS ]
        </p>
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
          {content}
        </p>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground italic">Last Updated: {lastUpdated}</p>
        </div>
      </div>
    </main>
  );
}

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };
