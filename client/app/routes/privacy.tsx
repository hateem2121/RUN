import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy | RUN APPAREL" },
    { name: "description", content: "Privacy Policy for RUN APPAREL (PVT) LTD." },
  ];
};

export default function PrivacyPolicy() {
  return (
    <main className="container-centered py-32">
      <h1 className="mb-8 text-4xl font-bold font-neue-stance tracking-tighter uppercase sm:text-5xl md:text-6xl">
        Privacy Policy
      </h1>
      <div className="prose dark:prose-invert max-w-none">
        <p className="font-mono text-muted-foreground tracking-widest uppercase">
          [ PROTOCOL: DATA_PROTECTION ]
        </p>
        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
          Our privacy policy is currently being updated to reflect the latest international
          standards in data protection. Please check back soon for the full version.
        </p>
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground italic">Last Updated: February 2026</p>
        </div>
      </div>
    </main>
  );
}
