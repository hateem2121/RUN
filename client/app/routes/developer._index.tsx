import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Copy, ExternalLink, Shield, Terminal, Zap } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export function Component() {
  const ref = useRef<HTMLDivElement>(null);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useGSAP(
    () => {
      gsap.from(ref.current, { opacity: 0, y: 20, duration: 0.5 });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="space-y-8">
      <div>
        <Typography.H1 className="mb-4">Getting Started</Typography.H1>
        <Typography.P className="text-lg text-muted-foreground">
          Welcome to the RUN Remix API. Our API provides programmatic access to the sportswear
          manufacturing CMS, allowing you to manage products, categories, media, and inquiries.
        </Typography.P>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <CardHeader>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Shield className="h-5 w-5" />
              <CardTitle className="text-lg">Secure & Reliable</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography.P className="text-sm">
              Built on Express 5 and PostgreSQL, ensuring high performance and data integrity for
              your B2B operations.
            </Typography.P>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Zap className="h-5 w-5" />
              <CardTitle className="text-lg">Real-time Updates</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Typography.P className="text-sm">
              Use our robust Webhook system to stay synced with catalog changes and new inquiries
              instantly.
            </Typography.P>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <Typography.H2>Base URL</Typography.H2>
        <Typography.P>All API requests should be made to:</Typography.P>
        <div className="flex items-center gap-2 bg-muted p-4 rounded-lg font-mono text-sm group relative">
          <code>https://wear-run.com/api</code>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => copyToClipboard("https://wear-run.com/api")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <Typography.H2>Authentication</Typography.H2>
        <Typography.P>
          RUN Remix supports Session-based (for CMS dashboard) and Bearer Token (for API/SDK)
          authentication.
        </Typography.P>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <a href="/developer/guides/authentication">
              View Auth Guide <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <Typography.H2>Explore the API</Typography.H2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Typography.H3>Interactive Playground</Typography.H3>
                <Typography.P className="text-sm text-muted-foreground">
                  Test API calls directly from your browser against our staging environment.
                </Typography.P>
              </div>
              <Button asChild>
                <a href="/developer/playground">
                  Launch Playground <Terminal className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
