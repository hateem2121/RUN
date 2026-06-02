import type { Route } from "./+types/gallery";

export async function loader({ request }: Route.LoaderArgs) {
  const base = new URL(request.url);
  const get = (path: string) =>
    fetch(new URL(path, base).toString())
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const mediaList = await get("/api/media?limit=30");

  return { mediaList };
}

export function meta() {
  return [
    { title: "Media Gallery | RUN APPAREL" },
    {
      name: "description",
      content: "A visual portfolio demonstrating our precision activewear manufacturing process.",
    },
  ];
}

interface MediaAssetData {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  type: string;
  url?: string;
}

const FALLBACK_IMAGES = [
  { id: -1, title: "Precision Knitting", category: "Manufacturing", url: "" },
  { id: -2, title: "Zero-Waste Pattern Cuts", category: "Design", url: "" },
  { id: -3, title: "Pro Performance Fitting", category: "E-Sportswear", url: "" },
  { id: -4, title: "Aerodynamic Seam Sealing", category: "Innovation", url: "" },
  { id: -5, title: "Certified Organic Cotton Blending", category: "Sustainability", url: "" },
  { id: -6, title: "High-Visibility Teamwear Printing", category: "Product", url: "" },
];

export default function Gallery({ loaderData }: Route.ComponentProps) {
  const { mediaList } = loaderData;

  const list =
    mediaList && Array.isArray(mediaList) && mediaList.length > 0
      ? mediaList.map((m: MediaAssetData) => ({
          id: m.id,
          title: m.originalName || m.filename,
          category: m.type.toUpperCase(),
          url: m.url || `/api/media/${m.id}/content`,
        }))
      : FALLBACK_IMAGES;

  return (
    <div className="w-full bg-background min-h-screen text-foreground py-24 px-4 md:px-8">
      <div className="max-w-container-2xl mx-auto">
        {/* Header */}
        <div className="mb-16 border-b border-foreground/10 pb-8">
          <p className="text-brand-lime font-mono text-xs tracking-widest uppercase mb-2">
            RUN PORTFOLIO
          </p>
          <h1 className="text-[10vw] leading-[0.9] font-bold uppercase md:text-[5vw] tracking-tighter">
            MEDIA GALLERY
          </h1>
        </div>

        {/* Masonry-like Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {list.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden bg-muted/20 rounded-2xl border border-foreground/5"
            >
              {/* Image Source (uses content URL if seeded, otherwise render geometric abstract background) */}
              {img.url ? (
                <img
                  src={img.url}
                  alt={img.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className="absolute inset-0 z-0 pointer-events-none opacity-20"
                  style={{
                    background:
                      "radial-gradient(circle at 70% 30%, var(--color-brand-lime) 0%, transparent 60%)",
                  }}
                />
              )}

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-85 transition-opacity duration-300 group-hover:opacity-95" />

              <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2 z-10">
                <span className="text-brand-lime font-mono text-xs tracking-widest uppercase">
                  {img.category}
                </span>
                <h2 className="text-xl font-bold uppercase tracking-tight text-white group-hover:text-brand-lime transition-colors">
                  {img.title}
                </h2>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };
