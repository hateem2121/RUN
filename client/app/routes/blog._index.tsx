import { Link } from "react-router";
import type { Route } from "./+types/blog._index";

export async function loader({ request }: Route.LoaderArgs) {
  const base = new URL(request.url);
  const get = (path: string) =>
    fetch(new URL(path, base).toString())
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);

  const posts = await get("/api/blog?published=true");
  return { posts };
}

export function meta() {
  return [
    { title: "Journal | RUN APPAREL" },
    { name: "description", content: "Insights on sustainable sportswear manufacturing." },
  ];
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  publishedAt: string | null;
  createdAt: string;
}

export default function Component({ loaderData }: Route.ComponentProps) {
  const { posts } = loaderData;
  const activePosts = posts || [];

  return (
    <div className="w-full bg-background min-h-screen text-foreground py-24 px-4 md:px-8">
      <div className="max-w-container-2xl mx-auto">
        {/* Header */}
        <div className="mb-16 border-b border-foreground/10 pb-8">
          <p className="text-brand-lime font-mono text-xs tracking-widest uppercase mb-2">
            RUN INSIGHTS
          </p>
          <h1 className="text-custom-space-286 leading-custom-misc-472 font-bold uppercase md:text-custom-space-287 tracking-tighter">
            BLOG & STORIES
          </h1>
        </div>

        {activePosts.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-foreground/10 rounded-2xl">
            <p className="text-muted-foreground font-mono">NO STORIES FOUND IN THIS PROTOCOL.</p>
          </div>
        ) : (
          <>
            {/* Featured Post (first post) */}
            {activePosts[0] && (
              <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-muted/10 rounded-2xl overflow-hidden p-6 border border-foreground/5">
                <div className="aspect-video bg-muted/20 rounded-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <span className="bg-brand-lime text-black font-mono text-xs font-bold px-3 py-1 rounded-full">
                      LATEST RELEASE
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <span className="text-muted-foreground font-mono text-xs tracking-wider">
                    {new Date(
                      activePosts[0].publishedAt || activePosts[0].createdAt,
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <Link to={`/blog/${activePosts[0].slug}`}>
                    <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight hover:text-brand-lime transition-colors">
                      {activePosts[0].title}
                    </h2>
                  </Link>
                  <p className="text-muted-foreground leading-relaxed">
                    {activePosts[0].excerpt || `${activePosts[0].content.substring(0, 160)}...`}
                  </p>
                  <Link
                    to={`/blog/${activePosts[0].slug}`}
                    className="text-brand-lime font-bold uppercase tracking-wider text-sm mt-4 hover:underline"
                  >
                    Read Article →
                  </Link>
                </div>
              </div>
            )}

            {/* Grid List (other posts) */}
            {activePosts.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {activePosts.slice(1).map((post: BlogPost) => {
                  const readTime = `${Math.max(1, Math.ceil(post.content.split(" ").length / 200))} min read`;
                  const dateStr = new Date(post.publishedAt || post.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  );
                  return (
                    <article
                      key={post.id}
                      className="group flex flex-col justify-between border-t border-foreground/10 pt-6"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between text-muted-foreground font-mono text-xs">
                          <span>JOURNAL</span>
                          <span>{readTime}</span>
                        </div>
                        <Link to={`/blog/${post.slug}`}>
                          <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-brand-lime transition-colors">
                            {post.title}
                          </h3>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {post.excerpt || `${post.content.substring(0, 100)}...`}
                        </p>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-muted-foreground font-mono text-xs">{dateStr}</span>
                        <Link
                          to={`/blog/${post.slug}`}
                          className="text-brand-lime font-bold uppercase text-xs tracking-wider group-hover:underline"
                        >
                          Read More
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };
