import { Link, type LoaderFunctionArgs } from "react-router";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export async function loader({}: LoaderFunctionArgs) {
  throw new Response(null, { status: 404, statusText: "Not Found" });
}

export function meta() {
  return [
    { title: "Page Not Found | RUN" },
    { name: "description", content: "The page you're looking for doesn't exist." },
  ];
}

export default function NotFound() {
  return (
    <div className="flex min-h-custom-space-281 flex-col items-center justify-center gap-6 text-center">
      <Typography.H1 className="text-9xl font-bold text-primary">404</Typography.H1>
      <Typography.H2>Page Not Found</Typography.H2>
      <Typography.P className="text-muted-foreground max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </Typography.P>
      <Button asChild>
        <Link to="/">Return Home</Link>
      </Button>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="flex min-h-custom-space-282 flex-col items-center justify-center gap-6 text-center">
      <Typography.H1 className="text-9xl font-bold text-primary">Error</Typography.H1>
      <Typography.H2>Something went wrong</Typography.H2>
      <Button asChild>
        <Link to="/">Return Home</Link>
      </Button>
    </div>
  );
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}
