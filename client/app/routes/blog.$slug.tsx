import { Link, redirect } from "react-router";
import type { Route } from "./+types/blog.$slug";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { slug } = params;
  if (!slug) {
    return redirect("/blog");
  }

  const base = new URL(request.url);
  const get = (path: string) =>
    fetch(new URL(path, base).toString())
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const post = await get(`/api/blog/${slug}`);

  if (!post) {
    return redirect("/blog");
  }

  return { post };
}

export function meta({ data }: Route.MetaArgs) {
  if (!data?.post) {
    return [{ title: "Blog Post | RUN APPAREL" }];
  }
  return [
    { title: `${data.post.title} | RUN APPAREL` },
    { name: "description", content: data.post.excerpt || data.post.title },
  ];
}

export default function Component({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;

  const dateStr = new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const readTime = `${Math.max(1, Math.ceil(post.content.split(" ").length / 200))} min read`;

  return (
    <div className="w-full bg-background min-h-screen text-foreground py-24 px-4 md:px-8">
      <article className="max-w-3xl mx-auto">
        {/* Back Link */}
        <div className="mb-12">
          <Link
            to="/blog"
            className="text-brand-lime font-mono text-xs uppercase tracking-widest hover:underline"
          >
            ← BACK TO JOURNAL
          </Link>
        </div>

        {/* Post Header */}
        <header className="mb-12 border-b border-foreground/10 pb-8">
          <div className="flex items-center gap-4 text-muted-foreground font-mono text-xs mb-4">
            <span>{dateStr}</span>
            <span>·</span>
            <span>{readTime}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-6">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed italic">{post.excerpt}</p>
          )}
        </header>

        {/* Post Content */}
        <div
          className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed text-lg"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Pre-sanitized in backend
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };
