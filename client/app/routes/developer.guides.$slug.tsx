import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Copy, ShieldCheck, Webhook } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { useLoaderData } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { Route } from "./+types/developer.guides.$slug";

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  const validSlugs = ["authentication", "webhooks"];
  if (!slug || !validSlugs.includes(slug!)) {
    throw new Response("Guide not found", { status: 404 });
  }
  return { slug };
}

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };

export function GuidePage() {
  const { slug } = useLoaderData<typeof loader>();
  const authRef = useRef<HTMLDivElement>(null);
  const webhooksRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (slug === "authentication" && authRef.current) {
      gsap.from(authRef.current, { opacity: 0, x: 20, duration: 0.5 });
    } else if (slug === "webhooks" && webhooksRef.current) {
      gsap.from(webhooksRef.current, { opacity: 0, x: 20, duration: 0.5 });
    }
  }, [slug]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (slug === "authentication") {
    return (
      <div ref={authRef} className="space-y-8">
        <div>
          <Badge className="mb-4">Security</Badge>
          <Typography.H1>API Authentication</Typography.H1>
          <Typography.P className="text-muted-foreground">
            Learn how to securely authenticate your requests to the RUN Remix API.
          </Typography.P>
        </div>

        <section className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
            <ShieldCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <Typography.P className="text-sm font-medium">
              We support two authentication methods depending on your integration type.
            </Typography.P>
          </div>

          <div className="space-y-4">
            <Typography.H2>1. Session-Based (Browser)</Typography.H2>
            <Typography.P>
              Primary method for the CMS dashboard. Uses Google OAuth 2.0 to establish a secure
              session.
            </Typography.P>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Entry Point: <code>GET /api/login</code>
              </li>
              <li>
                Storage: Secure HttpOnly cookies (<code>connect.sid</code>)
              </li>
              <li>Automatic CSRF protection</li>
            </ul>
          </div>

          <div className="space-y-4 pt-4">
            <Typography.H2>2. Bearer Token (M2M)</Typography.H2>
            <Typography.P>
              Used for server-to-server communication or custom applications.
            </Typography.P>
            <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm text-white group relative">
              <span className="text-gray-500">Authorization: </span>
              <span className="text-blue-400">Bearer </span>
              <span className="text-green-400">{"<your_access_token>"}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-white hover:bg-white/10"
                onClick={() => copyToClipboard("Authorization: Bearer <your_access_token>")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="p-8 rounded-2xl bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
          <Typography.H3 className="mb-4">Need an API Token?</Typography.H3>
          <Typography.P className="mb-6">
            API tokens are currently issued manually. Please contact our business development team
            to request access.
          </Typography.P>
          <Button asChild>
            <a href="mailto:team@wear-run.com">
              Contact Support <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </section>
      </div>
    );
  }

  if (slug === "webhooks") {
    return (
      <div ref={webhooksRef} className="space-y-8">
        <div>
          <Badge className="mb-4">Automation</Badge>
          <Typography.H1>Webhooks Guide</Typography.H1>
          <Typography.P className="text-muted-foreground">
            Stay in sync with real-time notifications for CMS events.
          </Typography.P>
        </div>

        <section className="space-y-6">
          <Typography.H2>Security & Verification</Typography.H2>
          <Typography.P>
            All webhook requests include an <code>X-Run-Signature</code> header. You must verify
            this to ensure the request is legitimate.
          </Typography.P>
          <Card className="bg-neutral-900 overflow-hidden">
            <CardHeader className="border-b border-white/10 bg-white/5 py-3">
              <div className="flex items-center gap-2 text-white">
                <Webhook className="h-4 w-4" />
                <span className="text-xs font-medium">Verify Signature (Node.js)</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="p-4 font-mono text-xs text-blue-300 overflow-x-auto">
                {`const crypto = require('crypto');

function verify(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === signature;
}`}
              </pre>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Typography.H2>Supported Events</Typography.H2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "product.created",
              "product.updated",
              "product.deleted",
              "category.created",
              "category.updated",
              "category.deleted",
              "media.uploaded",
              "inquiry.created",
            ].map((event) => (
              <div
                key={event}
                className="p-3 rounded-lg border bg-card flex items-center justify-between"
              >
                <code className="text-xs text-blue-600 dark:text-blue-400">{event}</code>
                <Badge variant="outline" className="text-[10px]">
                  Active
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return null; // Should never reach here due to loader check
}

function Badge({
  children,
  className,
  variant,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variant === "outline"
          ? "border text-foreground"
          : "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        className,
      )}
    >
      {children}
    </span>
  );
}
