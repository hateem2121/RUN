import DOMPurify from "isomorphic-dompurify";
import type { MetaFunction } from "react-router";
import type { Route } from "./+types/privacy";

export async function loader({ request }: Route.LoaderArgs) {
  const base = new URL(request.url);
  const get = (path: string) =>
    fetch(new URL(path, base).toString())
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const policy = await get("/api/legal-policies?slug=privacy-policy");

  return { policy };
}

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy | RUN APPAREL" },
    { name: "description", content: "Privacy Policy for RUN APPAREL (PVT) LTD." },
  ];
};

interface LegalPolicyData {
  id: number;
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PrivacyPolicy({ loaderData }: Route.ComponentProps) {
  const { policy } = loaderData;

  return <PrivacyPolicyPageContent policy={policy} />;
}

function PrivacyPolicyPageContent({ policy }: { policy: LegalPolicyData | null }) {
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
        <div
          className="mt-8 text-lg leading-relaxed text-muted-foreground"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized via DOMPurify
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
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
