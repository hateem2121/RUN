import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export async function loader() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["/api/legal-policies", "privacy-policy"],
    queryFn: () => apiRequest("/api/legal-policies?slug=privacy-policy"),
  });
  return { dehydratedState: dehydrate(queryClient) };
}

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy | RUN APPAREL" },
    { name: "description", content: "Privacy Policy for RUN APPAREL (PVT) LTD." },
  ];
};

export default function PrivacyPolicy() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <PrivacyPolicyPageContent />
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

function PrivacyPolicyPageContent() {
  const { data: policy } = useQuery<LegalPolicyData>({
    queryKey: ["/api/legal-policies", "privacy-policy"],
    queryFn: () => apiRequest("/api/legal-policies?slug=privacy-policy"),
    staleTime: 1000 * 60 * 5,
  });

  const title = policy?.title || "Privacy Policy";
  const content =
    policy?.content ||
    "Our privacy policy is currently being updated to reflect the latest international standards in data protection. Please check back soon for the full version.";
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
          [ PROTOCOL: DATA_PROTECTION ]
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
