import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Terms of Service | RUN APPAREL" },
    { name: "description", content: "Terms of Service for RUN APPAREL (PVT) LTD." },
  ];
};

export default function TermsOfService() {
  return (
    <main className="container-centered py-32">
      <h1 className="mb-8 text-4xl font-bold font-neue-stance tracking-tighter uppercase sm:text-5xl md:text-6xl">
        Terms of Service
      </h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="font-mono text-muted-foreground tracking-widest uppercase">
          [ PROTOCOL: SERVICE_TERMS ]
        </p>
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
          Our terms of service are currently being finalized. We appreciate your patience while we document our protocols.
        </p>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground italic">
            Last Updated: February 2026
          </p>
        </div>
      </div>
    </main>
  );
}
